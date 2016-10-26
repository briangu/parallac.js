'use strict';

var parallac = require('../lib/parallac')
var run = parallac.run

// On each locale, remotely print the phrase "hello from locale <locale id>"
//
// NOTE: All remote writeln operations are sent back to the client, which is why you can see the output from a remote locale
//
run(() => Locales.map((locale) => on(locale).do(() => writeln("hello from locale", here.id))))
