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
      console.log("createSession", sessionId)
      if (session.id) {
        throw "WARNING: session already exists:" + session.id
      }
      session.id = sessionId
      session.Locales = config.Locales.slice(0)
      return config.here.createSessionContext(sessionId)
        .then((here) => {
          session.here = here
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

          console.log("createSession", "session.here", session.here)
        })
        .catch((err) => {
          console.log("createSession", "error", err)
          throw err
        })
    }

    function closeSession() {
      console.log("closeSession", session.id)
      if (session.id) {
        config.here.closeSessionContext(session.id)
        session = {}
      }
    }

    socket.on('error', function (data) {
      console.log("error", data)
    })

    socket.on('connect', function (data) {
      console.log("connect", data)
    })

    socket.on('disconnect', function (data) {
      console.log("disconnect", session.id)
      if (session.id) {
        closeSession(session.id)
      }
    })

    socket.on('on', function (req) {
      reqFn = JSON.parse(req.fn)
      on(session.here)
        .do(reqFn)
        .then((result) => {
          socket.emit('result', {
            sessionId: session.id,
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