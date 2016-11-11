var uuid = require('uuid')

var debug = () => { }
var error = console.log
var info = console.log

var SessionProxy = function (sessionId, remoteLocale) {
  if (!sessionId) {
    throw "SessionProxy: Missing session id"
  }

  return {
    config: remoteLocale.config,
    id: remoteLocale.id,
    on: function () {
      debug("SessionProxy", "on", sessionId)
      return remoteLocale.on(sessionId)
    },
    setSymbol: function (symbolId, value) {
      debug("SessionProxy", "setSymbol", symbolId, value)
      return remoteLocale.setSymbol(sessionId, symbolId, value)
    },
    closeSessionContext: function (sessionId, isDone) {
      debug("SessionProxy", "closeSessionContext", sessionId, isDone)
      return remoteLocale.closeSessionContext(sessionId, isDone)
    },
    done: function() {
      debug("SessionProxy", "done")
      return remoteLocale.done
    }
  }
}

var outstandingRequests = {}

function createFnRequest(sessionId, subContext, fn, completeFn) {
  const requestId = uuid.v4()
  const payload = {
    sessionId: sessionId,
    requestId: requestId,
    subContext: subContext,
    fn: JSON.stringify(fn.toString())
  }
  outstandingRequests[requestId] = completeFn
  debug("createFnRequest", sessionId, Object.keys(outstandingRequests).length)
  return payload
}

function completeRequest(data) {
  debug("completeRequest", data)
  var complete = outstandingRequests[data.requestId]
  complete(data.result)
  delete outstandingRequests[data.requestId]
}

var RemoteLocale = function (config, id) {
  config = config || {}

  let subContexts = {}
  let subContextCount = 0

  debug("RemoteLocale", "init", config, id)

  var socket = require('socket.io-client')(config.URI);

  var connected = new Promise(function (resolve, reject) {
    socket.on('connect', function (data) {
      debug("connected to:", config.URI)
      resolve()
    })
  })

  socket.on('error', function (data) {
    error("error:", config.URI)
  })

  socket.on('connect_failed', function (data) {
    error("connect_failed:", config.URI)
  })

  socket.on('disconnect', function (data) {
    debug("disconnected from:", config.URI)
  })

  socket.on('writeln', function (data) {
    // writeln("writeln", "received", data)
    // if (data.requestId in outstandingRequests) {
    //   console.log.apply(null, JSON.parse(data.args))
    // } else {
    //   writeln("writeln", "request context not found: ", data)
    // }
    console.log.apply(null, JSON.parse(data.args))
  });

  socket.on('result', function (data) {
    debug("RemoteLocale", "result", data)
    const requestId = data.requestId
    if (requestId in outstandingRequests) {
      completeRequest(data)
    } else {
      error("result", "request context not found: ", requestId)
    }
  });

  function done() {
    debug("RemoteLocale", "done", id, Object.keys(outstandingRequests).length)
    if (Object.keys(outstandingRequests).length > 0) {
      error("abandoning pending requests: ", Object.keys(outstandingRequests).length)
    }

    return connected
      .then(() => {
        socket.disconnect()
        return Promise.resolve()
      })
  }

  // called by session proxy
  function on(sessionId) {
    debug("RemoteLocale", "on", sessionId)

    if (!sessionId) {
      throw "Remote Locale (on): Missing session id"
    }

    var subContextId = subContextCount++

    debug("RemoteLocale", "on", id, sessionId)
    return {
      with: function (obj) {
        subContexts[subContextId] = obj
        return this;
      },
      do: function (fn) {
        debug("RemoteLocale", "doing it", 1)
        return connected
          .then(() => {
            debug("RemoteLocale", "doing it", 2)
            return new Promise(function (resolve, reject) {
              socket.emit('on', createFnRequest(sessionId, subContexts[subContextId], fn, (result) => {
                debug("RemoteLocale", "result", result)
                delete subContexts[subContexts[subContextId]]
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
    on: on,
    setSymbol: function (sessionId, symbolId, val) {
      // TODO: this should return a promise
      // TODO: handle RPC result
      debug("RemoteLocale", "setSymbol", sessionId, symbolId, val)
      socket.emit("setSymbol", {
        sessionId: sessionId,
        symbolId: symbolId,
        value: val
      })
      return Promise.resolve(this)
    },
    createSessionProxy: function (sessionId) {
      debug("RemoteLocale", "createSessionProxy", sessionId)
      return new SessionProxy(sessionId, this)
    },
    createSessionContext: function (sessionId) {
      debug("RemoteLocale", "createSessionContext", sessionId)
      if (!sessionId) {
        throw "Remote Locale (createSessionContext): Missing session id"
      }
      return connected
        .then(() => {
          socket.emit("createSessionContext", {
            sessionId: sessionId
          })
          debug("RemoteLocale", "createSessionContext", "returning")
          return Promise.resolve(new SessionProxy(sessionId, this))
        })
    },
    closeSessionContext: function (sessionId, isDone) {
      debug("RemoteLocale", "closeSessionContext", sessionId)
      if (!sessionId) {
        throw "Remote Locale (closeSessionContext): Missing session id"
      }
      return connected
        .then(() => {
          socket.emit("closeSessionContext", {
            sessionId: sessionId
          })
          debug("closeSessionContext", "isDone", isDone)
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
