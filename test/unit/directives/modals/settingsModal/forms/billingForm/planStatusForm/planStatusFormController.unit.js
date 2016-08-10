/*global expect:true */
'use strict';

var $controller;
var $scope;

describe('PlanStatusFormController'.bold.underline.blue, function () {
  var PSFC;
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
      loadingStub.reset = sinon.stub();
      $provide.value('loading', loadingStub);
      $provide.value('billingPlans', mockBillingPlans);
    });
    angular.mock.inject(function (
      _$controller_,
      $rootScope
    ) {
      $controller = _$controller_;
      $scope = $rootScope.$new();
    });

    var laterController = $controller('PlanStatusFormController', {
      $scope: $scope
    }, true);
    PSFC = laterController();
    $scope.$digest();
  });

  describe('init', function () {
    it('should fetch data and trigger loading status', function () {
      sinon.assert.calledTwice(loadingStub);
      sinon.assert.calledWith(loadingStub, 'billingForm', true);
      sinon.assert.calledWith(loadingStub, 'billingForm', false);

      sinon.assert.calledOnce(fetchPlanStub);
      sinon.assert.calledOnce(fetchInstancesByPodStub);
      expect(PSFC.plan).to.equal(mockPlan.next.plan);
      expect(PSFC.configurations).to.equal(1);
      expect(PSFC.plans).to.equal(mockBillingPlans);
    });
  });

  describe('calculatePlanAmount', function () {
    it('calculate the plan amount properly', function () {
      PSFC.discounted = false;
      expect(PSFC.calculatePlanAmount('simplePlan')).to.equal(20);
    });
    it('calculate the plan amount properly when discounted', function () {
      PSFC.discounted = true;
      expect(PSFC.calculatePlanAmount('simplePlan')).to.equal('10.00');
    });
  });
});
