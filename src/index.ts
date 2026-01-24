import 'dotenv/config';
import SocketService from "./services/socket"
import { startMessageConsumer } from "./services/kafka"
import http from 'http'
const httpServer = http.createServer()
const port = process.env.PORT || 3001


async function startServer() {
  httpServer.on('request', (req: any, res: any) => {
    // res.writeHead(200, { 'Content-Type': 'text/plain' })
    res.end('Hello World from developer zohaib')
  })

  const socketService = new SocketService();

  socketService.io.attach(httpServer)


  httpServer.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
  })

  socketService.initListeners()

  // Start Kafka consumer for message persistence
  try {
    await startMessageConsumer();
    console.log('✓ Kafka consumer initialized successfully');
  } catch (error) {
    console.error('✗ Failed to start Kafka consumer:', error);
  }
}

startServer()
