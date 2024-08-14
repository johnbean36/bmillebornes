const app = require('express');
const http = require('http').Server(app);

let usersConnected = [];

io.on('connection', (socket)=>{
    console.log('A user connected');
    if(!usersConnected.includes(socket.id)){
        usersConnected.push(socket.id);
    }
    

    socket.on('disconnect', ()=>{
        console.log('A user disconnected');
        if(usersConnected.includes(socket.id)){
            const index = usersConnected.findIndex((id)=>{
                return id == socket.id
            })
            usersConnected.splice(index, 1);
        }
    })
})
http.listen(3000, ()=>{
    console.log('listening on localhost:3000');
})