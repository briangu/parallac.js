'use strict';

function createChildContext(parentContext, childContext) {
  parentContext = parentContext || {}
  return Object.assign(parentContext, childContext)
}

// function fn() {
//   function nop() {};
//   var i = 1000000;
//   while (i--) {
//     nop();
//   }
//   console.log(a)
//   a += 1
//   console.log(a)
// }
//
// const code = fn.toString()
//
// console.log(code);

// console.time('eval');
// eval(code + "; var a = 1; fn();");
// console.timeEnd('eval');

const baseSandbox = {
  result: undefined,
  require: require,
  console: console
}

// const sandbox1 = createChildContext(baseSandbox)
// sandbox1.a = 1

// const sandbox2 = createChildContext(sandbox1)

var vm = require('vm');
// var context1 = vm.createContext(sandbox1);
// var context2 = vm.createContext(sandbox2);
// console.log("context1", context1.a)
// console.log("context2", context2.a)
// console.log("sandbox1", sandbox1.a)
// console.log("sandbox2", sandbox2.a)
//
// // var script = new vm.Script("var fn = " + code + ";fn();");
// var script = new vm.Script(code + ";fn();");
//
// console.time('vm');
// script.runInContext(context1);
// console.timeEnd('vm');
//
// console.log("context1", context1.a)
// console.log("context2", context2.a)
// console.log("sandbox1", sandbox1.a)
// console.log("sandbox2", sandbox2.a)

function on(locale) {
  var sandbox = createChildContext(baseSandbox)
  return {
    use: function(obj) {
      sandbox = createChildContext(sandbox, obj)
      return this;
    },
    then: function(fn) {
      return new Promise(function(resolve, reject) {
        try {
          const code = "result = (" + fn.toString() + ")();"
          console.log(code);
          var script = new vm.Script(code);
          console.time('vm');
          const resultSandbox = createChildContext(sandbox, { result: undefined })
          script.runInNewContext(resultSandbox);
          console.timeEnd('vm');
          resolve(resultSandbox.result)
        } catch (err) {
          reject(err);
        }
      })
    }
  }
}

const Locales = [1]

on(Locales[0])
  .use({a: 1})
  .then(() => {
    function nop() {};
    var i = 1000000;
    while (i--) {
      nop();
    }
    console.log(a)
    a += 1
    console.log(a)
  })
.catch((err) => console.log(err))

on(Locales[0])
  .use({b: 8})
  .then(() => b * 2)
  .then((result) => console.log("result", result))
  .catch((err) => console.log(err))
