import express from 'express'
import cors from 'cors'
import http from 'http'
import {Server} from 'socket.io'
import "dotenv/config"
import { connectDB } from './config/database.js'

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        methods: ["GET", "POST"]
    }
})

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({extended: true}))

const PORT = process.env.PORT || 4001;
connectDB();
server.listen(PORT,()=>{
    console.log(`SERVER Running on PORT ${PORT}`)
})