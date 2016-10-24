'use strict';

var parallac = require('../lib/parallac')
var run = parallac.run

run(() => {
  var calls = []
  for (let locale of Locales) {
    calls.push(on(locale).do(() => here.id))
  }
  return Promise.all(calls)
})
.then((results) => {
  console.log("locale ids sent from each locale: ", results)
})
