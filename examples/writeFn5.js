'use strict';

var parallac = require('../lib/parallac')
var run = parallac.run

run(() => {
  let fn = (a, b) => console.log(a + b)
  for (let x = 0; x < 5; x++) {
    for (let y = 0; y < 5; y++) {
      writeFn(fn, x, y)
    }
  }
})
