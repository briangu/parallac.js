var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var parallac = require('parallac')

app.get('/', function(req, res){
  res.sendfile('index.html');
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});

io.on('connection', function(socket){
  console.log('a user connected');
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
});

