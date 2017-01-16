'use strict';

var parallac = require('../lib/parallac')
var run = parallac.run

run(() =>
  writeFn(
    ((x) => console.log(x)),
    "hello, world!"
  )
)
