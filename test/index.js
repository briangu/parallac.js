var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
chai.should();
chai.use(chaiAsPromised);

var run = require('../parallac').run

describe("parallac tests", function () {
  describe("test locale ids", function () {
    it("here.id on locale 0", function () {
      return run(() => {
        var assert = require('assert')
        assert.equal(0, here.id, "locale id should be 0")
        return here.id
      })
      .should.eventually.be.equal(0)
    })
    it("here.id on each locale", function () {
      return run(() => {
        var calls = []
        for (let i = 0; i < Locales.length; i++) {
          let locale = Locales[i]
          calls.push(on(locale)
            .with({
              i: i
            })
            .do(() => {
              var assert = require('assert')
              assert.equal(i, here.id, "locale id should be " + i)
            }))
        }
        return Promise.all(calls)
          .catch((err) => {
            throw "test failed: " + "here.id on each locale"
          })
      })
      .should.be.fulfilled
    })
  })
})
