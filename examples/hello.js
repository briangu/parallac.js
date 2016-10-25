'use strict';

var parallac = require('../lib/parallac')
var run = parallac.run

run(() => {
  writeln("hello from each locale:")
  // TODO: catch array of Promises in framework and wrap with Promise.all
  var calls = Locales.map((locale) =>
    on(locale).do(() =>
      writeln("hello from locale", here.id)))
  return Promise.all(calls)
})