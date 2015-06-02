'use strict';

describe('filterLimitToEllipsis', function () {
  var limitToEllipsisFilter;

  beforeEach(function() {
    angular.mock.module('app');
    angular.mock.inject(function(_limitToEllipsisFilter_) {
      limitToEllipsisFilter = _limitToEllipsisFilter_;
    });
  });

  it('should return a string limited with elipsis', function () {
    var filtered = limitToEllipsisFilter('0123456789', 5);
    expect(filtered.length).to.equal(6);
    expect(filtered).to.equal('01234…');
  });

  it('should return the original if it\'s longer than the filter length', function () {
    var originalString = '0123456789';
    var filtered = limitToEllipsisFilter(originalString, originalString.length);
    expect(filtered.length).to.equal(originalString.length);
    expect(filtered).to.equal(originalString);
  });

  it('should return nothing if the filtered item is falsy', function () {
    var originalString = 0;
    var filtered = limitToEllipsisFilter(originalString, originalString.length);
    expect(filtered).to.not.exist;
  });
});
