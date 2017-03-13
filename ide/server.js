'use strict';

var app = require('express')()
var http = require('http').Server(app)
var io = require('socket.io')(http)
var parallac = require('parallac.js/lib/parallac')
var run = parallac.run
var uuid = require('uuid')
var fs = require('fs')

var debug = () => {}
var error = console.log
var info = console.log

function startServer(config) {
  info("hello")

  var codeFile = config.codeFile || "default.js"

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

  const port = config.port || 8080;

  http.listen(port, function () {
    info('listening on *:' + port)
  })

  io.on('connection', function (socket) {

    var code = fs.readFileSync(codeFile, 'utf8')
    info("connect", "code", code)
    socket.emit('code', {
      code: code
    })

    function writeLambdaFn(data) {
      socket.emit("writeFn", data)
    }

    function writeLogFn(data) {
      socket.emit("writeln", data)
    }

    let options = {
      localeConfig: {
        remote: {
          writeLambdaFn: writeLambdaFn,
          writeLogFn: writeLogFn
        }
      }
    }

    function reportRequestError(req, err) {
      socket.emit('error', {
        req: req,
        error: err
      })
    }

    socket.on('error', function (data) {
      error("error", data)
    })

    // socket.on('connected', function (data) {
    //   info("connect", data)
    //   var code = fs.readFileSync(codeFile, 'utf8')
    //   info("connect", "code", code)
    //   socket.emit('code', {
    //     code: code
    //   })
    // })

    socket.on('disconnect', function (data) {
      info("disconnect")
    })

    socket.on('run', function (data) {
      // console.log("run", data, JSON.parse(data.code))
      let fnString = JSON.parse(data.code)
      let fn = eval(fnString)
      run(fn, options)
        // .then((result) => {
        //   // console.log("result", result)
        // })
    })
  })
}

startServer({
  codeFile: process.argv[2]
})
