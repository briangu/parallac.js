'use strict';

var parallac = require('../lib/parallac')
var run = parallac.run

run(() => {
  function writeMatrix(dim, m) {
    const dimX = dim[0]
    const dimY = dim[1]

    for (let y = 0; y < dimY; y++) {
      let row = []
      for (let x = 0; x < dimX; x++) {
        row.push(m[dimX * y + x])
      }
      writeln(row)
    }
    writeln()
  }

  function boundX(a, x) {
    const dimX = a.domain.dim[0]
    if (x < 0) {
      x = dimX - 1
    } else if (x >= dimX) {
      x = 0
    }
    return x
  }

  function boundY(a, y) {
    const dimY = a.domain.dim[1]
    if (y < 0) {
      y = dimY - 1
    } else if (y >= dimY) {
      y = 0
    }
    return y
  }

  function setCell(a, x, y, value) {
    const dimX = a.domain.dim[0]

    x = boundX(a, x)
    y = boundY(a, y)

    return a.set(dimX * y + x, value)
  }

  function getCell(a, x, y) {
    const dimX = a.domain.dim[0]

    x = boundX(a, x)
    y = boundY(a, y)

    return a.get(dimX * y + x)
  }

  function updateCellWithNeighbors(a, neighbors) {
    let x = neighbors[0][0]
    let y = neighbors[0][1]
    let center = neighbors[1]

    let sum = 0
    for (let i = 2; i < neighbors.length; i++) {
      sum += neighbors[i]
    }

    if (center === 1) {
      if (sum < 2) {
        return setCell(a, x, y, 0)
      } else if (sum > 3) {
        return setCell(a, x, y, 0)
      }
    } else {
      if (sum === 3) {
        return setCell(a, x, y, 1)
      }
    }

    // NOP
  }

  function evolve(a) {
    const dimX = a.domain.dim[0]
    const dimY = a.domain.dim[1]

    let calls = []

    for (let x = 0; x < dimX; x++) {
      for (let y = 0; y < dimY; y++) {
        let neighbors = []
        neighbors.push(Promise.resolve([x, y]))
        neighbors.push(getCell(a, x, y))          // center

        neighbors.push(getCell(a, x - 1, y - 1))  // NW
        neighbors.push(getCell(a, x, y - 1))      // N
        neighbors.push(getCell(a, x + 1, y - 1))  // NE

        neighbors.push(getCell(a, x - 1, y))      // W
        neighbors.push(getCell(a, x + 1, y))      // E

        neighbors.push(getCell(a, x - 1, y + 1))  // SW
        neighbors.push(getCell(a, x, y + 1))      // S
        neighbors.push(getCell(a, x + 1, y + 1))  // SE

        calls.push(Promise.all(neighbors)
          .then((results) => updateCellWithNeighbors(a, results)))
      }
    }

    return Promise.all(calls)
  }

  function randomlyInitialize(a) {
    const dimX = a.domain.dim[0]
    const dimY = a.domain.dim[1]

    let calls = []

    for (let x = 0; x < dimX; x++) {
      for (let y = 0; y < dimY; y++) {
        if (Math.random() >= 0.45) {
          calls.push(setCell(a, x, y, 1))
        }
      }
    }

    return Promise.all(calls)
      .then(() => a)
  }

  function initializeWithGlider(a) {
    const dimX = a.domain.dim[0]
    const dimY = a.domain.dim[1]

    let calls = []

    const midX = 5;
    const midY = 5;

    calls.push(setCell(a, midX, midY, 1))
    calls.push(setCell(a, midX + 1, midY, 1))
    calls.push(setCell(a, midX + 1, midY - 2, 1))
    calls.push(setCell(a, midX + 2, midY, 1))
    calls.push(setCell(a, midX + 2, midY - 1, 1))

    return Promise.all(calls)
      .then(() => a)
  }
  function iterate(x, a) {
    writeln("iteration", x)
    writeln()
    if (x >= 1) {
      return evolve(a)
        .then(() => a.getAll().then((data) => writeMatrix(a.domain.dim, data)))
        .then(() => iterate(x - 1, a))
    }
    writeln("done!")
    return a
  }

  return createDomain(Locales, 11, 11)
    .then((d) => createDistArray(d))
    // .then((a) => randomlyInitialize(a))
    .then((a) => initializeWithGlider(a))
    .then((a) => a.getAll().then((data) => writeMatrix(a.domain.dim, data)).then(() => a))
    .then((a) => iterate(48, a))
    .then((a) => a.getAll().then((data) => writeMatrix(a.domain.dim, data)))
})
