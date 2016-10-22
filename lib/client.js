var uuid = require('uuid')

var writeln = console.log

var outstandingRequests = {}

function createFnRequest(sessionId, fn, completeFn) {
  const payload = {
    id: sessionId,
    fn: JSON.stringify(fn.toString())
  }
  outstandingRequests[payload.id] = completeFn
  return payload
}

function completeRequest(data) {
  var complete = outstandingRequests[data.id]
  complete(data.result)
  delete outstandingRequests[data.id]
}

module.exports = function (config) {

  // TODO: get URLs from config
  var socket = require('socket.io-client')('http://localhost:3000');

  function init() {
    return new Promise(function (resolve, reject) {
      socket.on('connect', function () {
        // writeln("connect")
      });
      socket.on('disconnect', function () {
        // writeln("disconnect")
      });
      socket.on('writeln', function (data) {
        if (data.id in outstandingRequests) {
          console.log.apply(null, JSON.parse(data.args))
        } else {
          writeln("writeln", "request context not found: ", data.id)
        }
      });
      socket.on('result', function (data) {
        if (data.id in outstandingRequests) {
          completeRequest(data)
        } else {
          writeln("result", "request context not found: ", data.id)
        }
      });

      resolve({}) // TODO: send back parallac config
    })
  }

  function done() {
    if (Object.keys(outstandingRequests).length === 0) {
      socket.disconnect()
    }
  }

  function createSession(sessionId) {
    socket.emit('create_session', {
      id: sessionId
    })
  }

  function destroySession(sessionId) {
    socket.emit('destroy_session', {
      id: sessionId
    })
  }

  var module = {
    init: init,
    run: function (fn) {
      return init()
        .then((config) => {
          return new Promise(function (resolve, reject) {
            let sessionId = uuid.v4()
            createSession(sessionId)
            socket.emit('on', createFnRequest(sessionId, fn, (result) => {
              destroySession(sessionId)
              resolve(result)
            }))
          })
        })
        .then((results) => {
          done()
          return results
        })
        .catch((err) => {
          console.log(err)
          done()
          throw err
        })
    },
    done: done
  }

  return module
}