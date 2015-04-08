'use strict';

describe('getStackIconFilter', function () {
  var filterGetStackIcon;
  var $sce;

  beforeEach(function() {
    angular.mock.module('app');
    angular.mock.module(function($provide) {
      $sce = {
        trustAsResourceUrl: sinon.spy()
      };
      $provide.value('$sce', $sce);
    });
    // Needs to have 'Filter' on the end to be properly injected, but since the thing already has it we have to double
    // ng-wat FilterFilter.
    angular.mock.inject(function(_getStackIconFilterFilter_) {
      filterGetStackIcon = _getStackIconFilterFilter_;
    });
  });

  it('trusts the resource url', function() {
    filterGetStackIcon('key');
    sinon.assert.calledWith($sce.trustAsResourceUrl, '#icons-key');
  });
  it('does nothing with no key', function() {
    filterGetStackIcon();
    sinon.assert.notCalled($sce.trustAsResourceUrl);
  });
});
