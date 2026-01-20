import { Server } from 'socket.io'

class SocketService {
    private _io: Server;

    constructor() {
        this._io = new Server();
        console.log('Socket.io server initialized');
    }


    public initListeners() {
        const io = this.io;
        console.log('Initializing socket listeners...');

        io.on('connection', (socket) => {
            console.log(`New socket connected: ${socket.id}`);

            socket.on('event:message', async ({ message }: { message: string }) => {
                console.log(`Received message:`, message);
            });

        });
    }

    get io() {
        return this._io;
    }



}

export default SocketService;

