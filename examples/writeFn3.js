'use strict';

var parallac = require('../lib/parallac')
var run = parallac.run

run(() => {
  let x = 2
  let y = 3
  writeFn(
    ((a, b) => console.log(a + b)),
    x,
    y
  )
})
