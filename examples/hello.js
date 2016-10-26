'use strict';

var parallac = require('../lib/parallac')
var run = parallac.run

// run(() => {
//   writeln("hello from each locale:")
//   return Locales.map((locale) => on(locale).do(() => writeln("hello from locale", here.id)))
// })

run(() => Locales.map((locale) => on(locale).do(() => writeln("hello from locale", here.id))))
