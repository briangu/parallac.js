'use strict';

var parallac = require('../lib/client')()
var run = parallac.run

/*
  Return a scalar (16) from the server using a remote calculation based on a context we provide.
  The variable 'b' is added to the global context in which the 'do' clause is run, allowing it to access 'b'.
*/
run(() => on(here)
  .with({
    b: 8
  })
  .do(() => b * 2))
  .then(console.log)

