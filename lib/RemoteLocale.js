var uuid = require('uuid')

var writeln = console.log

// NOTE: this client is shaping up to be a remote locale

var outstandingRequests = {}

function createFnRequest(sessionId, fn, completeFn) {
  const requestId = uuid.v4()
  const payload = {
    sessionId: sessionId,
    requestId: requestId,
    fn: JSON.stringify(fn.toString())
  }
  outstandingRequests[requestId] = completeFn
  return payload
}

function completeRequest(data) {
  var complete = outstandingRequests[data.requestId]
  complete(data.result)
  delete outstandingRequests[data.requestId]
}

var RemoteLocale = function (config, id) {
  config = config || {}

  var socket = require('socket.io-client')(config.URI);

  // need sessionId from client connection
  var sessionId // hack to test if system works

  socket.on('connect', function (data) {
    console.log("connected to:", config.URI)
  })

  socket.on('disconnect', function (data) {
    console.log("disconnected from:", config.URI)
  })

  socket.on('writeln', function (data) {
    if (data.requestId in outstandingRequests) {
      console.log.apply(null, JSON.parse(data.args))
    } else {
      writeln("writeln", "request context not found: ", data.requestId)
    }
  });

  socket.on('result', function (data) {
    const requestId = data.requestId
    if (requestId in outstandingRequests) {
      completeRequest(data)
    } else {
      writeln("result", "request context not found: ", requestId)
    }
  });

  function done() {
    if (Object.keys(outstandingRequests).length > 0) {
      console.log("abandoning pending requests: ", Object.keys(outstandingRequests).length)
    }

    socket.disconnect()

    return Promise.resolve()
  }

  function on() {
    const locale = this
    console.log("RemoteLocale", "on", id, sessionId)
    return {
      with: function (obj) {
        // TODO: we should replace push/pop context with request-level createSessionContext
        // locale.pushContext(obj)
        return locale;
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

  return {
    config: config,
    id: id,
    // init: init,
    on: on,
    // TODO: we should replace push/pop context with request-level createSessionContext
    // pushContext: function (context) {
    //   // const parentContext = this.context()
    //   // const childContext = createChildContext(parentContext, context)
    //   // contextStack.push(childContext)
    //   // return childContext
    // },
    // popContext: function () {
    //   // return contextStack.pop()
    // },
    // resetContext: function () {
    //   // contextStack = [baseContext]
    // },
    // context: function () {
    //   // return contextStack[contextStack.length - 1]
    // },
    createSessionContext: function (sessionId) {
      socket.emit("createSessionContext", {
        sessionId: sessionId
      })
      this.sessionId = sessionId
      return Promise.resolve(this)
    },
    closeSessionContext: function (sessionId) {
      socket.emit("closeSessionContext", {
        sessionId: sessionId
      })
      this.sessionId = undefined
      return Promise.resolve(this)
    },
    done: done
  }
}

module.exports = {
  RemoteLocale: RemoteLocale
}
