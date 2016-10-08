'use strict';

var parallac = require('./parallac')
var Locales = parallac.Locales
var on = parallac.on
var Domain = parallac.Domain
var DistArray = parallac.DistArray
var DistArrayIterator = parallac.DistArrayIterator

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

on(Locales[0])
  .with({
    a: 1
  })
  .run(() => {
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
  .with({
    b: 8
  })
  .run(() => b * 2)
  .then((result) => console.log("result", result))
  .catch((err) => console.log(err))

var d = new Domain(Locales, 2)
var da = new DistArray(d)

var it = {
    [Symbol.iterator]() {
        return DistArrayIterator(da)
    }
};
for (let v of it) {
  console.log("v", v)
}
console.log("da: ", da.toString())
da.put(0, 5)
for (let v of it) {
  console.log("v", v)
}
console.log("da: ", da.toString())
