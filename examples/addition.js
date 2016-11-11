'use strict';

var parallac = require('../lib/parallac')
var run = parallac.run

run(() => {
  return createDomain(Locales, 16)
    .then((d) => createDistArray(d))
    .then((a) => a.forAll().set((i) => i))
    .then((a) => a.map().do((x) => writeln(x)))
    .then((a) => a.getAll())
})
.then((results) => {
  console.log("a[i] = i =>", results)
})
