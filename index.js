'use strict';

var parallac = require('./parallac')
var on = parallac.on
var Domain = parallac.Domain
var DistArray = parallac.DistArray
var DistArrayIterator = parallac.DistArrayIterator

function testHere(config) {
  on(config.here)
    .do(() => {
      console.log("hello from locale", here.id)
    })
}

function testHereIds(config) {
  for (let locale of config.Locales) {
    on(locale)
      .do(() => {
        console.log("hello from locale", here.id)
      })
  }
}

function testContextUpdate(config) {
  on(config.here)
    .with({
      a: 1
    })
    .do(() => {
      function nop() {};
      var i = 1000000;
      while (i--) {
        nop();
      }
      console.log(a)
      a += 1
      console.log(a)
    })
    .catch((err) => console.log(err))
}

function testReturningResult(config) {
  on(config.here)
    .with({
      b: 8
    })
    .do(() => b * 2)
    .then((result) => console.log("result", result))
    .catch((err) => console.log(err))
}

function testDistArray(config) {
  var d = new Domain(config.Locales, 2)
  var da = new DistArray(d)

  var it = {
    [Symbol.iterator]() {
      return DistArrayIterator(da)
    }
  };
  for (let v of it) {
    console.log("v", v)
  }
  console.log("da: ", da.toString())
  da.put(0, 5)
  for (let v of it) {
    console.log("v", v)
  }
  console.log("da: ", da.toString())
}

parallac.run((config) => {
  testHere(config)
  testHereIds(config)
  testContextUpdate(config)
  testReturningResult(config)
  testDistArray(config)
})
