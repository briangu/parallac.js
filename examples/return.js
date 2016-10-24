'use strict';

var parallac = require('../lib/parallac')
var run = parallac.run

/*
  Return a scalar (16) from the server
*/
run(() => on(here)
  .do(() => 16))
  .then(console.log)

