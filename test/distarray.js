var chai = require("chai");
// var assert = chai.assert
var chaiAsPromised = require("chai-as-promised");
chai.should();
chai.use(chaiAsPromised);

var run = require('../lib/parallac').run

const testLocaleConfig = {
  locales: [{
    URI: "memory://1"
  },{
    URI: "memory://1"
  },{
    URI: "memory://1"
  },{
    URI: "memory://1"
  }],
  here: {
    URI: "memory://1"
  }
}
var testRun = (fn) => run(fn, testLocaleConfig)

describe("test DistArray", function () {
  it("set", function () {
    return testRun(() => {
      return createDomain(Locales, 8)
        .then((d) => createDistArray(d))
        .then((a) => a.setAll(2))
        .then((a) => a.getAll())
    })
    .should.eventually.deep.equal([2,2,2,2,2,2,2,2])
  })

  it("iterator", function () {
    return testRun(() => {
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

  it("map", function () {
    var q = 0
    return testRun(() => {
      return createDomain(Locales, 8)
        .then((d) => createDistArray(d))
        .then((a) => a.setAll(1))
        .then((a) => a.map().do((x) => { var assert = require('assert'); assert(x === 1) }))
        .then((a) => a.getAll())
        .should.eventually.deep.equal([1,1,1,1,1,1,1,1])
    })
  })

  it("forAll", function () {
    var q = 0
    return testRun(() => {
      return createDomain(Locales, 8)
        .then((d) => createDistArray(d))
        .then((a) => a.forAll().set((i, x) => i)) // set values to the index
        .then((a) => a.forAll().do((i, x) => { var assert = require('assert'); assert(x === i) }))
        .then((a) => a.getAll())
        .should.eventually.deep.equal([0,1,2,3,4,5,6,7])
    })
  })

  it("zip set via vector addition a + b = c", function () {
    var q = 0
    return testRun(() => {
      return createDomain(Locales, 8)
        .then((d) => {
          let calls = []
          calls.push(createDistArray(d).then((a) => a.setAll(1)))
          calls.push(createDistArray(d).then((a) => a.setAll(2)))
          calls.push(createDistArray(d))
          return Promise.all(calls)
        })
        .then((r) => r[2].zip(r[0], r[1]).set((x, y) => x + y)) // zip2?
        .then((c) => c.getAll())
        .should.eventually.deep.equal([3,3,3,3,3,3,3,3])
    })
  })

  it("zip set via vector addition reusing a in a + b = a'", function () {
    var q = 0
    return testRun(() => {
      return createDomain(Locales, 8)
        .then((d) => {
          let calls = []
          calls.push(createDistArray(d).then((a) => a.setAll(1)))
          calls.push(createDistArray(d).then((a) => a.setAll(2)))
          return Promise.all(calls)
        })
        .then((r) => r[0].zip(r[0], r[1]).set((x, y) => x + y)) // zip2?
        .then((a) => a.getAll())
        .should.eventually.deep.equal([3,3,3,3,3,3,3,3])
    })
  })

  it("vector addition and ensure locale variation: a + b = c", function () {
    var q = 0
    return testRun(() => {
      return createDomain(Locales, 8)
        .then((d) => {
          let calls = []
          calls.push(createDistArray(d).then((a) => a.setAll(1)))
          calls.push(createDistArray(d).then((a) => a.forAll().set((i) => i)))
          calls.push(createDistArray(d))
          return Promise.all(calls)
        })
        .then((r) => r[2].zip(r[0], r[1]).set((x, y) => x + y)) // zip2?
        .then((c) => c.getAll())
        .should.eventually.deep.equal([1,2,3,4,5,6,7,8])
    })
  })

  /*
    this should more like: r[0].zip(r[1]).do(...)
  */
  it("zip do", function () {
    var q = 0
    return testRun(() => {
      return createDomain(Locales, 8)
        .then((d) => {
          let calls = []
          calls.push(createDistArray(d).then((a) => a.setAll(1)))
          calls.push(createDistArray(d).then((a) => a.setAll(2)))
          return Promise.all(calls)
        })
        .then((r) => r[0].zip(r[0], r[1]).do((x, y) => {
          let assert = require('assert')
          assert(x + y == 3)
        }))
        .should.be.fullfilled
    })
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
  // it("vector addition: a + b = c", function () {
  //   return testRun(() => {
  //       return createDomain(Locales, 16)
  //         .then((d) => {
  //           let calls = []
  //           calls.push(Promise.resolve(d))
  //           calls.push(createDistArray(d))
  //           calls.push(createDistArray(d))
  //           calls.push(createDistArray(d))
  //           return Promise.all(calls)
  //         })
  //         .then((varr) => {
  //           const d = varr[0]
  //           const a = varr[1]
  //           const b = varr[2]
  //           const c = varr[3]

  //           let calls = []
  //           calls.push(a.setAll(1))
  //           calls.push(b.setAll(2))

  //           return Promise.all(calls)
  //             .then(() => c.zip(a, b).set((x, y) => x + y))
  //             .then(() => c.getAll())
  //         })
  //     })
  //     .should.eventually.be.deep.equal([ 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3 ])
  // })

  // it("vector addition and ensure locale variation: a + b = c", function () {
  //   return testRun(() => {
  //       return createDomain(Locales, 16)
  //         .then((d) => {
  //           let calls = []
  //           calls.push(Promise.resolve(d))
  //           calls.push(createDistArray(d))
  //           calls.push(createDistArray(d))
  //           calls.push(createDistArray(d))
  //           return Promise.all(calls)
  //         })
  //         .then((varr) => {
  //           const d = varr[0]
  //           const a = varr[1]
  //           const b = varr[2]
  //           const c = varr[3]

  //           let calls = []
  //           calls.push(a.setAll(1))
  //           calls.push(b.forAll().set((i) => i)) // ensure each locale has different values

  //           // TODO: test forAll puts the right values on the right locales
  //           return Promise.all(calls)
  //             .then(() => c.zip(a, b).set((x, y) => x + y))
  //             .then(() => c.getAll())
  //         })
  //     })
  //     .should.eventually.be.deep.equal([ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16 ])
  // })

  // it("", function () {
  //   return .should.be.fulfilled
  // })
})