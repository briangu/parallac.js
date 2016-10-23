var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
chai.should();
chai.use(chaiAsPromised);
var run = require('../lib/parallac').run

const testLocaleConfig = {
  locales: [{
    URI: "http://localhost:3000"
  }],
  here: {
    URI: "http://localhost:3000"
  }
}
var testRun = (fn) => run(fn, testLocaleConfig)

describe("test locale context operations", function () {
  it("return scalar result", function () {
    return testRun(() => on(here)
        .do(() => 16))
      .should.eventually.equal(16)
  })
  it("return Promise resolve result", function () {
    return testRun(() => on(here)
        .do(() => Promise.resolve(16)))
      .should.eventually.equal(16)
  })
  it("return Promise reject result", function () {
    return testRun(() => on(here)
        .do(() => Promise.reject(16)))
      .should.be.rejectedWith(16)
  })
  it("read context var and return result", function () {
    return testRun(() => on(here)
        .with({
          b: 8
        })
        .do(() => b * 2))
      .should.eventually.equal(16)
  })
  it("update context var with new value", function () {
    return testRun(() =>
      on(here)
      .with({
        a: 1
      })
      .do(() => {
        a += 10
        return a
      })
      .should.eventually.equal(11)
    )
  })
})