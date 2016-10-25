'use strict';

var uuid = require('uuid')
var vm = require('vm');

var RemoteLocale = require('./RemoteLocale').RemoteLocale

function createChildContext(parentContext, childContext) {
  return Object.assign(Object.assign({}, parentContext || {}), childContext)
}

const BaseContext = {
  require: require,
  console: console
}

var Locale = function (localeConfig, id, parentContext) {
  parentContext = parentContext || BaseContext

  let baseContext = createChildContext(parentContext)

  let contextStack = [baseContext]

  let sessions = {}

  function on() {
    const locale = this
    console.log("LocalLocale", "on", locale.id)
    return {
      with: function (obj) {
        // TODO: we should replace push/pop context with request-level createSessionContext
        locale.pushContext(obj)
        return this;
      },
      do: function (fn) {
        return new Promise(function (resolve, reject) {
          try {
            const code = "(" + fn.toString() + ")();"
            let options = {}
            var cd = locale.codeCache[code]
            if (cd) {
              options.cachedData = cd
            } else {
              options.produceCachedData = true
            }
            var script = new vm.Script(code, options);
            if (script.cachedDataProduced) {
              locale.codeCache[code] = script.cachedData
            }
            var result = script.runInNewContext(locale.context())
            let kindOf = Object.prototype.toString.call(result)
            if (kindOf === "[object Promise]") {
              result
                .then(resolve)
                .catch(reject)
            } else {
              resolve(result)
            }
          } catch (err) {
            console.log("do", "try", "error", err)
            reject(err);
          }
        })
      }
    }
  }

  return {
    sessions: sessions,
    config: localeConfig,
    codeCache: {},
    id: id,
    on: on,
    // TODO: revisit push/pop context with request-level sessions
    pushContext: function (context) {
      const parentContext = this.context()
      const childContext = createChildContext(parentContext, context)
      contextStack.push(childContext)
      return childContext
    },
    popContext: function () {
      return contextStack.pop()
    },
    resetContext: function () {
      contextStack = [baseContext]
    },
    context: function () {
      return contextStack[contextStack.length - 1]
    },
    createSessionContext: function (id) {
      let sessionLocale = new Locale(this.config, this.id, this.context())
      sessions[id] = sessionLocale
      return Promise.resolve(sessionLocale)
    },
    closeSessionContext: function (id) {
      delete sessions[id]
      return Promise.resolve()
    }
  }
}

function on(locale) {
  console.log("on", "locale", locale.id)
  return locale.on()
}

// simple 1-D domain
// TODO: use bracket [] notation if possible
var Domain = function (locales, len) {
  // const domain = []

  // TODO: add ability to specify domain contents

  return {
    domain: [],
    locales: locales,
    length: len,
    init: function () {
      // console.log("domain init")
      const k = this
      const d = this.domain
      return new Promise(function (resolve, reject) {
        for (var i = 0; i < len; i++) {
          d.push(locales[i % locales.length])
        }
        // console.log("domain:domain", k.domain)
        resolve(k)
      })
    },
    get: function (x) {
      return this.domain[x]
    },
    [Symbol.iterator]: function () {
      return DistArrayIterator(this)
    }
  }
}

function DistArrayIterator(da) {
  return {
    next: function () {
      if (this._idx < da.length) {
        return {
          value: da.get(this._idx++)
        }
      } else {
        return {
          done: true
        }
      }
    },
    _idx: 0
  }
}

var DistArray = function (domain) {
  const objId = uuid.v4()

  return {
    objId: objId,
    domain: domain,
    length: domain.length,
    init: function() {
      const k = this
      return new Promise(function (resolve, reject) {
        for (let locale of domain.locales) {
          locale.context()._sys[objId] = {}
        }
        resolve(k)
      })
    },
    get: function (i) {
      return on(this.domain.get(i))
        .with({
          i: i,
          objId: objId
        })
        .do(() => _sys[objId][i] || 0)
    },
    set: function (i, v) {
      return on(this.domain.get(i))
        .with({
          i: i,
          v: v,
          objId: objId
        })
        .do(() => {
          _sys[objId][i] = v
        })
        .then(() => this)
    },
    map: function (r) {
      return {
        set: function (fn) {
          const calls = []
          for (let i of r) {
            calls.push(on(dom.get(i))
              .with({
                asym: asym,
                fn: fn,
                i: i
              })
              .do(() => {
                let av = here.context()._sys[asym][i]
                here.context()._sys[csym][i] = fn(av)
              }))
          }
          return Promise.all(calls)
        }
      }
    },
    forAll: function (dom) {
      dom = dom || this.domain
      return {
        set: function (fn) {
          const calls = []
          for (let i = 0; i < dom.length; i++) {
            calls.push(on(dom.get(i))
              .with({
                sym: objId,
                fn: fn,
                i: i
              })
              .do(() => {
                here.context()._sys[sym][i] = fn(i)
              }))
          }
          return Promise.all(calls)
        }
      }
    },
    zip: function (a, b) {
      if (a.domain.length !== b.domain.length) {
        throw "domains are not equal: " + a.domain.length + " !== " + b.domain.length
      }
      const kThis = this
      const dom = a.domain
      const asym = a.objId
      const bsym = b.objId
      return {
        set: function (fn) {
          const calls = []
          for (let i = 0; i < dom.length; i++) {
            calls.push(on(dom.get(i))
              .with({
                asym: asym,
                bsym: bsym,
                csym: objId,
                fn: fn,
                i: i
              })
              .do(() => {
                let av = here.context()._sys[asym][i]
                let bv = here.context()._sys[bsym][i]
                here.context()._sys[csym][i] = fn(av, bv)
              }))
          }
          return Promise.all(calls)
            .then(() => kThis)
        }
      }
    },
    setAll: function (v) {
      const k = this
      var calls = []
      for (let i = 0; i < domain.length; i++) {
        calls.push(this.set(i, v))
      }
      return Promise.all(calls)
        .then(() => k)
    },
    getAll: function () {
      var calls = []
      for (let v of this) {
        calls.push(v)
      }
      return Promise.all(calls)
    },
    [Symbol.iterator]: function () {
      return DistArrayIterator(this)
    }
  }
}

// TODO: per locale and client config
function loadConfig(localeConfig) {
  localeConfig = localeConfig || {}

  if (!localeConfig.locales) {
    var URIs = process.env.PARALLAC_SERVERS.split(',')
    localeConfig.locales = URIs.map((URI) => ({ URI: URI }))
  }

  if (!localeConfig.here) {
    var hereURI = process.env.PARALLAC_HERE
    if (hereURI) {
      localeConfig.here = {}
      localeConfig.here.URI = hereURI
    }
  }

  return Promise.resolve(localeConfig)
}

function createDomain(locales, len) {
  var d = new Domain(locales, len)
  return d.init()
}

function createDistArray(dom) {
  var d = new DistArray(dom)
  return d.init()
}

function p(fn) {
  return new Promise(function (resolve, reject) {
    try {
      resolve(fn())
    } catch (err) {
      reject(err)
    }
  })
}

function createLocalLocale(localeConfig, i, baseContext) {
  let context = createChildContext(baseContext)
  let locale = new Locale(localeConfig, i, context)
  locale.context().here = locale
  locale.context().on = on
  locale.context().Domain = Domain
  locale.context().DistArray = DistArray
  locale.context().createDomain = createDomain
  locale.context().createDistArray = createDistArray
  locale.context().writeln = console.log
  locale.context().p = p
  locale.context()._sys = {}

  return locale
}

function createRemoteLocale(localeConfig, i) {
  var remoteLocale = new RemoteLocale(localeConfig, i)
  // console.log(remoteLocale)
  return remoteLocale
}

function init(localeConfig) {
  return loadConfig(localeConfig)
    .then((config) => {
      const hereConfig = config.here || {}

      var here
      var Locales = []

      for (let i = 0; i < config.locales.length; i++) {
        let localeConfig = config.locales[i]
        if (localeConfig.URI === hereConfig.URI) {
          let localLocale = createLocalLocale(localeConfig, i, BaseContext)
          Locales.push(localLocale)
          if (!here) {
            here = localLocale
          }
        } else {
          // console.log("init", "adding remote locale", i)
          Locales.push(createRemoteLocale(localeConfig, i, BaseContext))
        }
      }

      if (here) {
        // console.log("init", "here", here)
        Locales.forEach((locale) => {
          if (locale.config.URI === here.config.URI) { // TODO: equals
            // console.log("init", "assign Locales")
            locale.context().Locales = Locales
          }
        })
      }

      // console.log("init", "locales", Locales)

      return {
        here: here,
        Locales: Locales
      }
    })
}

function createSession(config, sessionId) {
  sessionId = sessionId || uuid.v4()

  var sessionConfig = Object.assign({}, config)
  sessionConfig.sessionId = sessionId

  console.log("creating session", sessionConfig.sessionId)

  var calls = sessionConfig.Locales.map((locale) => locale.createSessionContext(sessionConfig.sessionId))
  return Promise.all(calls)
    .then((sessionLocales) => {
      if (config.here) {
        sessionConfig.here = sessionLocales[config.here.id]
      }
      sessionConfig.Locales = sessionLocales
      if (sessionConfig.here) {
        sessionLocales.forEach((locale) => {
          if (locale.config.URI === config.here.config.URI) { // TODO: equals
            locale.context().Locales = sessionLocales
          }
        })
      }
      return sessionConfig
    })
    .catch((err) => {
      console.log("createSession", "error", err)
      throw err
    })
}

function closeSession(config, isDone) {
  console.log("closing session", config.sessionId)
  var calls = config.Locales.map((locale) => locale.closeSessionContext(config.sessionId, isDone))
  return Promise.all(calls)
    .catch((err) => {
      console.log("closeSession", "error", err)
      throw err
    })
}

function run(fn, localeConfig) {
  return init(localeConfig)
    .then(createSession)
    .then((sessionConfig) => {
      return on(sessionConfig.here || sessionConfig.Locales[0])
        .do(fn)
        .catch((err) => {
          console.log("run", "error", err)
          closeSession(sessionConfig, true)
          throw err
        })
        .then((result) => {
          console.log("run", "success", result)
          closeSession(sessionConfig, true)
          return result
        })
    })
}

module.exports = {
  run: run,
  on: on,
  init: init,
  writeln: console.log
}