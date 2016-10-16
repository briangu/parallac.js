var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
chai.should();
chai.use(chaiAsPromised);

var run = require('../parallac').run

describe("test locale context operations", function () {
  it("", function () {
    return run(() => {
        writeln()
        writeln("test: hello from each locale")
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
            writeln(a)
            a += 1
            writeln(a)
          })
          .catch((err) => writeln(err))
      })
      .should.be.fulfilled
  })

  it("", function () {
    return run(() => {
        writeln()
        writeln("test: return result")

        on(here)
          .with({
            b: 8
          })
          .do(() => b * 2)
          .then((result) => writeln("8 * 2 = ", result))
      })
      .should.be.fulfilled
  })

  // it("", function () {
  //   return .should.be.fulfilled
  // })
})
