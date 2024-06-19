const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "http://localhost:3001",
        methods: ["GET", "POST"],
        allowedHeaders: ["my-custom-header"],
        credentials: true
    }
});

let broadcaster;
let viewers = [];

app.use(express.static(__dirname + '/public'));
app.use(cors({
    origin: "http://localhost:3001" // Allow only this origin to access the server
}));

io.on('connection', socket => {
    console.log(`${socket.id} connected`);

    if (!broadcaster) {
        broadcaster = socket.id;
        socket.emit('role', 'broadcaster');
    } else {
        viewers.push(socket.id);
        socket.emit('role', 'viewer');
    }

    socket.on('broadcaster', () => {
        broadcaster = socket.id;
        socket.broadcast.emit('broadcaster');
    });

    socket.on('watcher', () => {
        socket.to(broadcaster).emit('watcher', socket.id);
    });

    socket.on('offer', (id, message) => {
        socket.to(id).emit('offer', socket.id, message);
    });

    socket.on('answer', (id, message) => {
        socket.to(id).emit('answer', socket.id, message);
    });

    socket.on('candidate', (id, message) => {
        socket.to(id).emit('candidate', socket.id, message);
    });

    socket.on('disconnect', () => {
        if (socket.id === broadcaster) {
            broadcaster = null;
            io.emit('broadcaster');
        } else {
            viewers = viewers.filter(viewer => viewer !== socket.id);
            socket.to(broadcaster).emit('disconnectPeer', socket.id);
        }
        console.log(`${socket.id} disconnected`);
    });
});

server.listen(3000, () => {
    console.log('Server is running on port 3000');
});
