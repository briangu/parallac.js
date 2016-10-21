var app = require('express')();
var http = require('http').Server(app)
var io = require('socket.io')(http)
var parallac = require('../lib/parallac')
var on = parallac.on
var writeln = console.log

// TODO: sessions
// TODO: remote locales

function startServer(config) {
  console.log("hello")

  // PROTO: rewrite writeln to remote over ws

  app.get('/', function (req, res) {
    res.sendfile('index.html');
  });

  app.post('/event', function (req, res) {
    console.log("post handler", data)
    var req = JSON.parse(data)
    reqFn = JSON.parse(req.fn)
    on(config.Locales[0])
      .do(reqFn)
      .then((result) => {
        res.send({
          id: req.id,
          result: result
        })
      })
  });

  http.listen(3000, function () {
    console.log('listening on *:3000');
  });

  io.on('connection', function (socket) {
    console.log('a user connected');
    socket.on('disconnect', function () {
      console.log('user disconnected');
    });
    socket.on('run', function (data) {
      var req = JSON.parse(data)
      reqFn = JSON.parse(req.fn)
      // TODO: req.id should be generated here and sent back to client
      var sessionLocales = config.Locales.map((locale) => locale.createSessionContext(req.id))
      for (let locale of sessionLocales) {
        locale.context().Locales = sessionLocales
        locale.context().writeln = function () {
          // package all args and send over the wire for a client-side console.log
          let values = [locale.id + ":"]
          for (let k of Object.keys(arguments)) {
            values.push(arguments[k])
          }
          socket.emit('writeln', {
            id: req.id,
            args: JSON.stringify(values)
          })
        }
      }
      on(sessionLocales[0], req.id)
        .do(reqFn)
        .then((result) => {
          socket.emit('result', {
            id: req.id,
            result: result
          })
        })
        .then(() => {
          config.Locales.forEach((locale) => locale.destroySessionContext(req.id))
        })
        .catch(() => {
          config.Locales.forEach((locale) => locale.destroySessionContext(req.id))
        })
    })
  });
}

parallac
  .init()
  .then(startServer)