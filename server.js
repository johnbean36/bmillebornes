const express = require('express');
const http = require('node:http');
const app = express();
const { Server } = require('socket.io');
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000"
    }
});

let usersConnected = new Map();

io.on('connection', (socket)=>{
    console.log('A user connected');
    if(usersConnected.size > 4){
        socket.emit('full');
        socket.disconnect(true);
        console.log('A user was disconnected');
    }
    if(!usersConnected.has(socket.id)){
        usersConnected.set(socket.id, {});
        socket.broadcast.emit('size', usersConnected.size);
        socket.emit('size', usersConnected.size);
    }
    
    socket.on('name', (pName)=>{
        const user = usersConnected.get(socket.id);
        if(user){
            user.name = pName;
        }
    })

    socket.on('disconnect', ()=>{
        console.log('A user disconnected');
        if(usersConnected.has(socket.id)){
            usersConnected.delete(socket.id);
            socket.broadcast.emit('size', usersConnected.size);
        }
    })
})
server.listen(3000, ()=>{
    console.log('listening on localhost:3000');
})