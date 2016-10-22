var app = require('express')()
var http = require('http').Server(app)
var io = require('socket.io')(http)
var parallac = require('../lib/parallac')
var on = parallac.on
var writeln = console.log
var uuid = require('uuid')

// TODO: sessions
// TODO: remote locales

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

  http.listen(3000, function () {
    console.log('listening on *:3000')
  })

  io.on('connection', function (socket) {
    console.log('a user connected')

    function createSession(sessionId) {
      var sessionLocales = config.Locales.map((locale) => locale.createSessionContext(sessionId))
      for (let locale of sessionLocales) {
        locale.context().Locales = sessionLocales
        locale.context().writeln = function () {
          // package all args and send over the wire for a client-side console.log
          let values = [locale.id + ":"]
          for (let k of Object.keys(arguments)) {
            values.push(arguments[k])
          }
          socket.emit('writeln', {
            id: sessionId,
            args: JSON.stringify(values)
          })
        }
      }
      return sessionLocales
    }

    function destroySession(sessionId) {
      console.log("destroying session", sessionId)
      config.Locales.forEach((locale) => locale.destroySessionContext(sessionId))
    }

    var sessions = {}

    socket.on('connect', function () {
      console.log('user connected')
    })

    socket.on('disconnect', function () {
      console.log('user disconnected')
      let remainingSessions = Object.keys(sessions)
      if (remainingSessions.length > 0) {
        console.log("abandoning sessions: ", remainingSessions)
        remainingSessions.forEach((sessionId) => {
          destroySession(sessionId)
          delete sessions[sessionId]
        })
      }
    })

    socket.on('create_session', function (req) {
      console.log("creating session", req.id)

      if (req.id in sessions) {
        console.log("WARNING: session id already exists!", req.id)
      }

      sessions[req.id] = createSession(req.id)
    })

    socket.on('destroy_session', function (req) {
      destroySession(req.id)
      delete sessions[req.id]
    })

    socket.on('on', function (req) {
      reqFn = JSON.parse(req.fn)
      let sessionLocales = sessions[req.id]
      if (sessionLocales) {
        let here = sessionLocales[0] // TODO: find here

        on(here, req.id)
          .do(reqFn)
          .then((result) => {
            socket.emit('result', {
              id: req.id,
              result: result
            })
          })
      } else {
        console.log("on", "unknown session", req.id)
      }
    })
  })
}

parallac
  .init()
  .then(startServer)