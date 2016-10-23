var app = require('express')()
var http = require('http').Server(app)
var io = require('socket.io')(http)
var parallac = require('../lib/parallac')
var on = parallac.on
var writeln = console.log
var uuid = require('uuid')

function startServer(config) {
  console.log("hello")

  app.get('/', function (req, res) {
    res.sendfile('index.html')
  })

  app.post('/event', function (req, res) {
    console.log("post handler", data)
    var req = JSON.parse(data)
    reqFn = JSON.parse(req.fn)
    on(config.Locales[0])
      .do(reqFn)
      .then((result) => {
        res.send({
          id: sessionId,
          result: result
        })
      })
  })

  http.listen(3000, function () {
    console.log('listening on *:3000')
  })

  io.on('connection', function (socket) {

    function reportRequestError(req, err) {
      socket.emit('error', {
        req: req,
        error: err
      })
    }

    let sessionId
    let sessionLocales = config.Locales

    socket.on('session', function (data) {
      sessionId = data.id

      sessionLocales = parallac.createSession(config, sessionId)
        // .then((sl) => sessionLocales = sl)
    })

    socket.on('disconnect', function () {
      if (sessionId) {
        parallac.closeSession(sessionId)
      }
    })

    socket.on('on', function (req) {
      if (req.id !== sessionId) {
        console.log("on", "session id not found", req.id)
        reportRequestError(req, "session id not found on server")
        return
      }

      reqFn = JSON.parse(req.fn)
      let here = sessionLocales[config.here.id]
      on(here)
        .do(reqFn)
        .then((result) => {
          socket.emit('result', {
            id: req.id,
            requestId: req.requestId,
            result: result
          })
        })
        .catch((err) => {
          console.log('on', 'error', err)
          throw err
        })
    })
  })
}

parallac
  .init()
  .then(startServer)