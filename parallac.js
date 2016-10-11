'use strict';

var async = require('asyncawait/async');
var await = require('asyncawait/await');

var uuid = require('uuid')
var vm = require('vm');

function createChildContext(parentContext, childContext) {
  return Object.assign(Object.assign({}, parentContext || {}), childContext)
}

const BaseContext = {
  require: require,
  console: console
}

// var LocaleManager = function(here, localeConfig) {
//   const sessions = {}
//
//   const rootContext = createChildContext(BaseContext)
//
//   function createSession(sessionId) {
//     const sandbox = createChildContext(rootContext)
//     sandbox.here = new Locale(here)
//     sandbox.Locales = Object.keys(localeConfig)
//
//     sessions[sessionId] = {
//       sandbox: sandbox
//     }
//   }
//
//   function deleteSession(sessionId) {
//     delete sessions[sessionId]
//   }
//
//   return {
//     createNewSession: createNewSession,
//     deleteSession: deleteSession
//   }
// }

var Locale = function (id, parentContext) {
  parentContext = parentContext || BaseContext

  let baseContext = createChildContext(parentContext)

  let contextStack = [baseContext]

  return {
    id: id,
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
    }
  }
}

// function session(locales) {
//   for (let locale of domain.locales) {
//     let context = locale.context()
//     locale.pushContext({
//       here: new Locale(locale.id, context)
//     })
//   }
//
//   return {
//     with: function (obj) {
//       let sobj = JSON.stringify(obj)
//       for (let locale of locales) {
//         on(locale, () => {
//
//           locale.pushContext(obj)
//         })
//       }
//       return this;
//     },
//     run: function (fn) {
//       return on(locales[0]).run(fn)
//     }
//   }}

function on(locale) {
  return {
    with: function (obj) {
      locale.pushContext(obj)
      return this;
    },
    do: function (fn) {
      return new Promise(function (resolve, reject) {
        try {
          locale.pushContext({
            result: undefined
          })
          const code = "result = (" + fn.toString() + ")();"
          var script = new vm.Script(code);
          script.runInNewContext(locale.context());
          resolve(locale.popContext().result)
        } catch (err) {
          locale.popContext()
          reject(err);
        }
      })
    }
  }
}

// simple 1-D domain
var Domain = function (locales, len) {
  const domain = []

  // TODO: add ability to specify domain contents
  for (var i = 0; i < len; i++) {
    domain.push(locales[i % locales.length])
  }

  return {
    length: domain.length,
    get: function (x) {
      return domain[x]
    },
    locales: locales
  }
}

function DistArrayIterator(da) {
  return {
    next() {
      if (this._idx < da.length) {
        return {
          value: da.get(this._idx++)
        };
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
  const values = {}
  const objId = uuid.v4()

  for (var i = 0; i < domain.locales.length; i++) {
    domain.locales[i].context()[objId] = {}
  }

  return {
    length: domain.length,
    get: function (x) {
      // on(domain.get(x))
      //   .run(() => )
      return domain.get(x).context()[objId][x] || 0
    },
    put: function (x, v) {
      domain.get(x).context()[objId][x] = v
        // on(domain[x]).run(() => this[objId] = v)
    },
    set: function (v) {

    },
    toString: function () {
      var s = []
      for (let v of this) {
        s.push(v)
      }
      return s.join(",")
    },
    [Symbol.iterator]: function () {
      return DistArrayIterator(this)
    }
  }
}

function loadConfig() {
  const localeConfig = {
    1: {
      url: "http://localhost:3001"
    },
    2: {
      url: "http://localhost:3002"
    }
  }

  return Promise.resolve(localeConfig)
}

function init() {
  return loadConfig()
    .then((config) => {
      var Locales = []

      // create "local" locales living on the same host (and same process)
      for (let i of [1,2,3]) {
        let context = createChildContext(BaseContext)
        let locale = new Locale(i, context)
        locale.context().here = locale
        locale.context().on = on
        locale.context().Domain = Domain
        locale.context().DistArray = DistArray
        locale.context().DistArrayIterator = DistArrayIterator
        locale.context().writeln = console.log
        Locales.push(locale)
      }

      for (let locale of Locales) {
        locale.context().Locales = Locales
      }

      return {
        here: Locales[0],
        Locales: Locales
      }
    })
}

function run(fn) {
  async(function () {
    await (init()
      .then((config) => on(config.Locales[0]).do(fn))
      .catch((err) => {
        console.log("run failed: ", err);
      }))
  })();
}

module.exports = {
  run: run,
  init: init,
  writeln: console.log
}
