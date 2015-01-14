'use strict';

describe('serviceHandleErr', function () {
  var errs;
  beforeEach(function() {
    angular.mock.module('app');
    angular.mock.inject(function(_errs_) {
      errs = _errs_;
    });
  });

  it('pushes an error when given one', function() {
    var err = 'Big, fat error';
    errs.handler(err);
    expect(errs.errors).to.deep.equal([err]);
  });

  it('does not push an error that we should skip', function() {
    var err = {
      data: {
        statusCode: 401
      }
    };
    errs.handler(err);
    expect(errs.errors).to.deep.equal([]);
  });

  it('does nothing with no err', function() {
    errs.handler();
    expect(errs.errors).to.deep.equal([]);
  });
});
