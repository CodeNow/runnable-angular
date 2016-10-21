'use strict';

var $controller;
var $rootScope;
var $scope;
var $window;
var keypather;

var apiMocks = require('../apiMocks/index');
var User = require('@runnable/api-client/lib/models/user');
var user = require('../apiMocks').user;

describe('controllerApp'.bold.underline.blue, function () {
  var ctx = {};
  var CA;
  var mockLocalStorage;
  var mockCurrentOrg;
  var showModalStub;
  var isRunnabotPartOfOrgStub;
  var mockFeatureFlags;
  var ahaGuideStub;
  function createMasterPods() {
    ctx.masterPods = runnable.newInstances(
      [apiMocks.instances.building, apiMocks.instances.runningWithContainers[0]],
      {noStore: true}
    );
    return ctx.masterPods;
  }
  function setup(delayStartup) {
    mockCurrentOrg = {
      poppa: {
        trialDaysRemaining: sinon.stub(),
        isInTrial: sinon.stub(),
        isInGrace: sinon.stub(),
        isGraceExpired: sinon.stub(),
        attrs: {
          hasPaymentMethod: false
        }
      },
      github: {
        attrs: {
          id: 'githubId1234'
        }
      }
    };
    ctx = {};
    ctx.fetchInstancesByPodMock = new (require('../fixtures/mockFetch'))();
    angular.mock.module('app');
    ctx.fakeuser = new User(angular.copy(apiMocks.user));
    ctx.fakeuser.socket = {
      joinOrgRoom: sinon.spy()
    };
    ctx.fakeOrg1 = {
      attrs: angular.copy(apiMocks.user),
      oauthName: function () {
        return 'org1';
      }
    };
    ctx.fakeOrg2 = {
      attrs: angular.copy(apiMocks.user),
      oauthName: function () {
        return 'org2';
      }
    };
    ctx.fakeOrgs = {models: [ctx.fakeOrg1, ctx.fakeOrg2]};
    ctx.stateParams = {
      userName: 'username',
      instanceName: 'instancename'
    };
    ctx.fakeErrs = {
      handler: sinon.spy(),
      clearErrors: sinon.spy(),
      errors: []
    };
    mockFeatureFlags = {
      flags: {},
      reset: sinon.stub(),
      changed: sinon.stub()
    };
    mockLocalStorage = {};
    showModalStub = sinon.stub();
    angular.mock.module('app', function ($provide) {
      $provide.factory('fetchInstancesByPod', ctx.fetchInstancesByPodMock.autoTrigger(createMasterPods()));
      $provide.value('$stateParams', ctx.stateParams);
      $provide.value('user', ctx.fakeuser);
      $provide.value('orgs', ctx.fakeOrgs);
      $provide.value('activeAccount', ctx.fakeuser);
      $provide.value('errs', ctx.fakeErrs);
      $provide.value('$localStorage', mockLocalStorage);
      $provide.factory('ahaGuide', function ($q) {
        ahaGuideStub = {
          updateCurrentOrg: sinon.stub(),
          setupAhaModalLaunchListener: sinon.stub()
        };
        return ahaGuideStub;
      });
      $provide.value('ModalService', {
        showModal: showModalStub
      });
      $provide.factory('isRunnabotPartOfOrg', function ($q) {
        isRunnabotPartOfOrgStub = sinon.stub().returns($q.when());
        return isRunnabotPartOfOrgStub;
      });
      $provide.value('featureFlags', mockFeatureFlags);
      $provide.value('currentOrg', mockCurrentOrg);
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
      if ($window.Intercom) {
        keypather.get($window, 'Intercom.restore()');
        sinon.stub($window, 'Intercom', noop);
      }
    });

    var controllerInitFn = $controller('ControllerApp', {
      '$scope': $scope
    }, true);
    if (delayStartup) {
      return controllerInitFn;
    }
    CA = controllerInitFn();
    $rootScope.$apply();
  }

  function tearDown () {
    keypather.get($window, 'Intercom.restore()');
  }

  describe('basics'.blue, function () {

    beforeEach(function () {
      // Error when not wrapped
      setup();
    });

    afterEach(function () {
      tearDown();
    });

    it('initalizes $scope.dataApp properly', function () {
      expect($scope.dataApp).to.be.an.Object;
      $rootScope.$digest();
      $scope.dataApp.data.modalError.actions.close();
      sinon.assert.calledOnce(ctx.fakeErrs.clearErrors);
    });

    it('creates a click handler that broadcasts', function () {
      $rootScope.$digest();

      var spy = sinon.spy();
      $scope.$on('app-document-click', spy);

      $scope.dataApp.documentClickEventHandler({
        target: 'foo'
      });

      expect(spy.calledOnce).to.equal(true);
      expect(spy.lastCall.args[1]).to.equal('foo');
    });


    it('should join the org room for the user', function () {
      sinon.assert.calledOnce(ctx.fakeuser.socket.joinOrgRoom);
    });
  });

  describe('showTrialEndingNotification', function () {
    beforeEach(function () {
      keypather.set($rootScope, 'featureFlags.billing', true);
      keypather.set(mockLocalStorage, 'hasDismissedTrialNotification.' + mockCurrentOrg.github.attrs.id, false);
      mockCurrentOrg.poppa.isInTrial.returns(true);
      mockCurrentOrg.poppa.trialDaysRemaining.returns(3);
    });

    it('should not show if not in trial', function () {
      mockCurrentOrg.poppa.isInTrial.returns(false);
      expect(CA.showTrialEndingNotification()).to.equal(false);
    });

    it('should not show if trial ends in more than 3 days', function () {
      mockCurrentOrg.poppa.trialDaysRemaining.returns(4);
      expect(CA.showTrialEndingNotification()).to.equal(false);
    });

    it('should not show if billing feature flag is set', function () {
      keypather.set($rootScope, 'featureFlags.billing', false);
      expect(CA.showTrialEndingNotification()).to.equal(false);
    });

    it('should not show if local storage shows its been dismissed', function () {
      keypather.set(mockLocalStorage, 'hasDismissedTrialNotification.' + mockCurrentOrg.github.attrs.id, true);
      expect(CA.showTrialEndingNotification()).to.equal(false);
    });

    it('should show if in trial that ends in less or equal to 3 days with feature flag and has not been dismissed', function () {
      expect(CA.showTrialEndingNotification()).to.equal(true);
    });
  });

  describe('closeTrialEndingNotification', function () {
    it('should set hasDismissedTrialNotification on local storage', function () {
      keypather.set(mockLocalStorage, 'hasDismissedTrialNotification.' + mockCurrentOrg.github.attrs.id, false);
      CA.closeTrialEndingNotification();
      expect(mockLocalStorage.hasDismissedTrialNotification[mockCurrentOrg.github.attrs.id]).to.equal(true);
    });
  });

  describe('when in grace period', function () {
    describe('when we have a payment method', function () {
      beforeEach(function () {
        var controllerSetupFn = setup(true);
        mockFeatureFlags.flags.billing = true;
        mockCurrentOrg.poppa.isInGrace.returns(true);
        mockCurrentOrg.poppa.isGraceExpired.returns(false);
        mockCurrentOrg.poppa.attrs.hasPaymentMethod = true;
        controllerSetupFn();
        $rootScope.$digest();
      });

      it('should open the payment due view', function () {
        sinon.assert.calledOnce(showModalStub);
        sinon.assert.calledWith(showModalStub, {
          controller: 'ExpiredAccountController',
          controllerAs: 'EAC',
          templateUrl: 'paymentDueView',
          preventClose: true
        });
      });
    });
    describe('with no payment method', function () {
      beforeEach(function () {
        var controllerSetupFn = setup(true);
        mockFeatureFlags.flags.billing = true;
        mockCurrentOrg.poppa.isInGrace.returns(true);
        mockCurrentOrg.poppa.isGraceExpired.returns(false);
        mockCurrentOrg.poppa.attrs.hasPaymentMethod = false;
        controllerSetupFn();
        $rootScope.$digest();
      });

      it('should open the trial end view', function () {
        sinon.assert.calledOnce(showModalStub);
        sinon.assert.calledWith(showModalStub, {
          controller: 'ExpiredAccountController',
          controllerAs: 'EAC',
          templateUrl: 'trialEndView',
          preventClose: true
        });
      });
    });
  });

  describe('when in grace expired', function () {
    describe('when we have a payment method', function () {
      beforeEach(function () {
        var controllerSetupFn = setup(true);
        mockFeatureFlags.flags.billing = true;
        mockCurrentOrg.poppa.isInGrace.returns(false);
        mockCurrentOrg.poppa.isGraceExpired.returns(true);
        mockCurrentOrg.poppa.attrs.hasPaymentMethod = true;
        controllerSetupFn();
        $rootScope.$digest();
      });

      it('should open the payment due view', function () {
        sinon.assert.calledOnce(showModalStub);
        sinon.assert.calledWith(showModalStub, {
          controller: 'ExpiredAccountController',
          controllerAs: 'EAC',
          templateUrl: 'paymentDueView',
          preventClose: true
        });
      });
    });

    describe('with no payment method', function () {
      beforeEach(function () {
        var controllerSetupFn = setup(true);
        mockFeatureFlags.flags.billing = true;
        mockCurrentOrg.poppa.isInGrace.returns(false);
        mockCurrentOrg.poppa.isGraceExpired.returns(true);
        mockCurrentOrg.poppa.attrs.hasPaymentMethod = false;
        controllerSetupFn();
        $rootScope.$digest();
      });

      it('should open the trial end view', function () {
        sinon.assert.calledOnce(showModalStub);
        sinon.assert.calledWith(showModalStub, {
          controller: 'ExpiredAccountController',
          controllerAs: 'EAC',
          templateUrl: 'trialEndView',
          preventClose: true
        });
      });
    });
  });
});
