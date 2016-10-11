'use strict';

var parallac = require('./parallac')
var run = parallac.run

// parallac.init()
//   .then((globalConfig) => {
//     let SessionManager = parallac.SessionManager
//     let session = new SessionManager(globalConfig)
//     return session
//       .do(() => {
//         for (let locale of Locales) {
//           on(locale)
//             .do(() => {
//               writeln("hello from locale", here.id)
//             })
//         }
//       })
//   })

run(() => {
  writeln()
  writeln("test: hello from locale 0")
  writeln("hello from locale", here.id)
})

run(() => {
  writeln()
  writeln("test: hello from each locale")
  for (let locale of Locales) {
    on(locale).do(() => writeln("hello from locale", here.id))
  }
})

run(() => {
  writeln()
  writeln("test: hello from each locale")
  on(here)
    .with({
      a: 1
    })
    .do(() => {
      function nop() {};
      var i = 1000000;
      while (i--) {
        nop();
      }
      writeln(a)
      a += 1
      writeln(a)
    })
    .catch((err) => writeln(err))
})

// run(() => {
//   writeln()
//   writeln("test: return result")
//   on(here)
//     .with({
//       b: 8
//     })
//     .do(() => b * 2)
//     .then((result) => writeln("8 * 2 = ", result))
// })

run(() => {
  writeln()
  writeln("test: DistArray iterator")
  var d = new Domain(Locales, 2)
  var da = new DistArray(d)

  // var it = {
  //   [Symbol.iterator]() {
  //     return DistArrayIterator(da)
  //   }
  // };
  // for (let v of it) {
  //   writeln("v", v)
  // }
  writeln("da: ", da.toString())
  da.put(0, 5)
  // for (let v of it) {
  //   writeln("v", v)
  // }
  writeln("da: ", da.toString())
})

run(() => {
  writeln()
  writeln("test: vector addition")
  let d = new Domain(Locales, 16)
  let a = new DistArray(d)
  let b = new DistArray(d)
  let c = new DistArray(d)
  a.set(1) // set all values to 1 across all locales
  // b.set(2) // set all values to 2 across all locales
  // c.forAll((i) => a.get(i) + b.get(i)) // on each locale, assign the sum of a + b to c
  writeln(a.toString())
  // writeln(b.toString())
  // writeln(c.toString())
})
