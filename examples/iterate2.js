'use strict';

var parallac = require('../lib/parallac')
var run = parallac.run

run(() => {
  function writeMatrix(dim, m) {
    const x = dim[0]
    const y = dim[1]
    for (let j = 0; j < x; j++) {
      let row = []
      for (let i = 0; i < y; i++) {
        row.push(m[j*x + i])
      }
      writeln(row)
    }
    writeln()
  }

  function iterate(x, a) {
    writeln("iteration", x)
    writeln()
    return Promise.resolve(x)
      .then((x1) => {
        if (x1 >= 1) {
          return a.setAll(x1)
            .then(() => a.getAll())
            .then((data) => writeMatrix(a.domain.dim, data))
            .then(() => iterate(x1 - 1, a))
        }
        writeln("done!")
        return a
      })
  }

  return createDomain(Locales, 8, 8) // 8x8 matrix dimensions
    .then((d) => createDistArray(d))
    .then((a) => iterate(10, a))
    .then((a) => a.getAll())
})
