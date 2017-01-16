'use strict';

var parallac = require('../lib/parallac')
var run = parallac.run

// writeFn is like writeln, except that instead of printing a string to the local console,
// the system executes the supplied function Fn using the supplied arguments.
// This feature is particularly useful if you want to do something more than printing
// to the console - e.g. draw on a canvas

// Return a function that writes "hello, world!" locally using console.log
run(() => writeFn((() => console.log("hello, world!"))))
