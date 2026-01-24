import 'dotenv/config';
import express from 'express';
import SocketService from "./services/socket"
import { startMessageConsumer } from "./services/kafka"
import http from 'http'
import cloudinaryRoutes from './routes/cloudinary';
import messagesRoutes from './routes/messages';

// Initialize Express app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware to allow frontend requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Routes
app.use('/api/cloudinary', cloudinaryRoutes);
app.use('/api/messages', messagesRoutes);

// Health check route
app.get('/', (req, res) => {
  res.send('Hello World from developer zohaib');
});

// Create HTTP server with Express
const httpServer = http.createServer(app);
const port = process.env.PORT || 3001


async function startServer() {
  const socketService = new SocketService();

  socketService.io.attach(httpServer)


  httpServer.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
    console.log(`Cloudinary routes available at http://localhost:${port}/api/cloudinary`)
    console.log(`Messages routes available at http://localhost:${port}/api/messages`)
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
