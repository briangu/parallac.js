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

  var port = parseInt(require('url').parse(config.here.config.URI).port)

  http.listen(port, function () {
    console.log('listening on *:'+port)
  })

  io.on('connection', function (socket) {

    function reportRequestError(req, err) {
      socket.emit('error', {
        req: req,
        error: err
      })
    }

    function createSessionForLocaleLocale(locale, sessionId, socket) {
      var sessionLocale = locale.createSessionContext(sessionId)
      sessionLocale.context().writeln = function () {
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
      return sessionLocale
    }

    let sessionId
    let sessionLocales = config.Locales

    socket.on('session', function (data) {
      sessionId = data.id

      sessionLocales = config.Locales.slice(0) // https://davidwalsh.name/javascript-clone-array
      sessionLocales[config.here.id] = config.here.createSessionContext()

      sessionLocales[config.here.id].context().writeln = function () {
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
      // sessionLocales = parallac.createSession(config, sessionId)
      // .then((sl) => sessionLocales = sl)
      config.here.createS
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

    socket.on('createSessionContext', function (req) {
      console.log("createSessionContext", req)
      const sessionId = req.sessionId
    })

    socket.on('closeSessionContext', function (req) {
      console.log("closeSessionContext", req)
      const sessionId = req.sessionId
    })
  })
}

parallac
  .init()
  .then(startServer)