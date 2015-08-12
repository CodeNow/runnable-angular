'use strict';

describe('fixRepositoryNameFilter', function () {
  var filter;

  var repos = [
    {
      name: 'FoO'
    },
    {
      name: 'baz/nfasdf'
    }
  ];

  beforeEach(function() {
    angular.mock.module('app');
    angular.mock.inject(function (_fixRepositoryNameFilter_) {
      filter = _fixRepositoryNameFilter_;
    });
  });

  it('should be fine with repo names without a /', function () {
    var filtered = filter(repos[0].name);
    expect(filtered).to.equal(repos[0].name);
  });

  it('should filter out everything before the /', function () {
    var filtered = filter(repos[1].name);
    expect(filtered).to.equal('nfasdf');
  });
});
