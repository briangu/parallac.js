'use strict';

var parallac = require('../lib/parallac')
var run = parallac.run

run(() => Locales.map((locale) => on(locale).do(() => here.id)))
  .then((results) => {
    console.log("locale ids sent from each locale: ", results)
  })