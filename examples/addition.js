'use strict';

var parallac = require('../lib/parallac')
var run = parallac.run

run(() => {
  return createDomain(Locales, 16)
    .then((d) => createDistArray(d))
    .then((a) => a.setAll(1))
    .then((a) => a.map().set((x) => x + 1))
    .then((a) => a.getAll())
})
.then((results) => {
  // expect: a = 1; a + 1 => [ 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2 ]
  console.log("a = 1; a + 1 =>", results)
})
