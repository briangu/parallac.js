var app = require('express')()
var http = require('http').Server(app)
var io = require('socket.io')(http)
var parallac = require('../lib/parallac')
var on = parallac.on
var uuid = require('uuid')

var debug = () => { }
var error = console.log
var info = console.log

function startServer(config) {
  info("hello")

  if (!config.here) {
    throw "Missing server host HERE configuration"
  }

  app.get('/', function (req, res) {
    res.sendFile('index.html', { root: __dirname });
  })

  // app.post('/event', function (req, res) {
  //   debug("post handler", data)
  //   var req = JSON.parse(data)
  //   reqFn = JSON.parse(req.fn)
  //   on(config.Locales[0])
  //     .do(reqFn)
  //     .then((result) => {
  //       res.send({
  //         id: req.id,
  //         result: result
  //       })
  //     })
  // })

  var port = parseInt(require('url').parse(config.here.config.URI).port)

  http.listen(port, function () {
    info('listening on *:'+port)
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
      debug("createSession", "for session id", sessionId)
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
              debug("createSession", "local session locale", i, here, session.Locales[i])
              session.Locales[session.here.id] = session.here
              session.here.context().writeFn = function (fn) {
                const fnString = fn.toString()
                // package all args and send over the wire for a client-side console.log
                Array.prototype.shift.apply(arguments)
                let values = []
                for (let k of Object.keys(arguments)) {
                  values.push(arguments[k])
                }
                socket.emit('writeFn', {
                  sessionId: session.id,
                  fn: fnString,
                  args: JSON.stringify(values)
                })
              }

              session.here.context().writeln = function () {
                // package all args and send over the wire for a client-side console.log
                let values = [session.here.id + ":"]
                for (let k of Object.keys(arguments)) {
                  values.push(arguments[k])
                }
                socket.emit('writeln', {
                  sessionId: session.id,
                  args: JSON.stringify(values)
                })
              }
            } else {
              debug("createSession", "remote proxy", i, here, session.Locales[i])
              session.Locales[i] = session.Locales[i].createSessionProxy(session.id)
            }
          }

          session.here.Locales = session.Locales
          session.here.context().Locales = session.Locales

          debug("createSession", "session.here", session.here)
        })
        .catch((err) => {
          error("createSession", "error", err)
          throw err
        })
    }

    function closeSession() {
      debug("closeSession", session.id)
      if (session.id) {
        config.here.closeSessionContext(session.id)
        session = {}
      }
    }

    socket.on('error', function (data) {
      error("error", data)
    })

    socket.on('connect', function (data) {
      debug("connect", data)
    })

    socket.on('disconnect', function (data) {
      debug("disconnect", session.id)
      if (session.id) {
        closeSession(session.id)
      }
    })

    socket.on('on', function (req) {
      debug("server", "on", req, config.here, !!session.here)
      reqFn = JSON.parse(req.fn)
      let here = session.here || config.here.sessions[req.sessionId]
      debug("server", "on", "here", here)
      on(here)
        .with(req.subContext)
        .do(reqFn)
        .then((result) => {
          socket.emit('result', {
            sessionId: session.id,
            requestId: req.requestId,
            result: result
          })
        })
        .catch((err) => {
          error('on', 'error', err)
          throw err
        })
    })

    socket.on('createSessionContext', function (req) {
      debug("createSessionContext", req)
      createSession(req.sessionId)
        .then((result) => {
          socket.emit('result', {
            sessionId: session.id,
            requestId: req.requestId,
            result: {
              success: true
            }
          })
        })
    })

    socket.on('closeSessionContext', function (req) {
      debug("closeSessionContext", req)
      closeSession(req.sessionId)
      // TODO: RPC result
    })

    socket.on('setSymbol', function (req) {
      debug("setSymbol", req)
      let here = session.here || config.here.sessions[req.sessionId]
      here.setSymbol(req.symbolId, req.value)
        .then((result) => {
          socket.emit('result', {
            sessionId: session.id,
            requestId: req.requestId,
            result: {
              success: true
            }
          })
        })
    })
  })
}

var serverURIs = process.env.PARALLAC_SERVERS || ""

parallac
  .init({
    locales: serverURIs.split(',').map((URI) => ({ URI: URI }))
  })
  .then(startServer)