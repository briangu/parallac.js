var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
chai.should();
chai.use(chaiAsPromised);

var run = require('../parallac').run

describe("test DistArray", function () {
  it("test DistArray iterator", function () {
    return run(() => {
        var assert = require('assert')
        return createDomain(Locales, 2)
          .then((d) => createDistArray(d))
          .then((a) => a.getAll().then((all) => {
            assert([0, 0], all)
            return a
          }))
          .then((a) => a.set(0, 5))
          .then((a) => a.getAll())
      })
      .should.eventually.deep.equal([5,0])
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
              .then(() => c.getAll())
          })
      })
      .should.eventually.be.deep.equal([ 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3 ])
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
              .then(() => c.getAll())
          })
      })
      .should.eventually.be.deep.equal([ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16 ])
  })

  // it("", function () {
  //   return .should.be.fulfilled
  // })
})