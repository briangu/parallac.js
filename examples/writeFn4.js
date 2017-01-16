'use strict';

var parallac = require('../lib/parallac')
var run = parallac.run

run(() => {
  let fn = (a, b) => console.log(a + b)
  let x = 2
  let y = 3
  writeFn(fn, x, y)
})
