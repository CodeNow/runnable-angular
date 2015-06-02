'use strict';

describe('filterTimeAgo', function () {
  var timeAgoFilter;
  var moment;

  beforeEach(function() {
    angular.mock.module('app');
    angular.mock.inject(function(_timeAgoFilter_, _moment_) {
      timeAgoFilter = _timeAgoFilter_;
      moment = _moment_;
    });
  });

  it('should return a string from timeago', function () {
    var date = moment().subtract(3, 'weeks');
    var timeAgo = timeAgoFilter(date);
    expect(timeAgo).to.equal(date.fromNow());
  });

  it('should not allow dates in the future', function () {
    var date = moment().add(3, 'weeks');
    var timeAgo = timeAgoFilter(date);
    expect(timeAgo).to.equal(moment().fromNow());
  });

  it('should handle no date at all', function () {
    var timeAgo = timeAgoFilter();
    expect(timeAgo).to.not.exist;
  });

});
