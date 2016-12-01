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
      let a = createDistArray(d).then((a) => a.setAll(1))
      let b = createDistArray(d).then((a) => a.setAll(2))
      return Promise.all([a,b])
    })
    .then((r) => r[0].zip(r[0], r[1]).set((x, y) => x + y))
    .then((a) => a.getAll())
})
.then((results) => {
  console.log("a + b = ", results)
})
