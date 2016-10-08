'use strict';

var parallac = require('./parallac')
var Locales = parallac.Locales
var on = parallac.on
var session = parallac.session
var Domain = parallac.Domain
var DistArray = parallac.DistArray

// session(Locales)
//   .then((locales) => {
//     let d = new Domain(locales, 16)
//     let a = new DistArray(d)
//     let b = new DistArray(d)
//     let c = new DistArray(d)
//     a.set(1) // set all values to 1 across all locales
//     b.set(2) // set all values to 2 across all locales
//     c.forAll((i) => a.get(i) + b.get(i)) // on each locale, assign the sum of a + b to c
//     console.log(a.toString())
//     console.log(b.toString())
//     console.log(c.toString())
//   })

session(Locales)
  .with(() => {
    d: new Domain(locales, 16)
  })
  .with(() => {
    a: new DistArray(d),
    b: new DistArray(d),
    c: new DistArray(d)
  })
  .run(() => {
    a.set(1) // set all values to 1 across all locales
    b.set(2) // set all values to 2 across all locales
    c.forAll((i) => a.get(i) + b.get(i)) // on each locale, assign the sum of a + b to c
    console.log(a.toString())
    console.log(b.toString())
    console.log(c.toString())
  })
