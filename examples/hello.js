'use strict';

var parallac = require('../lib/client')()
var run = parallac.run

// TODO: this currently prints on the server-side, we want the writeln to reroute back to the clients
var fn = () => {
  writeln()
  writeln("test: hello from each locale")
  var calls = []
  for (let locale of Locales) {
    calls.push(on(locale).do(() => writeln("hello from locale", here.id)))
  }
  return Promise.all(calls)
}

var fnReturn = () => {
  var calls = []
  for (let locale of Locales) {
    calls.push(on(locale).do(() => here.id))
  }
  return Promise.all(calls)
}

parallac
  .init()
  .then((config) => {
    var calls = []
    calls.push(run(fn))
    calls.push(run(fnReturn))
    return Promise.all(calls)
      .then((results) => {
        console.log(results)
        parallac.done()
      })
  })
