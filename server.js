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
let broadcastery;
let viewers = [];
let voters = [];

const randomViewer = (xcid) => {
    let rando = viewers.filter(e => e != xcid)[Math.floor(Math.random() * (viewers.length - 1))];
    broadcastery = rando;
    console.log(rando + ' was randomly selected to be next')
    return rando;
};

app.use(express.static(__dirname + '/public'));
app.use(cors({
    origin: "http://localhost:3001" // Allow only this origin to access the server
}));

io.on('connection', socket => {
    console.log(`${socket.id} connected`);
    if (!broadcaster) {
        console.log(`offering broadcast`);
        socket.emit('selected');
    }

    socket.on('vote', () => {

        if (!voters.includes(socket.id)) {
            voters.push(socket.id);
            console.log('there are now ' + voters.length + ' votes');
            voters.forEach(e => {
                console.log(e)
            });
        }



        if (voters.length > (viewers.length / 5)) {
            io.to(randomViewer()).emit('selected');
        }
    });


    socket.on('broadcaster', () => {
        if (broadcaster) {
            console.log(socket.id + ' has taken the stick')
            viewers = [];
            voters = [];
        }
        broadcaster = socket.id;
        socket.broadcast.emit('broadcaster', socket.id);
    });

    socket.on('selected', () => {
        console.log(socket.id + " has taken the stick");
    });

    socket.on('watcher', () => {
        viewers.push(socket.id);
        socket.emit('role', 'viewer');
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

    socket.on("rotate", () => {
        console.log("rototototo");
        socket.to(randomViewer(socket.id)).emit('selected');
    });

    socket.on('disconnect', () => {

        if (socket.id === broadcaster) {
            broadcaster = null;
            io.emit('selected');
            io.emit('broadcaster');
        } else if (socket.id === broadcastery) {
            broadcastery = null;
            socket.to(randomViewer(socket.id)).emit('selected');
        } else {
            viewers = viewers.filter(viewer => viewer !== socket.id);
            voters = voters.filter(voter => voter !== socket.id);

            socket.to(broadcaster).emit('disconnectPeer', socket.id);
        }
        console.log(`${socket.id} disconnected`);
    });

});

server.listen(3000, () => {
    console.log('Server is running on port 3000');
});

