var app = require('express')()
var http = require('http').Server(app)
var io = require('socket.io')(http)
var parallac = require('../lib/parallac')
var on = parallac.on
var writeln = console.log
var uuid = require('uuid')

function startServer(config) {
  writeln("hello")

  app.get('/', function (req, res) {
    res.sendfile('index.html')
  })

  app.post('/event', function (req, res) {
    writeln("post handler", data)
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
    writeln('listening on *:'+port)
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
      writeln("createSession", "for session id", sessionId)
      if (session.id) {
        throw "WARNING: session already exists:" + session.id
      }
      session.id = sessionId
      session.Locales = config.Locales.slice(0)
      return config.here.createSessionContext(sessionId)
        .then((here) => {
          session.here = here
          for (let i = 0; i < session.Locales.length; i++) {
            if (i === here.id) {
              session.Locales[session.here.id] = session.here
              session.here.context().writeln = function () {
                // package all args and send over the wire for a client-side console.log
                let values = [session.here.id + ":"]
                for (let k of Object.keys(arguments)) {
                  values.push(arguments[k])
                }
                socket.emit('writeln', {
                  id: session.id,
                  args: JSON.stringify(values)
                })
              }
            } else {
              writeln("createSession", "remote proxy", i)
              session.Locales[i] = session.Locales[i].createSessionProxy(session.id)
            }
          }

          for (let i = 0; i < session.Locales.length; i++) {
            session.Locales[i].Locales = session.Locales
          }

          writeln("createSession", "session.here", session.here)
        })
        .catch((err) => {
          writeln("createSession", "error", err)
          throw err
        })
    }

    function closeSession() {
      writeln("closeSession", session.id)
      if (session.id) {
        config.here.closeSessionContext(session.id)
        session = {}
      }
    }

    socket.on('error', function (data) {
      writeln("error", data)
    })

    socket.on('connect', function (data) {
      writeln("connect", data)
    })

    socket.on('disconnect', function (data) {
      writeln("disconnect", session.id)
      if (session.id) {
        closeSession(session.id)
      }
    })

    socket.on('on', function (req) {
      console.log("server", "on", req, Object.keys(config.here.sessions))
      reqFn = JSON.parse(req.fn)
      let here = session.here || config.here.sessions[req.sessionId]
      writeln("server", "on", "here", session.here)
      on(here)
        .do(reqFn)
        .then((result) => {
          socket.emit('result', {
            sessionId: session.id,
            requestId: req.requestId,
            result: result
          })
        })
        .catch((err) => {
          writeln('on', 'error', err)
          throw err
        })
    })

    socket.on('createSessionContext', function (req) {
      writeln("createSessionContext", req)
      createSession(req.sessionId)
    })

    socket.on('closeSessionContext', function (req) {
      writeln("closeSessionContext", req)
      closeSession(req.sessionId)
    })
  })
}

parallac
  .init()
  .then(startServer)