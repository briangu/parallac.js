'use strict';

var parallac = require('../lib/parallac')
var run = parallac.run

/*
  When a promise or an array of Promises is returned to run(), it will automatically apply Promise.all and wait for everything to complete.
*/
run(() =>
  Locales.map((locale) =>
    on(locale)
      .with({
        b: (8 * locale.id)
      })
      .do(() => b)))
.then((results) => console.log(results))
