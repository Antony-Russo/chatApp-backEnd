const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);

mongoose.connect('mongodb+srv://russopaul771:36UUuTX8uxKK8a0M@cluster0.ochpu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => console.log('Error connecting to MongoDB:', err));

let users = [];

app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log('A user connected: ' + socket.id);

    socket.on('joinRoom', ({ username, room }) => {
        socket.join(room);
        users.push({ id: socket.id, username });
        io.to(room).emit('userList', users);

        socket.on('sendMessage', (messageData) => {
            console.log('Message received:', messageData);  
            io.to(messageData.room).emit('message', messageData); 
        });

        socket.on('typing', (username) => {
            socket.broadcast.to(room).emit('typingIndicator', username);
        });

        socket.on('disconnect', () => {
            users = users.filter((user) => user.id !== socket.id);
            io.to(room).emit('userList', users);
        });
    });
});

server.listen(5000, () => console.log('Server running on port 5000'));
