'use strict';

describe('filterErrJSON', function () {
  var filterErrJSON;
  beforeEach(function() {
    angular.mock.module('app');
    // Needs to have 'Filter' on the end to be properly injected
    angular.mock.inject(function(_errJSONFilter_) {
      filterErrJSON = _errJSONFilter_;
    });
  });

  it('returns an empty string for falsy values', function() {
    expect(filterErrJSON()).to.equal('');
    expect(filterErrJSON('')).to.equal('');
    expect(filterErrJSON(0)).to.equal('');
  });

  it('Stringifies non-Error values', function() {
    expect(filterErrJSON({})).to.equal('{}');
    expect(filterErrJSON([])).to.equal('[]');
  });

  it('Properly stringifies errors', function() {
    expect(filterErrJSON(new Error('this is a test'))).to.include('"message":"this is a test"');
  });
});
