'use strict';

var parallac = require('../lib/client')()
var run = parallac.run

run(() => {
  writeln("hello from each locale:")
  for (let locale of Locales) {
    on(locale).do(() => writeln("hello from locale", here.id))
  }
})