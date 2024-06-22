const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

class Broad {
    constructor(id) {
        this.c = 0;
        this.id = id;
    }
    connection() {
        this.c += 1;
    }
    disconnection() {
        this.c -= 1;
    }
}

class Heap {

    constructor() {
        this.heap = [];
        this.wsidx = {};
    }

    getParentIndex(index) {
        return Math.floor((index - 1) / 4);
    }

    getChildIndices(index) {
        return [
            4 * index + 1,
            4 * index + 2,
            4 * index + 3,
            4 * index + 4
        ];
    }

    swap(index1, index2) {
        [this.heap[index1], this.heap[index2]] = [this.heap[index2], this.heap[index1]];
        [this.wsidx[this.heap[index1].id], this.wsidx[this.heap[index2].id]] = [this.wsidx[this.heap[index2].id], this.wsidx[this.heap[index1].id]];
    }

    insert(value) {
        this.heap.push(value);
        this.wsidx[value.id] = this.heap.length - 1;
        this.heapifyUp();
        this.logDesc()
    }

    heapifyUp() {
        let index = this.heap.length - 1;
        while (index > 0) {
            let parentIndex = this.getParentIndex(index);
            if (this.heap[parentIndex].c > this.heap[index].c) {
                this.swap(parentIndex, index);
                index = parentIndex;
            } else {
                break;
            }
        }
    }

    extractMin() {
        if (this.heap.length === 0) {
            return null;
        }
        if (this.heap.length === 1) {
            return this.heap.pop();
        }
        const min = this.heap[0];
        this.heap[0] = this.heap.pop();
        this.heapifyDown(0);
        return min;
    }

    logDesc() {
        console.log(this.heap.length + " broads");
        this.heap.forEach((e,i) => {
            console.log('level: ' + Math.floor(i/4));
            console.log('broad c: ' + e.c);
            console.log('broad id: ' + e.id);
        });
        console.log(this.wsidx);
    }

    heapifyDown(index) {
        let smallest = index;
        const childrenIndices = this.getChildIndices(index);

        for (let i of childrenIndices) {
            if (i < this.heap.length && this.heap[i].c < this.heap[smallest].c) {
                smallest = i;
            }
        }

        if (smallest !== index) {
            this.swap(index, smallest);
            this.heapifyDown(smallest);
        }
    }
}


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
let voters = [];
let netwrok = new Heap();

const randomViewer = (xcid) => {
    return viewers.filter(e => e != xcid)[Math.floor(Math.random() * (viewers.length - 1))];
};

app.use(express.static(__dirname + '/public'));
app.use(cors({
    origin: "http://localhost:3001" // Allow only this origin to access the server
}));

io.on('connection', socket => {
    console.log(`${socket.id} connected`);

    socket.on('broadcaster', () => {
        broadcaster = socket.id;
        netwrok = new Heap(socket.id);
        netwrok.insert(new Broad(socket.id));
        socket.broadcast.emit('broadcaster');
    });

    socket.on('peered', () => {
        let broadId = netwrok.wsidx[socket.id];
        netwrok.heap[broadId].connection();
        netwrok.logDesc();
    });

    socket.on('vote', () => {
        if (!voters.includes(socket.id)) {
            voters.push(socket.id);
        }
        if (voters.length > (viewers.length/2)) {
            console.log(voters.length)
            console.log('Rotate');
            voters = [];
            console.log('voters reset to ' + voters.length)
        }
        console.log(voters.length + ' votes')
    });

    socket.on('watcher', () => {
        viewers.push(socket.id);
        socket.emit('role', 'viewer');
        socket.to(broadcaster).emit('watcher', socket.id);
        if ((netwrok.heap.length > 0 )&&(netwrok.heap[netwrok.heap.length - 1].c > 2)) {
            console.log('[!] branch time');
            // turn watchers into broads
        }
    });

    socket.on('offer', (id, message) => {
        socket.to(id).emit('offer', socket.id, message);
    });

    socket.on('answer', (id, message) => {
        socket.to(id).emit('answer', socket.id, message);
    });

    socket.on("rotate", () => {
        console.log("rototototo");
        socket.to(randomViewer(socket.id)).emit('selected');
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
            voters = voters.filter(voter => voter !== socket.id);

            socket.to(broadcaster).emit('disconnectPeer', socket.id);
        }
        console.log(`${socket.id} disconnected`);
    });

});

server.listen(3000, () => {
    console.log('Server is running on port 3000');
});

