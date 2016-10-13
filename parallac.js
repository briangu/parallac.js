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
          // TODO: can we cache?
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
// TODO: use bracket [] notation if possible
var Domain = function (locales, len) {
  // const domain = []

  // TODO: add ability to specify domain contents

  // function init() {
  //   console.log("domain init")
  //   const k = this
  //   return new Promise(function(resolve, reject) {
  //     for (var i = 0; i < len; i++) {
  //       domain.push(locales[i % locales.length])
  //     }
  //     console.log("domain:domain",domain)
  //     resolve(k)
  //   })
  // }

  return {
    domain: [],
    locales: locales,
    length: len,
    init: function () {
      // console.log("domain init")
      const k = this
      const d = this.domain
      return new Promise(function(resolve, reject) {
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
    next: function() {
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

  function init() {
    const k = this
    return new Promise(function(resolve, reject) {
      for (let locale of domain.locales) {
        locale.context()._sys[objId] = {}
      }
      resolve(k)
    })
  }

  return {
    objId: objId,
    domain: domain,
    length: domain.length,
    init: init,
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
    },
    map: function (r) {
      return {
        set: function(fn) {
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
      return {
        set: function(fn) {
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
      const dom = a.domain
      const asym = a.objId
      const bsym = b.objId
      return {
        set: function(fn) {
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
                here.context()._sys[csym][i] = fn(av,bv)
              }))
          }
          return Promise.all(calls)
        }
      }
    },
    setAll: function (v) {
      var calls = []
      for (let i = 0; i < domain.length; i++) {
        calls.push(this.set(i, v))
      }
      return Promise.all(calls)
    },
    getAll: function () {
      var calls = []
      for (let v of this) {
        calls.push(v)
      }
      return Promise.all(calls)
        .then((results) => results.join(","))
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

function createDomain(locales, len) {
  var d = new Domain(locales, len)
  return d.init()
}

function createDistArray(dom) {
  var d = new DistArray(dom)
  return d.init()
}

function init() {
  return loadConfig()
    .then((config) => {
      var Locales = []

      // create "local" locales living on the same host (and same process)
      for (let i of[1, 2, 3]) {
        let context = createChildContext(BaseContext)
        let locale = new Locale(i, context)
        locale.context().here = locale
        locale.context().on = on
        locale.context().Domain = Domain
        locale.context().DistArray = DistArray
        locale.context().createDomain = createDomain
        locale.context().createDistArray = createDistArray
        locale.context().writeln = console.log
        locale.context()._sys = {} // TODO: do we need this?

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
