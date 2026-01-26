import { Kafka, Producer } from "kafkajs";
import fs from "fs";
import path from "path";
import { aw } from "@upstash/redis/zmscore-0SAuWM0q";
import prisma from "./prisma";

const kafka = new Kafka({
    clientId: 'leaderboard-sphere',
    ssl: {
        ca: [fs.readFileSync(path.resolve(__dirname, '../../ca.pem'), 'utf-8')],
    },
    sasl: {
        mechanism: 'plain',
        username: process.env.Kafka_Username || '',
        password: process.env.Kafka_Password || ''
    },
    brokers: ['kafka-1001491d-zohaibirshad678-35eb.c.aivencloud.com:13081']
});

let producer: null | Producer = null;

export async function createKafkaProducer() {
    if (producer) return producer;
    const _producer = kafka.producer()
    await _producer.connect()
    producer = _producer;
    console.log('Kafka Producer connected');
    return producer;
}

export async function produceMessage(message: string) {
    const producer = await createKafkaProducer();
    producer.send({
        topic: 'MESSAGES',
        messages: [{ key: `message-${Date.now()}`, value: message }],
    });
    console.log('Message produced to Kafka topic MESSAGES:', message);
    return true;
}

// Helper function to ensure room exists in database
async function ensureRoomExists(roomName: string) {
    try {
        let room = await prisma.room.findFirst({
            where: { name: roomName }
        });

        if (!room) {
            room = await prisma.room.create({
                data: { name: roomName }
            });
            console.log(`Created new room: ${roomName}`);
        }

        return room;
    } catch (error) {
        console.error(`Error ensuring room exists: ${roomName}`, error);
        throw error;
    }
}

export async function startMessageConsumer() {
    console.log('Starting Kafka consumer...');

    // Create admin client to ensure topic exists
    const admin = kafka.admin();
    try {
        await admin.connect();
        console.log('Admin client connected');

        // Create topic if it doesn't exist
        const topics = await admin.listTopics();
        if (!topics.includes('MESSAGES')) {
            console.log('Creating MESSAGES topic...');
            await admin.createTopics({
                topics: [{
                    topic: 'MESSAGES',
                    numPartitions: 4, // Increased partitions for better scalability
                    replicationFactor: 1
                }]
            });
            console.log('MESSAGES topic created');
        }
        await admin.disconnect();
    } catch (error) {
        console.error('Error creating topic:', error);
    }

    const consumer = kafka.consumer({
        groupId: 'chat-messages-consumer-group',
        sessionTimeout: 30000,
        heartbeatInterval: 3000
    })

    await consumer.connect()
    console.log('Kafka consumer connected');

    await consumer.subscribe({
        topic: 'MESSAGES',
        fromBeginning: false // Only consume new messages for production
    })

    await consumer.run({
        autoCommit: true,
        eachMessage: async ({ topic, partition, message, pause }) => {
            if (!message.value) return;

            const rawMessage = message.value.toString();
            console.log(`[Kafka Consumer] Received message from partition ${partition}:`, rawMessage);

            try {
                // Parse the message data: { message: "text", room: "room1", userName: "John", userImage: "url", userId: "id" }
                const messageData = JSON.parse(rawMessage);
                const { message: messageText, room: roomName, userName, userImage, userId } = messageData;

                if (!messageText || !roomName) {
                    console.error('Invalid message format:', messageData);
                    return;
                }

                // Ensure the room exists in the database
                const room = await ensureRoomExists(roomName);

                // Store the message in PostgreSQL
                await prisma.message.create({
                    data: {
                        text: messageText,
                        userName: userName || 'Anonymous',
                        userImage: userImage || 'https://avatar.iran.liara.run/public/1',
                        userId: userId || 'anonymous',
                        roomId: room.id,
                    },
                });

                console.log(`✓ Message saved to PostgreSQL for room "${roomName}" from ${userName} (${userId}):`, messageText);
            } catch (error) {
                console.error('Error processing message from Kafka:', error);

                // Pause consumer on error to prevent message loss
                pause();
                console.log('Consumer paused due to error, will resume in 10 seconds...');

                setTimeout(() => {
                    consumer.resume([{ topic: 'MESSAGES' }]);
                    console.log('Consumer resumed');
                }, 10000); // Reduced to 10 seconds for better recovery
            }
        },
    })

    console.log('Kafka consumer is now listening for messages...');
}