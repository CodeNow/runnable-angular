'use strict';

var $controller;
var $rootScope;
var $scope;
var $window;
var keypather;
var fakeOrgs;
var fetchInstancesByPodMock;
var getCurrentStepStub;
var isAddingFirstRepoStub;
var mockCurrentOrg;
var isRunnabotPartOfOrgStub;
var mockAhaGuideMethods;
var eventStatus;
var subStep;
var subStepIndex;

var apiMocks = require('../apiMocks/index');

describe('ahaGuideController'.bold.underline.blue, function () {
  var AGC;
  var mockSteps = {
    CHOOSE_ORGANIZATION: 1,
    ADD_FIRST_REPO: 2,
    ADD_FIRST_BRANCH: 3,
    SETUP_RUNNABOT: 4,
    COMPLETED: -1
  };

  getCurrentStepStub = sinon.stub();
  isAddingFirstRepoStub = sinon.stub();

  function createMasterPods() {
    var masterPods = runnable.newInstances(
      [apiMocks.instances.building, apiMocks.instances.runningWithContainers[0]],
      {noStore: true}
    );
    return masterPods;
  }

  function setup() {
    mockCurrentOrg = {
      poppa: {
        attrs: {
          hasPaymentMethod: false,
          id: 101,
          metadata: {
            hasAha: true,
            hasConfirmedSetup: false
          }
        }
      }
    };
    mockAhaGuideMethods = {
      endGuide: sinon.stub(),
      getCurrentStep: getCurrentStepStub,
      hasConfirmedSetup: sinon.stub(),
      hasRunnabot: sinon.stub(),
      isInGuide: sinon.stub(),
      furthestSubstep: sinon.stub(),
      isChoosingOrg: sinon.stub(),
      isAddingFirstRepo: isAddingFirstRepoStub,
      isAddingFirstBranch: sinon.stub(),
      steps: mockSteps,
      stepList: {
        2: {
          title: 'Step 2: Add a Repository',
          subSteps: {
            addRepository: {
              step: 0
            },
            containerSelection: {
              step: 1
            },
            logs: {
              step: 7
            }
          },
          buildStatus: {
            starting: 'We‘re building! Build time varies depending on your build commands.',
            crashed: 'Your template isn‘t running yet! Check the logs to debug any issues. If you‘re stumped, ask our engineers!'
          }
        }
      },
    };
    fetchInstancesByPodMock = new (require('../fixtures/mockFetch'))();
    angular.mock.module('app');
    fakeOrgs = {
      models: [
        {
          attrs: angular.copy(apiMocks.user),
          oauthName: function () {
            return 'org1';
          }
        }, 
        {
          attrs: angular.copy(apiMocks.user),
          oauthName: function () {
            return 'org2';
          }
        }
      ]
    };
    angular.mock.module('app', function ($provide) {
      $provide.factory('fetchInstancesByPod', fetchInstancesByPodMock.autoTrigger(createMasterPods()));
      $provide.factory('isRunnabotPartOfOrg', function ($q) {
        isRunnabotPartOfOrgStub = sinon.stub().returns($q.when());
        return isRunnabotPartOfOrgStub;
      });
      $provide.value('currentOrg', mockCurrentOrg);
      $provide.value('ahaGuide', mockAhaGuideMethods);
    });
    angular.mock.inject(function (
      _$controller_,
      _$rootScope_,
      _$window_,
      _keypather_
    ) {
      $controller = _$controller_;
      $rootScope = _$rootScope_;
      $window = _$window_;
      keypather = _keypather_;

      $scope = $rootScope.$new();
      $scope.subStep = subStep;
      $scope.subStepIndex = subStepIndex;
    });

    $rootScope.featureFlags = {
      aha: true
    };

    AGC = $controller('AhaGuideController', {
      '$scope': $scope
    });

    $rootScope.$apply();
  }

  describe('managing steps and substeps for milestone 2', function() {
    beforeEach(function() {
      getCurrentStepStub.returns(2);
      isAddingFirstRepoStub.returns(true);
      subStep = 'addRepository';
      subStepIndex = 0;
      setup();
      $scope.$on('ahaGuideEvent', function(event, status) {
        eventStatus = status;
      });
      $scope.$digest();
    })

    it('should update the subStep and index based on a panel change', function() {
      $scope.$emit('changed-animated-panel', 'addRepository');
      $scope.$digest();
      expect(AGC.subStep).to.equal('addRepository');
      expect(AGC.subStepIndex).to.equal(0);
      sinon.assert.calledWith(mockAhaGuideMethods.furthestSubstep, 2, 'addRepository');
      $scope.$digest();
      $scope.$emit('changed-animated-panel', 'containerSelection');
      $scope.$digest();
      expect(AGC.subStep).to.equal('containerSelection');
      expect(AGC.subStepIndex).to.equal(1);
      sinon.assert.calledWith(mockAhaGuideMethods.furthestSubstep, 2, 'containerSelection');
    });

    it('should update the caption and build status based on an update', function() {
      AGC.subStepIndex = 0;
      $rootScope.$broadcast('alert', {text:'Container Created', type: 'success'});
      $scope.$digest();
      $rootScope.$broadcast('buildStatusUpdated', {status:'starting'});
      $scope.$digest();
      expect(AGC.caption).to.equal('We‘re building! Build time varies depending on your build commands.');
      expect(AGC.buildStatus).to.equal('starting');
      expect(eventStatus).to.deep.equal({isClear:true});
      $rootScope.$broadcast('buildStatusUpdated', {status:'crashed'});
      $scope.$digest();
      expect(AGC.buildStatus).to.equal('crashed');
      expect(AGC.caption).to.equal('Your template isn‘t running yet! Check the logs to debug any issues. If you‘re stumped, ask our engineers!');
      expect(AGC.showError).to.equal(true);
      expect(eventStatus).to.deep.equal({error:'buildFailed'});
    });

    it('should update the caption on alert', function() {
      AGC.subStepIndex = 0;
      $rootScope.$broadcast('alert', {text:'Container Created',type:'success'});
      expect(AGC.subStep).to.equal('logs');
      expect(AGC.subStepIndex).to.equal(7);
      sinon.assert.calledWith(mockAhaGuideMethods.furthestSubstep, 2, 'logs');
    });
  });

  describe('only update the guide when necessary', function () {
    beforeEach(function() {
      getCurrentStepStub.returns(2);
      isAddingFirstRepoStub.returns(true);
      subStep = 'containerSelection';
      subStepIndex = 1;
      setup();
      $scope.$digest();
    })

    it('should not update the subStep on build update when on container select step', function() {
      $scope.$emit('changed-animated-panel', 'containerSelection');
      $rootScope.$broadcast('buildStatusUpdated', {status:'started'});
      expect(AGC.subStep).to.equal('containerSelection');
      expect(AGC.subStepIndex).to.equal(1);
      sinon.assert.calledWith(mockAhaGuideMethods.furthestSubstep, 2, 'containerSelection');
    });
  });
});
