'use strict';

var parallac = require('../lib/parallac')
var run = parallac.run

/*
  Using the with keyword, we can inject dynamic values into the 'on' scope
*/
run(() =>
  Locales.map((locale) =>
    on(locale)
      .with({
        b: (8 * locale.id)
      })
      .do(() => b)))
.then((results) => console.log(results))
