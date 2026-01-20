import SocketService from "./services/socket"
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

}

startServer()
