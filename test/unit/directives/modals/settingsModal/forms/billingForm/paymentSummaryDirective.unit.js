/*global directiveTemplate:true */
'use strict';
var $scope;
var $elScope;
var keypather;

describe('paymentSummaryDirective'.bold.underline.blue, function () {
  var fetchPlanStub;
  var loadingStub;
  var mockPlan;
  var mockPaymentMethod;
  var fetchPaymentMethodStub;
  var mockCurrentOrg;
  beforeEach(function () {
    mockCurrentOrg = {
      poppa: {
        attrs: {
          trialEnd: '2016-08-12T21:24:06.000Z'
        }
      }
    };
    mockPlan = {
      next: {
        id: 'mockPlanId',
        price: 20,
        userCount: 3
      }
    };
    mockPaymentMethod = {
      id: 'mockPaymentMethod'
    };
    angular.mock.module('app', function ($provide) {
      $provide.factory('fetchPlan', function ($q) {
        fetchPlanStub = sinon.stub().returns($q.when(mockPlan));
        return fetchPlanStub;
      });
      $provide.factory('fetchPaymentMethod', function ($q) {
        fetchPaymentMethodStub = sinon.stub().returns($q.when(mockPaymentMethod));
        return fetchPaymentMethodStub;
      });
      loadingStub = sinon.stub();
      $provide.value('loading', loadingStub);
      $provide.value('currentOrg', mockCurrentOrg);
    });
    angular.mock.inject(function (
      $compile,
      $rootScope,
      _keypather_
    ) {
      keypather = _keypather_;
      $scope = $rootScope.$new();
      keypather.set($rootScope, 'dataApp.data.activeAccount', {});
      $scope.save = sinon.stub();
      var tpl = directiveTemplate.attribute('payment-summary');
      var element = $compile(tpl)($scope);
      $scope.$digest();
      $elScope = element.isolateScope();
    });
  });

  it('should load plan and payment method and set loading state along the way', function () {
    sinon.assert.calledTwice(loadingStub);
    sinon.assert.calledWith(loadingStub, 'billingForm', true);
    sinon.assert.calledWith(loadingStub, 'billingForm', false);
    sinon.assert.calledOnce(fetchPlanStub);
    sinon.assert.calledOnce(fetchPaymentMethodStub);
    expect($elScope.plan).to.equal(mockPlan.next);
    expect($elScope.paymentMethod).to.equal(mockPaymentMethod);
  });

  describe('calculatePlanPrice', function () {
    it('should calculate the plan price', function () {
      expect($elScope.calculatePlanPrice()).to.equal(60);
    });
  });

  describe('getTrialEndDate', function () {
    it('should return the trial end date', function () {
      expect($elScope.getTrialEndDate()).to.equal('Aug 12th, 2016');
    });
  });
});
