'use strict';

var uuid = require('uuid')
var vm = require('vm');

function createChildContext(parentContext, childContext) {
  return Object.assign(Object.assign({}, parentContext || {}), childContext)
}

const baseSandbox = {
  result: undefined,
  require: require,
  console: console
}

function on(locale) {
  return {
    with: function (obj) {
      locale.pushContext(obj)
      return this;
    },
    run: function (fn) {
      return new Promise(function (resolve, reject) {
        try {
          const code = "result = (" + fn.toString() + ")();"
          console.log(code);
          var script = new vm.Script(code);
          console.time('vm');
          locale.pushContext({
            result: undefined
          })
          script.runInNewContext(locale.currentContext());
          console.timeEnd('vm');
          resolve(locale.currentContext().result)
        } catch (err) {
          reject(err);
        }
      })
    }
  }
}

var Locale = function (id) {
  this.id = id
  this.baseContext = createChildContext(baseSandbox)

  // TODO: scope by session
  this.contexts = [this.baseContext];

  this.pushContext = function (context) {
    const parentContext = this.currentContext()
    const childContext = createChildContext(parentContext, context)
    this.contexts.push(childContext)
    return childContext
  }

  this.popContext = function () {
    return this.contexts.pop()
  }

  this.clearContext = function () {
    this.contexts = [this.baseContext]
  }

  this.currentContext = function () {
    return this.contexts[this.contexts.length - 1]
  }
}

const Locales = []
Locales.push(new Locale(1))
Locales.push(new Locale(2))

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
    }
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

  // TODO: could use a list of unique locales to optimize this
  for (var i = 0; i < domain.length; i++) {
    if (!(objId in domain.get(i).currentContext())) {
      domain.get(i).currentContext()[objId] = {}
    }
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
    toString: function () {
      var s = []
      for (let v of this) {
        s.push(v)
      }
      return s.join(",")
    },
    [Symbol.iterator]: function() {
      return DistArrayIterator(this)
    }
  }
}

module.exports = {
  Locales: Locales,
  on: on,
  Domain: Domain,
  DistArray: DistArray,
  DistArrayIterator: DistArrayIterator
}
