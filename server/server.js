var app = require('express')()
var http = require('http').Server(app)
var io = require('socket.io')(http)
var parallac = require('../lib/parallac')
var on = parallac.on
var writeln = console.log
var uuid = require('uuid')

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
          id: sessionId,
          result: result
        })
      })
  })

  http.listen(3000, function () {
    console.log('listening on *:3000')
  })

  io.on('connection', function (socket) {

    function createSession(sessionId) {
      console.log("create session", sessionId)
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

    function closeSession(sessionId) {
      console.log("closing session", sessionId)
      config.Locales.forEach((locale) => locale.closeSessionContext(sessionId))
    }

    let sessionId = uuid.v4()
    let sessionLocales = createSession(sessionId)
    socket.emit('session', {
      id: sessionId
    })

    socket.on('disconnect', function () {
      closeSession(sessionId)
    })

    socket.on('on', function (req) {
      reqFn = JSON.parse(req.fn)
      let here = sessionLocales[config.here.id]
      on(here, sessionId)
        .do(reqFn)
        .then((result) => {
          socket.emit('result', {
            id: sessionId,
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