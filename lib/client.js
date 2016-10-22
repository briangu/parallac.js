var uuid = require('uuid')

var writeln = console.log

// NOTE: this client is shaping up to be a remote locale

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
  config = config || {}

  // TODO: get URLs from config
  var socket = require('socket.io-client')('http://localhost:3000');

  var sessionId;

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

  var session = new Promise(function (resolve, reject) {
    socket.on('session', function (data) {
      resolve(data.id)
    })
  })

  function init() {
    return session
      .then((sessionId) => ({
        id: sessionId
      }))
  }

  function done() {
    if (Object.keys(outstandingRequests).length > 0) {
      console.log("abandoning pending requests: ", Object.keys(outstandingRequests).length)
    }

    socket.disconnect()

    return Promise.resolve()
  }

  function on(sessionId) {
    return {
      with: function (obj) {
        // locale.pushContext(obj)
        return this;
      },
      do: function (fn) {
        return new Promise(function (resolve, reject) {
          socket.emit('on', createFnRequest(sessionId, fn, (result) => {
            resolve(result)
          }))
        })
      }
    }
  }

  var module = {
    init: init,
    run: function (fn) {
      return init()
        .then((config) => on(config.id).do(fn))
        .then((results) => {
          return done().then(() => results)
        })
        .catch((err) => {
          console.log("run", err)
          return done().then(() => {
            throw err
          })
        })
    },
    done: done
  }

  return module
}