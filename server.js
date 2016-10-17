var app = require('express')();
var http = require('http').Server(app)
var io = require('socket.io')(http)
var parallac = require('./parallac')
var on = parallac.on
var writeln = console.log

var fn = () => {
  writeln()
  writeln("test: hello from each locale")
  for (let locale of Locales) {
    on(locale).do(() => writeln("hello from locale", here.id))
  }
}

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
    on(config.Locales[0]).do(fn)
  });
}

parallac.init()
  .then((config) => {
    console.log("starting server")
    startServer(config)
  })
