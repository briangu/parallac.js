'use strict';

var parallac = require('../lib/parallac')
var run = parallac.run

/*
  Return a scalar (16) from the server using a remote calculation based on a context we provide.
  The variable 'b' is added to the global context in which the 'do' clause is run, allowing it to access 'b'.

  Note: When a Promise is returned to run(), it will automatically apply Promise.all and wait for the async operation to complete.
*/
run(() => on(here)
  .with({
    b: 8
  })
  .do(() => b * 2))
  .then(console.log)

