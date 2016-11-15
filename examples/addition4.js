'use strict';

var parallac = require('../lib/parallac')
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
      calls.push(createDistArray(d).then((a) => a.setAll(1)))
      calls.push(createDistArray(d).then((b) => b.forAll().set((i) => i)))
      calls.push(createDistArray(d))
      return Promise.all(calls)
    })
    .then((r) => {
      let a = r[0]
      let b = r[1]
      let c = r[2]
      return c.zip(a, b).set((x, y) => x + y)
        .then(() => {
          let calls = []
          calls.push(a.getAll())
          calls.push(b.getAll())
          calls.push(c.getAll())
          return Promise.all(calls)
        })
    })
})
.then((results) => {
  console.log("a + b = c")
  console.log(results[0] + " + " + results[1] + " = " + results[2])
})
