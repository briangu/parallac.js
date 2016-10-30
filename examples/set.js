'use strict';

var parallac = require('../lib/parallac')
var run = parallac.run

run(() => {
  return createDomain(Locales, 16)
    .then((d) => createDistArray(d))
    .then((a) => a.setAll(2))
    .then((a) => a.getAll())
})
.then((results) => {
  console.log("a = ", results)
})
