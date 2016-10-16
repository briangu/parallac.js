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
  writeln("test: hello from each locale")
  for (let locale of Locales) {
    on(locale).do(() => writeln("hello from locale", here.id))
  }
})

run(() => {
  writeln()
  writeln("test: vector addition - test locales")

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

      return Promise.resolve()
        .then(() => a.setAll(1))
        .then(() => b.forAll().set((i) => i))
        .then(() => c.zip(a,b).set((x,y) => x + y))
        .then(() => a.getAll().then(writeln))
        .then(() => b.getAll().then(writeln))
        .then(() => c.getAll().then(writeln))
    })
})
