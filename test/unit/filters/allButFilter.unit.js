'use strict';

describe('allButFilter', function () {
  var allButFilter;
  var keypather;
  beforeEach(function() {
    angular.mock.module('app');
    // Needs to have 'Filter' on the end to be properly injected
    angular.mock.inject(function(_allButFilter_, _keypather_) {
      allButFilter = _allButFilter_;
      keypather = _keypather_;
    });
  });

  it('it should filter out repos it is given', function () {
    var originalRepos = [{
      attrs: {
        name: 'a'
      }
    }, {
      attrs: {
        name: 'b'
      }
    }];
    // Container file structure, no attrs
    var toBeFiltered = [{
      name: 'a'
    }];
    var results = allButFilter(originalRepos, toBeFiltered);
    expect(results).to.deep.equal([{
      attrs: {
        name: 'b'
      }
    }]);
  });
});
