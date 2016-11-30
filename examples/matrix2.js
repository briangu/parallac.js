'use strict';

var parallac = require('../lib/parallac')
var run = parallac.run

run(() => {
  return createDomain(Locales, 8, 8) // 8x8 matrix dimensions
    .then((d) => createDistArray(d))
    .then((a) => a.forAll().set((i) => i))
    .then((a) => a.getAll().then((data) => ({
      dim: a.domain.dim,
      data: data
    })))
})
.then((results) => {
  const dim = results.dim
  const x = dim[0]
  const y = dim[1]
  const data = results.data
  for (let j = 0; j < x; j++) {
    for (let i = 0; i < y; i++) {
      process.stdout.write("\t"+data[j*x + i])
    }
    console.log()
  }
  console.log()
})
