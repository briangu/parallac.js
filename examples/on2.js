'use strict';

var parallac = require('../lib/parallac')
var run = parallac.run

/*
  Using the 'on' function, you can remote from a locale to another locale.
  Here, for every locale, we call the next locale and get its id.
*/
run(() =>
  Locales.map((locale) =>
    on(locale)
      .do(() => {
        let nextLocale = (here.id + 1) % Locales.length
        return on(Locales[nextLocale]).do(() => here.id)
      })))
.then((results) => console.log(results))
