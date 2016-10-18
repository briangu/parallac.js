var uuid = require('uuid')

var writeln = console.log

var outstandingRequests = {}

function createFnRequest(fn, completeFn) {
  const payload = {
    id: uuid.v4(),
    fn: JSON.stringify(fn.toString())
  }
  outstandingRequests[payload.id] = completeFn
  return JSON.stringify(payload)
}

function completeRequest(data) {
  var complete = outstandingRequests[data.id]
  complete(data.result)
  delete outstandingRequests[data.id]
}

module.exports = function(config) {

  // TODO: get URLs from config
  var socket = require('socket.io-client')('http://localhost:3000');

  var module = {
    init: function () {
      return new Promise(function (resolve, reject) {
        socket.on('connect', function () {
          // writeln("connect")
        });
        socket.on('writeln', function (data) {
          console.log(data)
        }),
        socket.on('result', function (data) {
          // writeln("event", data)
          if (data.id in outstandingRequests) {
            completeRequest(data)
          } else {
            writeln("request context not found: ", data.id)
          }
        });
        socket.on('disconnect', function () {
          // writeln("disconnect")
        });
        resolve({}) // TODO: send back parallac config
      })
    },
    run: function (fn) {
      return new Promise(function (resolve, reject) {
        socket.emit('event', createFnRequest(fn, (result) => {
          resolve(result)
        }))
      })
    },
    done: function () {
      if (Object.keys(outstandingRequests).length === 0) {
        socket.disconnect()
      }
    }
  }

  return module
}