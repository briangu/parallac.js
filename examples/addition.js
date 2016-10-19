'use strict';

var parallac = require('../lib/client')()
var run = parallac.run

run(() => {
  return createDomain(Locales, 16)
    .then((d) => {
      let calls = []
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

      let calls = []
      calls.push(a.setAll(1))
      calls.push(b.setAll(2))

      return Promise.all(calls)
        .then(() => c.zip(a, b).set((x, y) => x + y))
        .then(() => c.getAll())
    })
})
.then((results) => {
  console.log("a + b = ", results)
})
