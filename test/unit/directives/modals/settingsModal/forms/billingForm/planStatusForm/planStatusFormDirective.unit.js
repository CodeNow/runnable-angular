/*global directiveTemplate:true */
'use strict';
var $scope;

describe('planStatusFormDirective'.bold.underline.blue, function () {
  var loadingStub;
  var mockBillingPlans;
  var fetchPaymentMethodStub;
  var mockCurrentOrg;
  beforeEach(function () {
    mockCurrentOrg = {
      poppa: {
        isInTrial: sinon.stub().returns(true)
      }
    };
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
      $provide.value('currentOrg', mockCurrentOrg);
      $provide.factory('fetchPlan', function ($q) {
        return sinon.stub().returns($q.when({next: {plan: {}}}));
      });
      $provide.factory('fetchPaymentMethod', function ($q) {
        fetchPaymentMethodStub = sinon.stub().returns($q.when({}));
        return fetchPaymentMethodStub;
      });
    });

    describe('below 15', function () {
      it('get the class for the meter', function () {
        $scope.preview = 'simplePlan';
        expect($scope.getMeterClass()).to.deep.equal({
          'used-1': true,
          'preview-used-9999': true
        });
      });
    });

    describe('above 15', function () {
      it('should max out the used to 15', function () {
        $scope.preview = 'simplePlan';
        $scope.PSFC.configurations = 100;
        expect($scope.getMeterClass()).to.deep.equal({
          'used-15': true,
          'preview-used-9999': true
        });
      });
    });
  });
});
