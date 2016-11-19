'use strict';

var parallac = require('../lib/parallac')
var run = parallac.run

/*
  The 'on' function allows you to execute code on a specified locale.
  The 'do' operation is remoted to that locale, where it excutes and returns the result back to the originating locale.
*/
run(() => on(Locales[0]).do(() =>here.id))
  .then((localeId) => console.log("hello from locale", localeId))
