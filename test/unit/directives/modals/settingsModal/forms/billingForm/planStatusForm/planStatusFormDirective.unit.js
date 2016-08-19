/*global directiveTemplate:true */
'use strict';
var $scope;

describe('planStatusFormDirective'.bold.underline.blue, function () {
  var loadingStub;
  var mockBillingPlans;
  var fetchPaymentMethodStub;
  beforeEach(function () {
    mockBillingPlans = {
      'simplePlan': {
        id: 'billingSimplePlan',
        maxConfigurations: 12,
        costPerUser: 20
      }
    };
    window.helpers.killDirective('paymentSummary');
    angular.mock.module('app', function ($provide) {
      loadingStub = sinon.stub();
      $provide.value('loading', loadingStub);
      $provide.value('billingPlans', mockBillingPlans);
      $provide.factory('fetchPlan', function ($q) {
        return sinon.stub().returns($q.when({next: {plan: {}}}));
      });
      $provide.factory('fetchPaymentMethod', function ($q) {
        fetchPaymentMethodStub = sinon.stub().returns($q.when({}));
        return fetchPaymentMethodStub;
      });
      $provide.factory('fetchInstancesByPod', function ($q) {
        return sinon.stub().returns($q.when({models: [{}]}));
      });
    });
    angular.mock.inject(function (
      $compile,
      $rootScope,
      keypather
    ) {
      $scope = $rootScope.$new();
      keypather.set($rootScope, 'dataApp.data.activeAccount', {
        isInTrial: sinon.stub().returns(true),
        trialEnd: 1234
      });
      $scope.save = sinon.stub();
      var tpl = directiveTemplate.attribute('plan-status-form');
      $compile(tpl)($scope);
      $scope.PSFC = {
        configurations: 1,
        activeAccount: {
          isInTrial: sinon.stub().returns(true)
        }
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
