'use strict';

describe('serviceTabVisibility'.bold.underline.blue, function () {
  describe('isTabNameValid', function () {
    var isTabVisible;
    var $rootScope;
    var keypather;

    beforeEach(function () {
      angular.mock.module('app');
      angular.mock.inject(function (
        _$rootScope_,
        _keypather_,
        _isTabVisible_
      ) {
        $rootScope = _$rootScope_;
        keypather = _keypather_;
        isTabVisible = _isTabVisible_;
      });
    });

    it('should return false for an undefined tab', function () {
      expect(isTabVisible('thingthatdoesntexist')).to.equal(false);
      expect(isTabVisible('thiasdfng')).to.equal(false);
    });

    it('should return false for a feature flag that is disabled', function () {
      keypather.set($rootScope, 'featureFlags.whitelist', true);
      expect(isTabVisible('whitelist')).to.equal(true);
      keypather.set($rootScope, 'featureFlags.whitelist', false);
      expect(isTabVisible('whitelist')).to.equal(false);
    });
  });
});
