'use strict';

describe('memoizeAll'.bold.underline.blue, function () {
  var memoizeAll;
  var func = function () {
    var args = [].slice.call(arguments);
    var sum = args.reduce(function (a, b) {
      return a + b;
    }, 0);
    return sum;
  };
  beforeEach(function () {
    angular.mock.module('app');
    angular.mock.inject(function (_memoizeAll_) {
      memoizeAll = _memoizeAll_;
    });
  });

  it('should memoize the first argument', function () {
    var _func = memoizeAll(func);
    var res = func(1);
    expect(_func(1)).to.equal(func(1));
    expect(_func(8)).to.not.equal(func(1));
  });

  it('should memoize the second argument', function () {
    var _func = memoizeAll(func);
    var res = func(1, 3);
    expect(_func(1, 3)).to.equal(func(1, 3));
    expect(_func(1, 2)).to.not.equal(func(1, 3));
  });

  it('should memoize the third argument', function () {
    var _func = memoizeAll(func);
    var res = func(1, 3, 9);
    expect(_func(1, 3, 9)).to.equal(func(1, 3, 9));
    expect(_func(1, 3, 5)).to.not.equal(func(1, 3, 9));
  });
});
