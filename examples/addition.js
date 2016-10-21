'use strict';

var parallac = require('../lib/client')()
var run = parallac.run

/*

"assembly language" (post-transpiled) version of:

let d = domain(Locales, 16)
let a = DistArray(d)
let b = DistArray(d)
let c = DistArray(d)

a = 1
b = 2
c = a + b

*/
run(() => {
  return createDomain(Locales, 16)
    .then((d) => {
      let calls = []
      calls.push(createDistArray(d))
      calls.push(createDistArray(d))
      calls.push(createDistArray(d))
      return Promise.all(calls)
    })
    .then((varr) => {
      const a = varr[0]
      const b = varr[1]
      const c = varr[2]

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
