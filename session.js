'use strict';

var async = require('asyncawait/async');
var await = require('asyncawait/await');

var parallac = require('./parallac')
var on = parallac.on

function run(Locales) {
  for (let locale of Locales) {
    on(locale)
      .do(() => {
        console.log("hello from locale", here.id)
      })
  }
}

async(function () {
  await (parallac.init()
    .then(run)
    .catch((err) => {
      console.log("failed: ", err);
    }))
})();
