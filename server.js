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
    let user;
    let roomData;
    let gameData;
    console.log('A user connected');
    if(!usersConnected.has(socket.id)){
        usersConnected.set(socket.id, {name: ""});
    }
    if(currentRooms.length === 0){
        let error = addRoom();
        if(error === true){
            socket.emit("error", "Could not create room");
            console.log("error");
        }
        else{
            let room = currentRooms[0];
            socket.join(room);
            roomData = io.sockets.adapter.rooms.get(room);
            socket.emit("own_id", socket.id);
            gameData = gameNumber.get(room);
            gameData.players = [];
            gameData.players.push(socket.id);
            user = usersConnected.get(socket.id);
            user.room = room;
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
                socket.emit("own_id", socket.id)
                if(!gameData.players){
                    gameData.players = [];
                }
                gameData.players.push(socket.id);
                user = usersConnected.get(socket.id);
                user.room = room;
                if(roomData.size === 4){
                    io.to(room).emit("start");
                }
                joined = true;
                }
            }
        })
        if(joined === false){
            let error = addRoom();
            if(error === true){
                socket.emit("error", "Error creating room");
                console.log("error");
                return;
            }
            let room = currentRooms[currentRooms.length - 1];
            socket.join(room)
            roomData = io.sockets.adapter.rooms.get(room);
            socket.emit("own_id", socket.id);
            if(roomData && roomData.size < 4){
                gameData = gameNumber.get(room);
                if(gameData.started == false){
                    if(!gameData.players){
                        gameData.players = [];
                    }
                    gameData.players.push(socket.id);
                    io.to(room).emit("size", gameData.players.length);
                    user = usersConnected.get(socket.id);
                    user.room = room;
                }
            }
        }
    }
    socket.on('name', (pName)=>{
        user = usersConnected.get(socket.id);
        user.name = pName;
        let playerNames = [];
        if(user){
            gameData = gameNumber.get(user.room);
            gameData.players.forEach((player)=>{
                user = usersConnected.get(player);
                playerNames.push(user.name);
            })
            user = usersConnected.get(socket.id);
            io.to(user.room).emit("new_user", {names: playerNames, ids: gameData.players});
        }
    })

    socket.on('get_names', ()=>{
        const user = usersConnected.get(socket.id);
        const gameData = gameNumber.get(user.room);
        if(gameData && gameData.players){
            socket.emit('snames', gameData.players);
        }
    })

    socket.on('fdeal', ()=>{
        user = usersConnected.get(socket.id);
        gameData = gameNumber.get(user.room);
        let temp = [];
        if(gameData.deck){
            temp = [];
            for(let x = 0; x < 6; x++){
                temp.push(gameData.deck[gameData.index])
                gameData.index += 1;
            }
            socket.emit('new_deck', temp);
        }
        else{
            gameData.deck = [];
            for(let i = 0; i < 105; i++){
                temp.push(i);
            }
            gameData.deck = temp.sort(()=> 0.5 - Math.random());
            temp = [];
            gameData.index = 0;
            for(let x = 0; x < 6; x++){
                temp.push(gameData.deck[gameData.index])
                gameData.index += 1;
            }
            socket.emit('new_deck', temp);
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