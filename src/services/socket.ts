import { Server } from 'socket.io'
import Redis from "ioredis"

// i am using upstash for spinning redis stance

const pub = new Redis("rediss://default:AR0pAAImcDI0ZDIyZjZjNTNkYmU0ZmIzYmNlMTg5ZDZiOThjZTM2YXAyNzQ2NQ@central-bulldog-7465.upstash.io:6379");

const sub = new Redis("rediss://default:AR0pAAImcDI0ZDIyZjZjNTNkYmU0ZmIzYmNlMTg5ZDZiOThjZTM2YXAyNzQ2NQ@central-bulldog-7465.upstash.io:6379");

class SocketService {
    private _io: Server;

    constructor() {
        this._io = new Server(
            { cors: { allowedHeaders: '*', origin: "*" } }
        );
        console.log('Socket.io server initialized');
        sub.subscribe('MESSAGES');
    }


    public initListeners() {
        const io = this.io;
        console.log('Initializing socket listeners...');

        // Subscribe to Redis messages once (not per connection)
        sub.on('message', (channel, message) => {
            if (channel === 'MESSAGES') {
                console.log('Broadcasting message to clients:', message);
                io.emit('message', message);
            }
        });

        io.on('connection', (socket) => {
            console.log(`New socket connected: ${socket.id}`);

            socket.on('event:message', async ({ message }: { message: string }) => {
                console.log(`Received message:`, message);
                // Publish the message to Redis
                await pub.publish('MESSAGES', JSON.stringify({ message }));
                console.log('Message published to Redis channel MESSAGES');
            });
        });
    }

    get io() {
        return this._io;
    }



}

export default SocketService;

