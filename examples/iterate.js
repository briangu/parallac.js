'use strict';

var parallac = require('../lib/parallac')
var run = parallac.run

run(() => {
  function iterate(x, a) {
    return (x >= 1) ? a.setAll(x).then(() => iterate(x - 1, a)) : a
  }

  return createDomain(Locales, 8, 8) // 8x8 matrix dimensions
    .then((d) => createDistArray(d))
    .then((a) => iterate(10, a))
    .then((a) => a.getAll())
})
.then((results) => {
  for (let j = 0; j < 8; j++) {
    for (let i = 0; i < 8; i++) {
      process.stdout.write("\t"+results[j*8 + i])
    }
    console.log()
  }
  console.log()
})
