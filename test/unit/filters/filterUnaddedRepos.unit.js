'use strict';

describe('filterUnaddedRepos'.bold.underline.blue, function () {
  var filterUnaddedRepos;
  beforeEach(function() {
    angular.mock.module('app');
    // Needs to have 'Filter' on the end to be properly injected
    angular.mock.inject(function(_unaddedReposFilter_) {
      filterUnaddedRepos = _unaddedReposFilter_;
    });
  });

  it('returns repos unaltered when no acvs are provided', function() {
    expect(filterUnaddedRepos(['Runnable', 'llamas'])).to.deep.equal(['Runnable', 'llamas']);
  });

  it('returns an empty array when there are no repos', function() {
    // Need to pass in some sort of acv so it bypasess the first if
    expect(filterUnaddedRepos(undefined, 'acv')).to.deep.equal([]);
  });

  it('Only returns repos that are not in the acvs we pass in', function() {
    var repos = [{
      attrs: {
        full_name: 'Runnable'
      }
    }, {
      attrs: {
        full_name: 'llamas'
      }
    }];
    var acvs = {
      findIndex: function (fn) {
        var result = fn({
          attrs: {
            repo: 'llamas'
          }
        });
        if (result) {
          return 1;
        } else {
          return -1;
        }
      }
    }
    expect(filterUnaddedRepos(repos, acvs)).to.deep.equal([{
      attrs: {
        full_name: 'Runnable'
      }
    }]);
  });
});
