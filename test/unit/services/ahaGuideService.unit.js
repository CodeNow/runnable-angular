'use strict';

var mockOrg;
var keypather;
var $rootScope;
var isRunnabotPartOfOrgStub;
var patchOrgMetadataStub;
var apiMocks = require('../apiMocks/index');
var masterPods;
var featureFlags;
var mockInstance;
var eventTrackingStub;
var fetchInstancesByPodMock = new (require('../fixtures/mockFetch'))();
var instances;

describe('ahaGuide'.bold.underline.blue, function () {
  var ahaGuide;
  instances = {
    models: [{
      getRepoName: sinon.stub().returns(true),
      attrs: {
        hasAddedBranches: false
      }
    }]
  };
  function initState () {
    featureFlags = {
      aha: true
    };
    angular.mock.module('app');
    angular.mock.module(function($provide) {
      $provide.value('currentOrg', mockOrg);
      $provide.factory('fetchInstancesByPod', fetchInstancesByPodMock.fetch());
      $provide.factory('featureFlags', function () {
        return {
          flags: featureFlags
        };
      });
      $provide.factory('isRunnabotPartOfOrg', function ($q) {
        isRunnabotPartOfOrgStub = sinon.stub().returns($q.when(false));
        return isRunnabotPartOfOrgStub;
      });
      $provide.factory('eventTracking', function ($q) {
        eventTrackingStub = {
          invitedRunnabot: sinon.stub(),
          updateCurrentPersonProfile: sinon.stub(),
          milestone2SelectTemplate: sinon.stub(),
          milestone2VerifyRepositoryTab: sinon.stub(),
          milestone2VerifyCommandsTab: sinon.stub(),
          milestone2Building: sinon.stub(),
          milestone2BuildSuccess: sinon.stub(),
          milestone3AddedBranch: sinon.stub()
        };
        return eventTrackingStub;
      });
      $provide.factory('patchOrgMetadata', function ($q) {
        patchOrgMetadataStub = sinon.stub().returns($q.when());
        return patchOrgMetadataStub;
      });
    });
    angular.mock.inject(function (
      _ahaGuide_,
      _keypather_,
      _$rootScope_
      ) {
      ahaGuide = _ahaGuide_;
      keypather = _keypather_;
      $rootScope = _$rootScope_;
    });
    $rootScope.featureFlags = featureFlags;
  }
  beforeEach(function() {
    mockOrg = {
      poppa:{
        id: sinon.stub().returns(101),
        attrs: {
          metadata: {
            hasAha: true,
            hasConfirmedSetup: false
          }
        }
      }
    };
    mockInstance = {
      models: [{
        attrs: {
          name: 'instance',
          hasAddedBranches: true
        },
        getRepoName: sinon.stub().returns(true)
      }, {
        attrs: {
          name: 'instance2'
        },
        getRepoName: sinon.stub().returns(true)
      }, {
        attrs: {
          name: 'instance2-copy'
        },
        getRepoName: sinon.stub().returns(true)
      }, {
        attrs: {
          name: 'instance2-copy2'
        },
        getRepoName: sinon.stub().returns(true)
      }]
    };
    initState();
  });
  describe('Init', function () {
    it('should update the user on init', function () {
      sinon.assert.calledOnce(eventTrackingStub.updateCurrentPersonProfile);
      sinon.assert.calledWithExactly(eventTrackingStub.updateCurrentPersonProfile, 2);
    });
  });
  describe('returning the org\'s aha progress', function () {
    afterEach(function() {
      mockOrg.poppa.attrs.metadata.hasAha = true;
      mockOrg.poppa.attrs.metadata.hasConfirmedSetup = false;
    });
    it('(demoMultiTier) should return true when the user has confirmed setup', function () {
      fetchInstancesByPodMock.triggerPromise(mockInstance);
      $rootScope.$digest(); // Clear cache
      var userConfirmedSetup = ahaGuide.hasConfirmedSetup();
      expect(userConfirmedSetup).to.equal(true);
    });
  });
  describe('getting the current milestone, pre runnabot', function () {
    it('should return the choose org step when no poppa id', function () {
      $rootScope.$digest(); // Clear cache
      delete mockOrg.poppa.id;
      var currentStep = ahaGuide.getCurrentStep();
      var chooseOrgStep = ahaGuide.isChoosingOrg();
      expect(currentStep).to.equal(1);
      expect(chooseOrgStep).to.equal(true);
    });
    it('should return the add first repo step if setup is not confirmed', function () {
      mockOrg.poppa.id = sinon.stub().returns(101);
      var currentStep = ahaGuide.getCurrentStep();
      var addRepoStep = ahaGuide.isAddingFirstRepo();
      expect(currentStep).to.equal(2);
      expect(addRepoStep).to.equal(true);
    });
    it('should return the add first branch step if setup is confirmed', function () {
      fetchInstancesByPodMock.triggerPromise(instances);
      $rootScope.$digest(); // Clear cache
      mockOrg.poppa.attrs.metadata.hasConfirmedSetup = true;
      var currentStep = ahaGuide.getCurrentStep();
      var addFirstBranch = ahaGuide.isAddingFirstBranch();
      expect(currentStep).to.equal(3);
      expect(addFirstBranch).to.equal(true);
    });
    it('(demoMultiTier) should return the add first branch step if setup is confirmed', function () {
      mockInstance.models[0].attrs.hasAddedBranches = false;
      fetchInstancesByPodMock.triggerPromise(mockInstance);
      $rootScope.$digest(); // Clear cache
      var currentStep = ahaGuide.getCurrentStep();
      var addFirstBranch = ahaGuide.isAddingFirstBranch();
      expect(currentStep).to.equal(3);
      expect(addFirstBranch).to.equal(true);
    });
  });
  describe('getting the current setupRunnabot milestone', function () {
    beforeEach(function() {
      mockOrg.poppa.attrs.metadata.hasConfirmedSetup = true;
      fetchInstancesByPodMock.triggerPromise(mockInstance);
      $rootScope.$digest();
    });
    it('should reflect the runnabot step', function() {
      var currentStep = ahaGuide.getCurrentStep();
      var addRunnabot = ahaGuide.isSettingUpRunnabot();
      expect(currentStep).to.equal(4);
      expect(addRunnabot).to.equal(true);
    });
  });
  describe('furthestSubstep'.bold, function () {
    describe('getter', function () {
      it('should get the default if nothing is set', function () {
        var result = ahaGuide.furthestSubstep(ahaGuide.steps.ADD_FIRST_BRANCH);
        expect(result).to.equal(ahaGuide.stepList[ahaGuide.steps.ADD_FIRST_BRANCH].defaultSubstep);
      });
      it('should get the value given right before', function () {
        var setResult = ahaGuide.furthestSubstep(ahaGuide.steps.ADD_FIRST_BRANCH, 'dockLoaded');
        var result = ahaGuide.furthestSubstep(ahaGuide.steps.ADD_FIRST_BRANCH);
        expect(result).to.not.equal(ahaGuide.stepList[ahaGuide.steps.ADD_FIRST_BRANCH].defaultSubstep);
        expect(result).to.equal(setResult);
        expect(result).to.equal('dockLoaded');
      });
    });
    describe('setter', function () {
      it('should set the value', function () {
        ahaGuide.furthestSubstep(ahaGuide.steps.ADD_FIRST_BRANCH, 'dockLoaded');
        var result = ahaGuide.furthestSubstep(ahaGuide.steps.ADD_FIRST_BRANCH);
        expect(result).to.not.equal(ahaGuide.stepList[ahaGuide.steps.ADD_FIRST_BRANCH].defaultSubstep);
        expect(result).to.equal('dockLoaded');
      });
      it('should not set the value to a substep that has a lower value', function () {
        var result = ahaGuide.furthestSubstep(ahaGuide.steps.ADD_FIRST_BRANCH, 'dockLoaded');
        expect(result).to.equal('dockLoaded');
        result = ahaGuide.furthestSubstep(ahaGuide.steps.ADD_FIRST_BRANCH, 'dockLoading');
        expect(result).to.not.equal('dockLoading');
        expect(result).to.equal('dockLoaded');
      });
      it('should allow error states to overwrite anywhere', function () {
        var result = ahaGuide.furthestSubstep(ahaGuide.steps.ADD_FIRST_BRANCH, 'dockLoaded');
        expect(result).to.equal('dockLoaded');
        result = ahaGuide.furthestSubstep(ahaGuide.steps.ADD_FIRST_BRANCH, 'deletedTemplate');
        expect(result).to.not.equal('dockLoaded');
        expect(result).to.equal('deletedTemplate');
      });
    });
  });
});
