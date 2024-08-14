const app = require('express');
const http = require('http').Server(app);


io.on('connection', (socket)=>{
    console.log('A user connected');

    socket.on('disconnect', ()=>{
        console.log('A user disconnected');
    })
})
http.listen(3000, ()=>{
    console.log('listening on localhost:3000');
})