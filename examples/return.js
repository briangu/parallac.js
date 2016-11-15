'use strict';

var parallac = require('../lib/parallac')
var run = parallac.run

/*
  Return a scalar (16) from the server

  Note: When a Promise is returned to run(), it will automatically apply Promise.all and wait for the async operation to complete.
*/
run(() => on(here).do(() => 16))
  .then(console.log)
