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

// run(() => {
//   writeln()
//   writeln("test: DistArray iterator")
//   var d = new Domain(Locales, 2)
//   var da = new DistArray(d)

//   // var it = {
//   //   [Symbol.iterator]() {
//   //     return DistArrayIterator(da)
//   //   }
//   // };
//   // for (let v of it) {
//   //   writeln("v", v)
//   // }
//   writeln("da: ", da.toString())
//   da.put(0, 5)
//     // for (let v of it) {
//     //   writeln("v", v)
//     // }
//   writeln("da: ", da.toString())
// })

  /*

  "assembly language" version of:

  let d = domain(Locales, 16)
  let a = DistArray(d)
  let b = DistArray(d)
  let c = DistArray(d)

  a = 1
  b = 2
  c = a + b

  */
  
run(() => {
  writeln()
  writeln("test: vector addition")

  return createDomain(Locales, 16)
    .then((d) => {
      var calls = []
      calls.push(Promise.resolve(d))
      calls.push(createDistArray(d))
      calls.push(createDistArray(d))
      calls.push(createDistArray(d))
      return Promise.all(calls)
    })
    .then((varr) => {
      const d = varr[0]
      const a = varr[1]
      const b = varr[2]
      const c = varr[3]

      return a.set(1)
        .then(() => b.set(2))
        .then(() => c.zip(a,b).set((x,y) => x + y))
        .then(() => a.getAll().then(writeln))
        .then(() => b.getAll().then(writeln))
        .then(() => c.getAll().then(writeln))
    })
})
