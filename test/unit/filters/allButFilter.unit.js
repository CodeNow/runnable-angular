'use strict';

describe('allButFilter', function () {
  var allButFilter;
  beforeEach(function() {
    angular.mock.module('app');
    // Needs to have 'Filter' on the end to be properly injected
    angular.mock.inject(function(_allButFilter_) {
      allButFilter = _allButFilter_;
    });
  });

  it('it should filter out repos it is given', function () {
    var originalRepos = [{
      attrs: {
        full_name: 'a'
      }
    }, {
      attrs: {
        full_name: 'b'
      }
    }];
    var appCodeVersions = [{
      attrs: {
        repo: 'a'
      }
    }];
    var results = allButFilter(originalRepos, appCodeVersions);
    expect(results).to.deep.equal([{
      attrs: {
        full_name: 'b'
      }
    }]);
  });

  it('should handle a length of 0 on input data', function () {
    var results = allButFilter([]);
    expect(results.length).to.equal(0);
    expect(results).to.be.instanceof(Array);
  });

  it('should handle no input data', function () {
    var results = allButFilter();
    expect(results.length).to.equal(0);
    expect(results).to.be.instanceof(Array);
  });

  it('should handle no repo filter', function () {
    var results = allButFilter([{}]);
    expect(results.length).to.equal(0);
    expect(results).to.be.instanceof(Array);
  });
});
