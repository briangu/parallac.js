'use strict';

var parallac = require('../lib/parallac')
var run = parallac.run

/*
  Time
*/
run(() => {
    var count = count || 10000
    writeln("iteration count", count)
    var start = new Date().getTime()
    let calls = []
    for (let i = 0; i < count; i++) {
      calls.push(Locales.map((locale) => on(here).do(() => 16)))
    }
    return Promise.all(calls)
      .then(() => {
        var stop = new Date().getTime()
        writeln("time (ms) per iteration: ", (stop - start) / count )
      })
  },
  undefined,
  {
    with: {
      count: parseInt(process.argv[2])
    }
  })