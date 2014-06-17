var chai = require('chai');

describe('first test', function () {
  it('should not blow up', function () {
    chai.expect(true).to.equal(true);
    chai.expect(true).to.equal(true);
    chai.expect(true).to.equal(true);
  });

  it('second thing', function () {
    chai.expect(true).to.equal(true);
  });
});