'use strict';

var parallac = require('../lib/client')()
var run = parallac.run

run(() => {
  var calls = []
  for (let locale of Locales) {
    calls.push(on(locale).do(() => here.id))
  }
  return Promise.all(calls)
})
.then(console.log)
