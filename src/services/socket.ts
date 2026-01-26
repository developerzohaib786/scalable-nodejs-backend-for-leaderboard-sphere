import { Server } from 'socket.io'
import Redis from "ioredis"
import prisma from './prisma';
import { produceMessage } from './kafka';

// i am using upstash for spinning redis stance

const pub = new Redis("rediss://default:AR0pAAImcDI0ZDIyZjZjNTNkYmU0ZmIzYmNlMTg5ZDZiOThjZTM2YXAyNzQ2NQ@central-bulldog-7465.upstash.io:6379");

const sub = new Redis("rediss://default:AR0pAAImcDI0ZDIyZjZjNTNkYmU0ZmIzYmNlMTg5ZDZiOThjZTM2YXAyNzQ2NQ@central-bulldog-7465.upstash.io:6379");

// Define 4 rooms
const ROOMS = ['room1', 'room2', 'room3', 'room4'];

class SocketService {
    private _io: Server;

    constructor() {
        this._io = new Server(
            { cors: { allowedHeaders: '*', origin: "*" } }
        );
        console.log('Socket.io server initialized');

        // Subscribe to all room channels
        ROOMS.forEach(room => {
            sub.subscribe(`MESSAGES:${room}`);
            console.log(`Subscribed to Redis channel: MESSAGES:${room}`);
        });
    }


    public initListeners() {
        const io = this.io;
        console.log('Initializing socket listeners...');

        // Subscribe to Redis messages once (not per connection)
        sub.on('message', async (channel, message) => {
            console.log(`Redis message received on channel ${channel}:`, message);

            // Check which room the message belongs to
            ROOMS.forEach(room => {
                if (channel === `MESSAGES:${room}`) {
                    console.log(`Broadcasting message to room ${room}:`, message);
                    // Emit to specific room
                    io.to(room).emit('message', message);
                }
            });
        });

        io.on('connection', (socket) => {
            console.log(`New socket connected: ${socket.id}`);

            // Handle joining a room
            socket.on('join:room', ({ room }: { room: string }) => {
                if (ROOMS.includes(room)) {
                    socket.join(room);
                    console.log(`Socket ${socket.id} joined room: ${room}`);
                    socket.emit('room:joined', { room });
                } else {
                    console.log(`Invalid room: ${room}`);
                    socket.emit('room:error', { message: 'Invalid room' });
                }
            });

            // Handle leaving a room
            socket.on('leave:room', ({ room }: { room: string }) => {
                socket.leave(room);
                console.log(`Socket ${socket.id} left room: ${room}`);
            });

            // Handle room-specific messages
            socket.on('event:message', async ({ message, room, userName, userImage, userId, imageUrl, videoUrl, rawFileUrl, replyToId, replyToText }: {
                message: string,
                room: string,
                userName: string,
                userImage: string,
                userId: string,
                imageUrl?: string,
                videoUrl?: string,
                rawFileUrl?: string,
                replyToId?: string,
                replyToText?: string
            }) => {
                console.log(`Received message for room ${room} from ${userName} (${userId}):`, message);

                if (!ROOMS.includes(room)) {
                    console.log(`Invalid room: ${room}`);
                    return;
                }

                const messageData = JSON.stringify({
                    message,
                    room,
                    userName,
                    userImage,
                    userId,
                    imageUrl,
                    videoUrl,
                    rawFileUrl,
                    replyToId,
                    replyToText
                });

                // Publish the message to Redis for the specific room
                await pub.publish(`MESSAGES:${room}`, messageData);
                console.log(`Message published to Redis channel MESSAGES:${room}`);

                // Also send to Kafka for persistent storage
                try {
                    await produceMessage(messageData);
                    console.log('Message sent to Kafka');
                } catch (error) {
                    console.error('Failed to send message to Kafka:', error);
                }
            });
        });
    }

    get io() {
        return this._io;
    }



}

export default SocketService;

