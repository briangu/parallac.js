var uuid = require('uuid')

var writeln = console.log

// NOTE: this client is shaping up to be a remote locale

var outstandingRequests = {}

function createFnRequest(sessionId, fn, completeFn) {
  const requestId = uuid.v4()
  const payload = {
    id: sessionId,
    requestId: requestId,
    fn: JSON.stringify(fn.toString())
  }
  outstandingRequests[requestId] = completeFn
  return payload
}

function completeRequest(data) {
  var complete = outstandingRequests[data.id]
  complete(data.result)
  delete outstandingRequests[data.id]
}

var RemoteLocale = function (config, id, baseContext) {
  config = config || {}

  var socket = require('socket.io-client')(config.URI);

  var sessionId;

  socket.on('connect', function (data) {
    console.log("connected to:", config.URI)
  })

  socket.on('disconnect', function (data) {
    console.log("disconnected from:", config.URI)
  })

  socket.on('writeln', function (data) {
    if (data.id in outstandingRequests) {
      console.log.apply(null, JSON.parse(data.args))
    } else {
      writeln("writeln", "request context not found: ", data.id)
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
        // TODO: we should replace push/pop context with request-level createSessionContext
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

  return {
    config: config,
    id: id,
    init: init,
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
    createSessionContext: function (id) {
      socket.emit("createSessionContext", {
        sessionId: sessionId
      })
    },
    closeSessionContext: function (id) {
      socket.emit("createSessionContext", {
        sessionId: sessionId
      })
    },
    done: done
  }
}

module.exports = {
  RemoteLocale: RemoteLocale
}
