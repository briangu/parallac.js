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
          id: req.id,
          result: result
        })
      })
  })

  var port = parseInt(require('url').parse(config.here.config.URI).port)

  http.listen(port, function () {
    console.log('listening on *:'+port)
  })

  io.on('connection', function (socket) {

    let session = {}

    function reportRequestError(req, err) {
      socket.emit('error', {
        req: req,
        error: err
      })
    }

    function createSession(sessionId) {
      session.id = sessionId
      session.Locales = config.Locales.slice(0)
      for (let i = 0; i < config.Locales.length; i++) {
        if (i === config.here.id) {
          session.here = config.here.createSessionContext(sessionId)
          session.here.context().writeln = function () {
            // package all args and send over the wire for a client-side console.log
            let values = [locale.id + ":"]
            for (let k of Object.keys(arguments)) {
              values.push(arguments[k])
            }
            socket.emit('writeln', {
              id: session.id,
              args: JSON.stringify(values)
            })
          }
          session.Locales[i] = session.here
        } else {
          let remoteLocale = session.Locales[i]
          session.Locales[i] = new RemoteLocale(rl.config, rl.id, sessionId)
        }
      }
    }

    function closeSession() {
      config.here.closeSessionContext(session.id)
      session = {}
    }

    socket.on('connect', function (data) {
      console.log("connect", data)
    })

    socket.on('disconnect', function (data) {
      console.log("disconnect", sessionId)
      if (sessionId) {
        closeSession(sessionId)
      }
    })

    socket.on('on', function (req) {
      let here = config.Locales[config.here.id].sessions[req.sessionId]
      if (!here) {
        console.log("on", "session id not found", req.sessionId)
        reportRequestError(req, "session id not found on server")
        return
      }

      reqFn = JSON.parse(req.fn)
      on(here)
        .do(reqFn)
        .then((result) => {
          socket.emit('result', {
            sessionId: req.id,
            requestId: req.requestId,
            result: result
          })
        })
        .catch((err) => {
          console.log('on', 'error', err)
          throw err
        })
    })

    socket.on('createSessionContext', function (req) {
      console.log("createSessionContext", req)
      createSession(req.sessionId)
    })

    socket.on('closeSessionContext', function (req) {
      console.log("closeSessionContext", req)
      closeSession(req.sessionId)
    })
  })
}

parallac
  .init()
  .then(startServer)