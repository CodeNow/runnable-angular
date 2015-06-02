'use strict';

describe('filterRepos', function () {
  var filterRepos;

  var repos = [
    {
      attrs: {
        name: 'FoO'
      }
    },
    {
      attrs: {
        name: 'baz'
      }
    },
    {
      attrs: {
        name: 'fo2o'
      }
    },
    {
      attrs: {
        name: 'bar'
      }
    }
  ];

  beforeEach(function() {
    angular.mock.module('app');
    angular.mock.inject(function(_reposFilter_) {
      filterRepos = _reposFilter_;
    });
  });

  it('should only show repos that have the string in their list', function () {
    var filtered = filterRepos(repos, 'fo');
    expect(filtered.length).to.equal(2);
    expect(filtered[0].attrs.name).to.equal('FoO');
  });

  it('should original list if nothing passed in to filter by', function () {
    expect(filterRepos(repos)).to.deep.equal(repos);
  });
});
