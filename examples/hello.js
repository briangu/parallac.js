'use strict';

var parallac = require('../lib/parallac')()
var run = parallac.run

run(() => {
  writeln("hello from each locale:")
  for (let locale of Locales) {
    on(locale).do(() => writeln("hello from locale", here.id))
  }
})