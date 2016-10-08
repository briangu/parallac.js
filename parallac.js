'use strict';

var uuid = require('uuid')
var vm = require('vm');

function createChildContext(parentContext, childContext) {
  return Object.assign(Object.assign({}, parentContext || {}), childContext)
}

const BaseContext = {
  require: require,
  console: console
}

var Locale = function (id, parentContext) {
  parentContext = parentContext || BaseContext

  let baseContext = createChildContext(parentContext)

  // TODO: scope by session
  let contexts = [baseContext]

  return {
    id: id,

    pushContext: function (context) {
      const parentContext = this.currentContext()
      const childContext = createChildContext(parentContext, context)
      contexts.push(childContext)
      return childContext
    },

    popContext: function () {
      return contexts.pop()
    },

    clearContext: function () {
      contexts = [baseContext]
    },

    currentContext: function () {
      return contexts[contexts.length - 1]
    },

    here: function(locale) {
      return locale.id == this.id
    }
  }
}

const Locales = []
Locales.push(new Locale(1))
Locales.push(new Locale(2))

function session(locales) {
  for (let locale of domain.locales) {
    let currentContext = locale.currentContext()
    locale.pushContext({
      here: new Locale(locale.id, currentContext)
    })
  }

  return {
    with: function (obj) {
      let sobj = JSON.stringify(obj)
      for (let locale of locales) {
        on(locale, () => {

          locale.pushContext(obj)
        })
      }
      return this;
    },
    run: function (fn) {
      return on(locales[0]).run(fn)
    }
  }}

function on(locale) {
  return {
    run: function (fn) {
      return new Promise(function (resolve, reject) {
        try {
          locale.pushContext({
            result: undefined
          })
          const code = "result = (" + fn.toString() + ")();"
          var script = new vm.Script(code);
          script.runInNewContext(locale.currentContext());
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
    domain.locales[i].currentContext()[objId] = {}
  }

  return {
    length: domain.length,
    get: function (x) {
      // on(domain.get(x))
      //   .run(() => )
      return domain.get(x).currentContext()[objId][x] || 0
    },
    put: function (x, v) {
      domain.get(x).currentContext()[objId][x] = v
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

module.exports = {
  Locale: Locale,
  Locales: Locales,
  on: on,
  Domain: Domain,
  DistArray: DistArray,
  DistArrayIterator: DistArrayIterator
}
