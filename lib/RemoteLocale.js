var uuid = require('uuid')

var writeln = console.log

var SessionProxy = function (sessionId, remoteLocale) {
  if (!sessionId) {
    throw "SessionProxy: Missing session id"
  }

  return {
    config: remoteLocale.config,
    id: remoteLocale.id,
    // init: init,
    on: function () {
      writeln("SessionProxy", "on", sessionId)
      return remoteLocale.on(sessionId)
    },
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
    // createSessionContext: function (sessionId) {
    //   socket.emit("createSessionContext", {
    //     sessionId: sessionId
    //   })
    //   this.sessionId = sessionId
    //   return Promise.resolve(this)
    // },
    closeSessionContext: function (sessionId, isDone) {
      return remoteLocale.closeSessionContext(sessionId, isDone)
    },
    done: remoteLocale.done
  }
}

var outstandingRequests = {}

function createFnRequest(sessionId, fn, completeFn) {
  const requestId = uuid.v4()
  const payload = {
    sessionId: sessionId,
    requestId: requestId,
    fn: JSON.stringify(fn.toString())
  }
  outstandingRequests[requestId] = completeFn
  console.log("createFnRequest", payload)
  return payload
}

function completeRequest(data) {
  var complete = outstandingRequests[data.requestId]
  complete(data.result)
  delete outstandingRequests[data.requestId]
}

var RemoteLocale = function (config, id) {
  config = config || {}

  writeln("RemoteLocale", "init", config, id)

  var socket = require('socket.io-client')(config.URI);

  var connected = new Promise(function (resolve, reject) {
    socket.on('connect', function (data) {
      console.log("connected to:", config.URI)
      resolve()
    })
  })

  socket.on('disconnect', function (data) {
    console.log("disconnected from:", config.URI)
  })

  socket.on('writeln', function (data) {
    // if (data.requestId in outstandingRequests) {
    //   console.log.apply(null, JSON.parse(data.args))
    // } else {
    //   writeln("writeln", "request context not found: ", data)
    // }
    console.log.apply(null, JSON.parse(data.args))
  });

  socket.on('result', function (data) {
    console.log("server", "result", data)
    const requestId = data.requestId
    if (requestId in outstandingRequests) {
      completeRequest(data)
    } else {
      writeln("result", "request context not found: ", requestId)
    }
  });

  function done() {
    writeln("done", "here", id)
    if (Object.keys(outstandingRequests).length > 0) {
      console.log("abandoning pending requests: ", Object.keys(outstandingRequests).length)
    }

    return connected
      .then(() => {
        socket.disconnect()
        return Promise.resolve()
      })
  }

  // called by session proxy
  function on(sessionId) {
    if (!sessionId) {
      throw "Remote Locale (on): Missing session id"
    }
    const locale = this
    console.log("RemoteLocale", "on", id, sessionId)
    return {
      with: function (obj) {
        // TODO: we should replace push/pop context with request-level createSessionContext
        // locale.pushContext(obj)
        return locale;
      },
      do: function (fn) {
        console.log("doing it", 1)
        return connected
          .then(() => {
            console.log("doing it", 2)
            return new Promise(function (resolve, reject) {
              socket.emit('on', createFnRequest(sessionId, fn, (result) => {
                writeln("result", result)
                resolve(result)
              }))
            })
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
    createSessionProxy: function (sessionId) {
      writeln("createSessionProxy", sessionId)
      return new SessionProxy(sessionId, this)
    },
    createSessionContext: function (sessionId) {
      if (!sessionId) {
        throw "Remote Locale (createSessionContext): Missing session id"
      }
      return connected
        .then(() => {
          socket.emit("createSessionContext", {
            sessionId: sessionId
          })
          return Promise.resolve(new SessionProxy(sessionId, this))
        })
    },
    closeSessionContext: function (sessionId, isDone) {
      if (!sessionId) {
        throw "Remote Locale (closeSessionContext): Missing session id"
      }
      return connected
        .then(() => {
          socket.emit("closeSessionContext", {
            sessionId: sessionId
          })
          if (isDone) {
            return done()
          }
          return Promise.resolve()
        })
    },
    done: done
  }
}

module.exports = {
  RemoteLocale: RemoteLocale
}
