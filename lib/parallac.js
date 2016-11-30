'use strict';

var uuid = require('uuid')
var vm = require('vm');

var RemoteLocale = require('./RemoteLocale').RemoteLocale

var debug = () => { }
var error = console.log
var info = console.log

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

  let localeSessions = {}
  let subContexts = {}

  function context() {
    return baseContext
  }

  function createLocaleSession(sessionId) {
    let sessionLocale = new Locale(localeConfig, id, context())
    localeSessions[sessionId] = sessionLocale
    return sessionLocale
  }

  function closeLocaleSession(sessionId) {
    delete localeSessions[sessionId]
  }

  let codeCache = {}
  let subContextCount = 0

  function on() {
    debug("LocalLocale", "on", id)
    const baseLocale = this
    const subContextId = subContextCount++ //uuid.v4()
    return {
      with: function (obj) {
        subContexts[subContextId] = obj
        return this;
      },
      do: function (fn) {
        return new Promise(function (resolve, reject) {
          try {
            const code = "(" + fn.toString() + ")();"
            let options = {}
            var cd = codeCache[code]
            if (cd) {
              options.cachedData = cd
            } else {
              options.produceCachedData = true
            }
            var script = new vm.Script(code, options)
            if (script.cachedDataProduced) {
              codeCache[code] = script.cachedData
            }
            let sessionContext = subContexts[subContextId]
            let runtimeContext = sessionContext ? createChildContext(context(), sessionContext) : baseContext
            let result = script.runInNewContext(runtimeContext)
            let kindOf = Object.prototype.toString.call(result)
            if (kindOf === "[object Promise]") {
              result
                .then(resolve)
                .catch(reject)
            } else {
              resolve(result)
            }
          } catch (err) {
            error("do", "try", "error", err, fn.toString())
            reject(err);
          }
        })
        .then((results) => {
          delete subContexts[subContextId]
          let kindOf = Object.prototype.toString.call(results)
          if (kindOf === '[object Array]') {
            let innerKindOf = Object.prototype.toString.call(results[0])
            if (innerKindOf === '[object Promise]') {
              debug("wrapping results with Promise.all")
              return Promise.all(results)
            }
          }
          return results
        })
      }
    }
  }

  return {
    sessions: localeSessions,
    config: localeConfig,
    id: id,
    on: on,
    setSymbol: function (symbolId, val) {
      // TODO: just inject symId into context
      // FOR NOW, just get DistArray remoting working
      this.context()._sys[symbolId] = val
      return Promise.resolve(this)
    },
    // getSymbol: function (symId) {
    //   return this.context()._sym[symId]
    // },
    context: context,
    createSessionContext: function (sessionId) {
      return Promise.resolve(createLocaleSession(sessionId))
    },
    closeSessionContext: function (sessionId) {
      return Promise.resolve(closeLocaleSession(sessionId))
    }
  }
}

function on(locale) {
  debug("on", "locale", locale.id, locale.on)
  return locale.on()
}

// TODO:

/*
  new Domain(locales, range1, range2, ...)
  range = [scalar...scalar]

  indexing is (scalar,scalar,...)
*/

// function RangeIterator(start, stop) {
//   return {
//     next: function () {
//       if (this._idx <= stop) {
//         return {
//           value: this._idx++
//         }
//       } else {
//         return {
//           done: true
//         }
//       }
//     },
//     _idx = start
//   }
// }

// var Range = function (start, stop) {
//   return {
//     start: start,
//     stop: stop,
//     [Symbol.iterator]: function () {
//       return RangeIterator(this.start, this.stop)
//     }
//   }
// }

// var incrementIndexes = function (ranges, indexes) {
//   let done = false
//   let i = indexes.length - 1
//   while (i >= 0) {
//     if (indexes[i] < ranges[i][1]) {
//       indexes[i]++
//       break
//     } else {
//       indexes[i] = ranges[i][0]
//       done = i == 0
//     }
//     i--
//   }
//   return done
// }

// var copyArray = function (a, b) {
//   let n = a.length-1
//   while (n >= 0) {
//     b[n] = a[n]
//     n--
//   }
// }

function DomainIterator(length) {
  let obj = {
    value: 0
  }
  return {
    next: function () {
      if (this._idx >= length) {
        return {
          done: true
        }
      }
      obj.value = this._idx++
      return obj
    },
    _idx: 0
  }
}

// var hashCode = function (array) {
//   console.log("hashCode", array, typeof array)
//   var hash = 0
//   array.forEach((el) => {
//     hash  = ((hash << 5) - hash) + el
//     hash |= 0
//   })
//   return hash;
// };

function defaultRangeMapper(locales, dim, x) {
  return locales[x % locales.length]
}

var Domain = function (locales, dim, fnRangeMapper) {
  fnRangeMapper = fnRangeMapper || defaultRangeMapper

  let length = dim.reduce((a,b) => a * b, 1)

  return {
    dim: dim,
    locales: locales,
    init: function () {
      return Promise.resolve(this)
    },
    get: function (x) {
      return fnRangeMapper(locales, dim, x)
    },
    [Symbol.iterator]: function () {
      return DomainIterator(length)
    }
  }
}

function DistArrayIterator(da, domIter) {
  return {
    next: function () {
      let result = domIter.next()
      if (result.done) {
        return result
      } else {
        return {
          value: da.get(result.value)
        }
      }
    }
  }
}

var DistArray = function (domain) {
  const objId = uuid.v4()

  return {
    objId: objId,
    domain: domain,
    init: function() {
      let calls = domain.locales.map((locale) => locale.setSymbol(objId, {}))
      return Promise.all(calls)
          .then(() => this)
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
        .do(() => (_sys[objId][i] = v))
        .then(() => this)
    },
    map: function (dom) {
      dom = dom || this.domain
      const kThis = this
      return {
        set: function (fn) {
          const calls = []
          for (let i of dom) {
            calls.push(on(dom.get(i))
              .with({
                sym: objId,
                fns: fn.toString(),
                i: i
              })
              .do(() => {
                let av = here.context()._sys[sym][i]
                let fn = eval(fns) // TODO: can we cache the eval on the target locale?
                here.context()._sys[sym][i] = fn(av)
              }))
          }
          return Promise.all(calls)
            .then(() => kThis)
        },
        do: function (fn) {
          const calls = []
          for (let i of dom) {
            calls.push(on(dom.get(i))
              .with({
                sym: objId,
                fns: fn.toString(),
                i: i
              })
              .do(() => {
                let av = here.context()._sys[sym][i]
                let fn = eval(fns) // TODO: can we cache the eval on the target locale?
                fn(av)
              }))
          }
          return Promise.all(calls)
            .then(() => kThis)
        }
      }
    },
    forAll: function (dom) {
      dom = dom || this.domain
      const k = this
      return {
        set: function (fn) {
          const calls = []
          for (let i of dom) {
            calls.push(on(dom.get(i))
              .with({
                sym: objId,
                fns: fn.toString(),
                i: i
              })
              .do(() => {
                let fn = eval(fns) // TODO: can we cache the eval on the target locale?
                here.context()._sys[sym][i] = fn(i, here.context()._sys[sym][i])
              }))
          }
          return Promise.all(calls)
            .then(() => k)
        },
        do: function (fn) {
          const calls = []
          for (let i of dom) {
            calls.push(on(dom.get(i))
              .with({
                sym: objId,
                fns: fn.toString(),
                i: i
              })
              .do(() => {
                let av = here.context()._sys[sym][i]
                let fn = eval(fns)
                fn(i, av)
              }))
          }
          return Promise.all(calls)
            .then(() => k)
        }
      }
    },
    zip: function (a, b) {
      // if (a.domain.length !== b.domain.length) {
      //   throw "domains are not equal: " + a.domain.length + " !== " + b.domain.length
      // }
      const kThis = this
      const dom = a.domain
      const asym = a.objId
      const bsym = b.objId
      return {
        set: function (fn) {
          const calls = []
          for (let i of dom) {
            calls.push(on(dom.get(i))
              .with({
                asym: asym,
                bsym: bsym,
                csym: objId,
                fns: fn.toString(),
                i: i
              })
              .do(() => {
                let fn = eval(fns)
                let av = here.context()._sys[asym][i]
                let bv = here.context()._sys[bsym][i]
                here.context()._sys[csym][i] = fn(av, bv)
              }))
          }
          return Promise.all(calls)
            .then(() => kThis)
        },
        do: function (fn) {
          const calls = []
          for (let i of dom) {
            calls.push(on(dom.get(i))
              .with({
                asym: asym,
                bsym: bsym,
                csym: objId,
                fns: fn.toString(),
                i: i
              })
              .do(() => {
                let fn = eval(fns)
                let av = here.context()._sys[asym][i]
                let bv = here.context()._sys[bsym][i]
                fn(av, bv)
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
      for (let i of domain) {
        calls.push(k.set(i, v))
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
      return DistArrayIterator(this, domain[Symbol.iterator]())
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
    var hereURI = process.env.PARALLAC_HERE || process.argv[2]
    if (hereURI) {
      localeConfig.here = {}
      localeConfig.here.URI = hereURI
    }
  }

  return Promise.resolve(localeConfig)
}

function createDomain(locales) {
  Array.prototype.shift.apply(arguments)
  let ranges = Array.from(arguments)
  var d = new Domain(locales, ranges)
  return d.init()
}

function createDistArray(dom) {
  var d = new DistArray(dom)
  return d.init()
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
  locale.context()._sys = {}

  return locale
}

function createRemoteLocale(localeConfig, i) {
  var remoteLocale = new RemoteLocale(localeConfig, i)
  debug(remoteLocale)
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
          debug("init", "adding remote locale", i)
          Locales.push(createRemoteLocale(localeConfig, i, BaseContext))
        }
      }

      if (here) {
        debug("init", "here", here)
        Locales.forEach((locale) => {
          if (locale.config.URI === here.config.URI) { // TODO: equals
            debug("init", "assign Locales")
            locale.context().Locales = Locales
          }
        })
      }

      debug("init", "locales", Locales)

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

  debug("creating session", sessionConfig.sessionId)

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

      debug("created session", sessionConfig.sessionId)

      return sessionConfig
    })
    .catch((err) => {
      error("createSession", "error", err)
      throw err
    })
}

function closeSession(config, isDone) {
  debug("closing session", config.sessionId)
  var calls = config.Locales.map((locale) => locale.closeSessionContext(config.sessionId, isDone))
  return Promise.all(calls)
    .catch((err) => {
      error("closeSession", "error", err)
      throw err
    })
}

function run(fn, options) {
  options = options || {}
  var localeConfig = options.localeConfig
  var withContext = options.with

  return init(localeConfig)
    .then(createSession)
    .then((sessionConfig) => {
      return on(sessionConfig.here || sessionConfig.Locales[0])
        .with(withContext)
        .do(fn)
        .catch((err) => {
          error("run", "error", err)
          closeSession(sessionConfig, true)
          throw err
        })
        .then((result) => {
          debug("run", "success", result)
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