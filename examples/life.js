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

  function setCell(a, x, y, value) {
    return a.set(a.domain.dim[0]*x + y, value)
  }

  function getCell(a, x, y) {
    return a.get(a.domain.dim[0]*x + y)
  }

  function updateCellWithNeighbors(neighbors) {
    let x = neighbors[0][0]
    let y = neighbors[0][1]
    let center = neighbors[1]
    let north = neighbors[2]
    let south = neighbors[3]
    let west = neighbors[4]
    let east = neighbors[5]
    let sum = north + south + west + east

    if (sum === 3) {
      if (center === 1) {
        return setCell(x, y, 1)
      }
    } else if (sum === 4) {
      if (center === 1) {
        return setCell(x, y, 0)
      }
    }

    // NOP
  }

  function evolve(a) {
    const dim = a.domain.dim
    const x = dim[0]
    const y = dim[1]

    let calls = []

    for (let j = 0; j < x; j++) {
      for (let i = 0; i < y; i++) {
        let neighbors = []
        neighbors.push(Promise.resolve([x, y]))
        neighbors.push(getCell(i, j))
        neighbors.push(getCell(i, j - 1)) // north
        neighbors.push(getCell(i, j + 1)) // south
        neighbors.push(getCell(i - 1, j)) // west
        neighbors.push(getCell(i + 1, j)) // east
        calls.push(Promise.all(neighbors)
          .then((results) => updateCellWithNeighbors(results)))
      }
    }

    return Promise.all(calls)
  }

  function iterate(x, a) {
    writeln("iteration", x)
    writeln()
    if (x >= 1) {
      return evolve(a)
        .then(() => a.getAll())
        .then((data) => writeMatrix(a.domain.dim, data))
        .then(() => iterate(x - 1, a))
    }
    writeln("done!")
    return a
  }

  return createDomain(Locales, 11, 11)
    .then((d) => createDistArray(d))
    .then((a) => setCell(a, 5, 5, 1))
    .then((a) => iterate(10, a))
    .then((a) => a.getAll())
})
