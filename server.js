var app = require('express')();
var http = require('http').Server(app)
var io = require('socket.io')(http)
var parallac = require('./parallac')
var on = parallac.on
var writeln = console.log

// TODO: sessions
// TODO: remote locales

function startServer(config) {
  console.log("hello")

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
    socket.on('event', function (data) {
      console.log(data)
      var req = JSON.parse(data)
      reqFn = JSON.parse(req.fn)
      on(config.Locales[0])
        .do(reqFn)
        .then((result) => {
          socket.emit('event', {
            id: req.id,
            result: result
          })
        })
    })
  });
}

parallac
  .init()
  .then(startServer)
