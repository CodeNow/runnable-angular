'use strict';

describe('filterIgnoredDiffs', function () {
  var ignoredDiffsFilter;
  var keypather;

  beforeEach(function() {
    angular.mock.module('app');
    angular.mock.inject(function(_ignoredDiffsFilter_, _keypather_) {
      ignoredDiffsFilter = _ignoredDiffsFilter_;
      keypather = _keypather_;
    });
  });

  it('should only return file diffs that are not excluded', function () {
    var fileDiffs = [
      {
        from: '/baz'
      },
      {
        from: '/foo'
      },
      {
        from: '/bar'
      }
    ];
    var acv = {};
    keypather.set(acv, 'attrs.transformRules.exclude', ['/bar', '/baz']);
    var filtered = ignoredDiffsFilter(fileDiffs, acv);
    expect(filtered.length).to.equal(1);
    expect(filtered[0].from).to.equal('/foo');
  });

  it('should handle no acv', function () {
    var filtered = ignoredDiffsFilter([]);
    expect(filtered).to.exist;
    expect(filtered).to.be.instanceof(Array);
  });

  it('should handle no file diffs', function () {
    var filtered = ignoredDiffsFilter(undefined, {});
    expect(filtered).to.not.exist;
  });

});
