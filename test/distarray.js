var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
chai.should();
chai.use(chaiAsPromised);

var run = require('../parallac').run

describe("test DistArray", function () {
  it("", function () {
    return run(() => {
        writeln()
        writeln("test: DistArray iterator")

        return createDomain(Locales, 2)
          .then((d) => {
            var calls = []
            calls.push(Promise.resolve(d))
            calls.push(createDistArray(d))
            return Promise.all(calls)
          })
          .then((varr) => {
            const d = varr[0]
            const a = varr[1]

            return Promise.resolve()
              .then(() => a.getAll().then((all) => writeln("a: ", all)))
              .then(() => a.set(0, 5))
              .then(() => a.getAll().then((all) => writeln("a: ", all)))
          })
      })
      .should.be.fulfilled
  })

  /*

  "assembly language" version of:

  let d = domain(Locales, 16)
  let a = DistArray(d)
  let b = DistArray(d)
  let c = DistArray(d)

  a = 1
  b = 2
  c = a + b

  */
  it("", function () {
    return run(() => {
      writeln()
      writeln("test: vector addition")

      return createDomain(Locales, 16)
        .then((d) => {
          var calls = []
          calls.push(Promise.resolve(d))
          calls.push(createDistArray(d))
          calls.push(createDistArray(d))
          calls.push(createDistArray(d))
          return Promise.all(calls)
        })
        .then((varr) => {
          const d = varr[0]
          const a = varr[1]
          const b = varr[2]
          const c = varr[3]

          return Promise.resolve()
            .then(() => a.setAll(1))
            .then(() => b.setAll(2))
            .then(() => c.zip(a, b).set((x, y) => x + y))
            .then(() => a.getAll().then(writeln))
            .then(() => b.getAll().then(writeln))
            .then(() => c.getAll().then(writeln))
        })
    })
    .should.be.fulfilled
  })

  it("", function () {
    return run(() => {
      writeln()
      writeln("test: vector addition - test locales")

      return createDomain(Locales, 16)
        .then((d) => {
          var calls = []
          calls.push(Promise.resolve(d))
          calls.push(createDistArray(d))
          calls.push(createDistArray(d))
          calls.push(createDistArray(d))
          return Promise.all(calls)
        })
        .then((varr) => {
          const d = varr[0]
          const a = varr[1]
          const b = varr[2]
          const c = varr[3]

          return Promise.resolve()
            .then(() => a.setAll(1))
            .then(() => b.forAll().set((i) => i))
            .then(() => c.zip(a, b).set((x, y) => x + y))
            .then(() => a.getAll().then(writeln))
            .then(() => b.getAll().then(writeln))
            .then(() => c.getAll().then(writeln))
        })
    })
    .should.be.fulfilled
  })

  // it("", function () {
  //   return .should.be.fulfilled
  // })
})
