/*global directiveTemplate:true */
'use strict';
var $scope;
var $q;

describe('planSummaryDirective'.bold.underline.blue, function () {
  var fetchPlanStub;
  var loadingStub;
  var mockPlan;
  var mockBillingPlans;
  beforeEach(function () {
    mockPlan = {
      next: {
        id: 'mockPlanId'
      }
    };
    mockBillingPlans = {
      'mockPlanId': {
        id: 'mockBillingPlanId'
      }
    };
    angular.mock.module('app', function ($provide) {
      $provide.factory('fetchPlan', function ($q) {
        fetchPlanStub = sinon.stub().returns($q.when(mockPlan));
        return fetchPlanStub;
      });
      loadingStub = sinon.stub();
      $provide.value('loading', loadingStub);
      $provide.value('billingPlans', mockBillingPlans);
    });
    angular.mock.inject(function (
      $compile,
      $rootScope,
      _$q_
    ) {
      $q = _$q_;
      $scope = $rootScope.$new();
      $scope.save = sinon.stub();
      var tpl = directiveTemplate.attribute('plan-summary');
      $compile(tpl)($scope);
      $scope.$digest();
    });
  });

  it('should load plan and set loading state along the way', function () {
    sinon.assert.calledTwice(loadingStub);
    sinon.assert.calledWith(loadingStub, 'billingForm', true);
    sinon.assert.calledWith(loadingStub, 'billingForm', false);
    sinon.assert.calledOnce(fetchPlanStub);
    expect($scope.plan).to.equal(mockBillingPlans.mockPlanId);
  });
});
