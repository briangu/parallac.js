'use strict';

var parallac = require('./parallac')

// parallac.init()
//   .then((globalConfig) => {
//     let SessionManager = parallac.SessionManager
//     let session = new SessionManager(globalConfig)
//     return session
//       .do(() => {
//         for (let locale of Locales) {
//           on(locale)
//             .do(() => {
//               console.log("hello from locale", here.id)
//             })
//         }
//       })
//   })

parallac.run(() => {
  console.log()
  console.log("test: hello from locale 0")
  console.log("hello from locale", here.id)
})

parallac.run(() => {
  console.log()
  console.log("test: hello from each locale")
  for (let locale of Locales) {
    on(locale).do(() => console.log("hello from locale", here.id))
  }
})

parallac.run(() => {
  console.log()
  console.log("test: hello from each locale")
  on(here)
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
})

parallac.run(() => {
  console.log()
  console.log("test: return result")
  return on(here)
    .with({
      b: 8
    })
    .do(() => b * 2)
    .then((result) => console.log("8 * 2 = ", result))
})

parallac.run(() => {
  console.log()
  console.log("test: DistArray iterator")
  var d = new Domain(Locales, 2)
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
})
