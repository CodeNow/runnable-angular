/*global directiveTemplate:true */
'use strict';
var $scope;
var $q;

describe('planStatusFormDirective'.bold.underline.blue, function () {
  var fetchPlanStub;
  var fetchInstancesByPodStub;
  var loadingStub;
  var mockPlan;
  var mockBillingPlans;
  beforeEach(function () {
    mockBillingPlans = {
      'simplePlan': {
        id: 'billingSimplePlan',
        maxConfigurations: 12,
        costPerUser: 20
      }
    };
    mockPlan = {
      next: {
        plan: {
          id: 'simplePlan'
        }
      }
    };
    angular.mock.module('app', function ($provide) {
      $provide.factory('fetchPlan', function ($q) {
        fetchPlanStub = sinon.stub().returns($q.when(mockPlan));
        return fetchPlanStub;
      });
      $provide.factory('fetchInstancesByPod', function ($q) {
        fetchInstancesByPodStub = sinon.stub().returns($q.when({models: [{}]}));
        return fetchInstancesByPodStub;
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
      var tpl = directiveTemplate.attribute('plan-status-form');
      $compile(tpl)($scope);
      $scope.$digest();
    });
  });

  it('should load invoices and set loading state along the way', function () {
    sinon.assert.callCount(loadingStub, 4);
    sinon.assert.alwaysCalledWith(loadingStub, 'billingForm');
    sinon.assert.calledWith(loadingStub, 'billingForm', true);
    sinon.assert.calledWith(loadingStub, 'billingForm', false);

    sinon.assert.calledOnce(fetchPlanStub);
    sinon.assert.calledOnce(fetchInstancesByPodStub);
    expect($scope.state.plan).to.equal(mockPlan.next.plan);
    expect($scope.state.configurations).to.equal(1);
    expect($scope.plans).to.equal(mockBillingPlans);
  });

  describe('getMeterClass', function () {
    it('get the class for the meter', function () {
      $scope.state.preview = 'simplePlan';
      expect($scope.getMeterClass()).to.deep.equal({
        'used-1': true,
        'preview-used-12': true
      });
    });
  });

  describe('calculatePlanAmount', function () {
    it('calculate the plan amount properly', function () {
      $scope.state.discounted = false;
      expect($scope.calculatePlanAmount('simplePlan')).to.equal(20);
    });
    it('calculate the plan amount properly when discounted', function () {
      $scope.state.discounted = true;
      expect($scope.calculatePlanAmount('simplePlan')).to.equal('10.00');
    });
  });
});
