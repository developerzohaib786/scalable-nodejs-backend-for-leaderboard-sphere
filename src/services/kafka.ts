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
                    numPartitions: 1,
                    replicationFactor: 1
                }]
            });
            console.log('MESSAGES topic created');
        }
        await admin.disconnect();
    } catch (error) {
        console.error('Error creating topic:', error);
    }

    const consumer = kafka.consumer({ groupId: 'test-group' })

    await consumer.connect()
    await consumer.subscribe({ topic: 'MESSAGES', fromBeginning: true })

    await consumer.run({
        autoCommit: true,

        eachMessage: async ({ message, pause }) => {
            if (!message.value) return;
            console.log({
                value: message.value.toString(),
            })
            try {
                await prisma.message.create({
                    data: {
                        text: message.value?.toString(),
                    },
                });
                console.log('Message saved to database via kafka consumer:', message.value.toString());
            } catch (error) {
                console.error('Error saving message to database:', error);
                pause();
                setTimeout(() => {
                    consumer.resume([{ topic: 'MESSAGES' }]);
                }, 60 * 1000); // Pause for 1 minute before resuming
            }
        },
    })

}