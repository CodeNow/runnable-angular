/*global directiveTemplate:true */
'use strict';
var $scope;

describe('planStatusFormDirective'.bold.underline.blue, function () {
  var loadingStub;
  var mockBillingPlans;
  beforeEach(function () {
    mockBillingPlans = {
      'simplePlan': {
        id: 'billingSimplePlan',
        maxConfigurations: 12,
        costPerUser: 20
      }
    };
    angular.mock.module('app', function ($provide) {
      loadingStub = sinon.stub();
      $provide.value('loading', loadingStub);
      $provide.value('billingPlans', mockBillingPlans);
      $provide.factory('fetchPlan', function ($q) {
        return sinon.stub().returns($q.when({next: {plan: {}}}));
      });
      $provide.factory('fetchInstancesByPod', function ($q) {
        return sinon.stub().returns($q.when({models: [{}]}));
      });
    });
    angular.mock.inject(function (
      $compile,
      $rootScope
    ) {
      $scope = $rootScope.$new();
      $scope.save = sinon.stub();
      var tpl = directiveTemplate.attribute('plan-status-form');
      $compile(tpl)($scope);
      $scope.PSFC = {
        configurations: 1
      };
      $scope.$digest();
    });
  });

  describe('getMeterClass', function () {
    it('get the class for the meter', function () {
      $scope.preview = 'simplePlan';
      expect($scope.getMeterClass()).to.deep.equal({
        'used-1': true,
        'preview-used-12': true
      });
    });
  });
});
