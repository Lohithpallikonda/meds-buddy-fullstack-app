const express = require('express')
const http = require('http')
const cors = require('cors')
const path = require('path')
require('dotenv').config()

const { initializeDatabase } = require('./src/models/database')
const SocketServer = require('./src/websocket/socketServer')

const authRoutes = require('./src/routes/auth')
const medicationRoutes = require('./src/routes/medications')
const realtimeRoutes = require('./src/routes/realtime')

const app = express()
const server = http.createServer(app)

const socketServer = new SocketServer(server)
app.locals.socketServer = socketServer

app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:3000" }))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

app.use('/api/auth', authRoutes)
app.use('/api/medications', medicationRoutes)
app.use('/api/realtime', realtimeRoutes)

app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the MedsBuddy API!',
    version: '3.0.0',
    status: 'running',
    realtime_status: socketServer.getConnectedUsersCount() > 0 ? 'connected' : 'idle',
  })
})

const PORT = process.env.PORT || 5000
initializeDatabase()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`)
      console.log(`🔌 WebSocket server initialized`)
    })
  })
  .catch(err => {
    console.error('❌ Failed to initialize database and start server:', err)
    process.exit(1)
  })