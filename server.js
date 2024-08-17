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
let currentRooms = [];
let gameNumber = new Map();

function addRoom(){
    let count = 0;
    while(1){
        let room = Math.floor(Math.random() * 100000);
        if(!currentRooms.has(room)){
            currentRooms.set(room);
            gameNumber.set(room, {started: false});
            return false;
        }
        if(count > 10){
            return true;
        }
        count += 1;
    }
    
}

io.on('connection', (socket)=>{
    console.log('A user connected');
    if(currentRooms.size === 0){
        let error = addRoom();
        if(error === true){
            socket.emit('full');
        }
        else{
            currentRooms.forEach((room)=>{
                let roomData = io.sockets.adapter.rooms.get(room);
                if(roomData && roomData.size < 4){
                    let gameData = gameNumber.get(room);
                    if(gameData.started == false){
                        socket.join(room);
                        if(!gameData.players){
                            gameData.players = [];
                        }
                        gameData.players.push(socket.id);
                    }
                }
            })
        }
    }
    else{

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
            socket.broacast.emit('new_user', usersConnected);
            socket.emit('new_user', usersConnected);
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