const express = require('express');
const http = require('node:http');
const app = express();
const { Server } = require('socket.io');
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173"
    }
});

let usersConnected = new Map();
let currentRooms = [];
let gameNumber = new Map();
let user;

function startGame(room){

}

function addRoom(){
    let count = 0;
    while(1){
        let room = Math.floor(Math.random() * 100000);
        if(!currentRooms.includes(room)){
            currentRooms.push(room);
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
    let roomData;
    let gameData;
    console.log('A user connected');
    if(!usersConnected.has(socket.id)){
        usersConnected.set(socket.id, {name: ""});
    }
    if(currentRooms.length === 0){
        let error = addRoom();
        if(error === true){
            socket.emit('message', "error creating room");
        }
        else{
            let room = currentRooms[0];
            socket.join(room);
            roomData = io.sockets.adapter.rooms.get(room);
            socket.emit("own_id", socket.id);
            io.to(room).emit("size", roomData.size);
            gameData = gameNumber.get(room);
            gameData.players = [];
            gameData.players.push(socket.id);
            user = usersConnected.get(socket.id);
            user.room = room;
            return;
            }
    }
    else if(currentRooms.length > 0){
        let joined = false;
        currentRooms.forEach((room)=>{
        roomData = io.sockets.adapter.rooms.get(room);
        if(roomData && roomData.size < 4){
            gameData = gameNumber.get(room);
            if(gameData.started == false){
                socket.join(room);
                socket.emit("own_id", socket.id);
                io.to(room).emit("size", roomData.size);
                if(!gameData.players){
                    gameData.players = [];
                }
                gameData.players.push(socket.id);
                user = usersConnected.get(socket.id);
                user.room = room;
                if(roomData.size === 4){
                    startGame(room);
                }
                joined = true;
                }
            }
        })
        if(joined === false){
            let error = addRoom();
            if(error === true){
                socket.emit("message", "error creating room");
                console.log("error");
                return;
            }
            let room = currentRooms[currentRooms.length - 1];
            socket.join(room)
            roomData = io.sockets.adapter.rooms.get(room);
            socket.emit("own_id", socket.id);
            io.to(room).emit("size", roomData.size);
            if(roomData && roomData.size < 4){
                let gameData = gameNumber.get(room);
                if(gameData.started == false){
                    if(!gameData.players){
                        gameData.players = [];
                    }
                    gameData.players.push(socket.id);
                    user = usersConnected.get(socket.id);
                    user.room = room;
                }
            }
        }
    }

    socket.on('name', (pName)=>{
        user = usersConnected.get(socket.id);
        let gameData;
        if(user){
            user.name = pName;
            socket.to(user.room).emit('new_user', {'name': pName, "id": socket.id});
            gameData = gameNumber.get(user.room);
            if(gameData.players.length > 1){
                gameData.players.forEach((player)=>{
                    if(player != socket.id){
                        socket.emit("new_user", {name: `${usersConnected.get(player)}`, id: player});
                    }
                });
            }
        }
    })

    socket.on('disconnect', ()=>{
        console.log('A user disconnected');
        if(usersConnected.has(socket.id)){
            user = usersConnected.get(socket.id);
            let game = gameNumber.get(user.room);
            if(game){
                let index = game.players.findIndex((player) => player === socket.id);
                game.players.splice(index, 1);
                io.to(user.room).emit('size', game.players.length);
                if(game.players.length === 0){
                    let roomIndex = currentRooms.findIndex((room)=> room === game);
                    if(roomIndex !== -1){
                        currentRooms.splice(roomIndex, 1);
                    }
                    gameNumber.delete(user.room);
                }

            }
            usersConnected.delete(socket.id);
        }
    })

})
 

server.listen(3000, ()=>{
    console.log('listening on localhost:3000');
})