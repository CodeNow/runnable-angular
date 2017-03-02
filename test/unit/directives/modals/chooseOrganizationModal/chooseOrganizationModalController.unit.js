'use strict';

var $controller;
var $rootScope;
var $scope;
var keypather;
var $interval;
var $q;

var apiMocks = require('../../../apiMocks/index');
var user = require('../../../apiMocks').user;

var closeStub;
var mockAhaGuide;
var mockCreateNewSandboxForUserService;
var mockErrs;
var mockFetchWhitelistForDockCreated;
var mockGrantedOrgs;
var mockLoading;
var mockOrg1;
var mockOrg;
var mockState;
var mockUser;
var stubGoToPanel;
var mockWhitelistedOrgs;
var promisifyMock;
var eventTrackingStub;
var mockWaitForWhitelistExist;

var codenowWhitelistedOrg;
var createdDockOrg;
var COMC;

describe('ChooseOrganizationModalController', function () {

  function initialize() {
    codenowWhitelistedOrg = {
      attrs: {
        _id: 'asdasdasads',
        name: 'CodeNow',
        lowername: 'codenow',
        githubId: 2131231,
        firstDockCreated: false,
        allowed: true
      },
      oauthName: function () {
        return 'CodeNow';
      }
    };
    createdDockOrg = {
      attrs: {
        _id: '1312312',
        name: 'Runnable',
        lowername: 'runnable',
        githubId: 1231233,
        firstDockCreated: true,
        allowed: true
      },
      oauthName: function () {
        return 'Runnable';
      }
    };
    mockWhitelistedOrgs = [codenowWhitelistedOrg];
    mockUser = {
      attrs: angular.copy(apiMocks.user),
      oauthName: function () {
        return 'user';
      },
      gravitar: function () {
        return true;
      },
      newSettings: sinon.spy(function() {
        return {
          update: sinon.spy()
        };
      }),
      fetchSettings: sinon.spy()
    };
    mockOrg = {
      oauthName: function () {
        return 'CodeNow';
      },
      gravitar: function () {
        return true;
      }
    };
    mockOrg1 = {
      oauthName: function () {
        return 'CodeNow123';
      },
      gravitar: function () {
        return true;
      }
    };
    mockGrantedOrgs = {
      models: [mockOrg],
      fetch: sinon.stub()
    };
    mockErrs = {
      handler: sinon.spy(),
      errors: []
    };
    mockCreateNewSandboxForUserService = null;
    mockFetchWhitelistForDockCreated = null;
  }

  function setup() {
    mockState = {
      go: sinon.stub()
    };
    mockAhaGuide = {
      isChoosingOrg: sinon.stub(),
      getCurrentStep: sinon.stub().returns(-1)
    };
    closeStub = sinon.stub();
    mockLoading = sinon.stub();
    angular.mock.module('app', function ($provide) {
      $provide.factory('promisify', function ($q) {
        promisifyMock = sinon.spy(function (obj, key) {
          return function () {
            return $q.when(obj[key].apply(obj, arguments));
          };
        });
        return promisifyMock;
      });
      $provide.value('loading', mockLoading);
      $provide.value('$state', mockState);
      $provide.value('ahaGuide', mockAhaGuide);
      $provide.factory('eventTracking', function ($q) {
        eventTrackingStub = {
          updateCurrentPersonProfile: sinon.stub(),
          spunUpInfrastructure: sinon.stub(),
          spunUpInfrastructureForOrg: sinon.stub(),
          openedSecondAuthPrimer: sinon.stub()
        };
        return eventTrackingStub;
      });
      $provide.factory('createNewSandboxForUserService', function ($q) {
        mockCreateNewSandboxForUserService = sinon.stub().returns($q.when(true));
        return mockCreateNewSandboxForUserService;
      });
      $provide.value('errs', mockErrs);
      $provide.factory('waitForWhitelistExist', function ($q) {
        mockWaitForWhitelistExist = sinon.stub().returns($q.when(mockWhitelistedOrgs));
        return mockWaitForWhitelistExist;
      });
      $provide.factory('fetchWhitelistForDockCreated', function ($q) {
        mockFetchWhitelistForDockCreated = sinon.stub().returns($q.when(mockWhitelistedOrgs));
        return mockFetchWhitelistForDockCreated;
      });
      $provide.value('whitelistedOrgs', mockWhitelistedOrgs);
      $provide.value('grantedOrgs', mockGrantedOrgs);
      $provide.value('user', mockUser);
      $provide.value('close', closeStub);
    });
    angular.mock.inject(function (
      _$controller_,
      _$interval_,
      _$q_,
      _$rootScope_,
      _keypather_
    ) {
      $controller = _$controller_;
      $interval = _$interval_;
      $q = _$q_;
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
      keypather = _keypather_;
    });
    stubGoToPanel = sinon.stub();
    $scope.$on('go-to-panel', stubGoToPanel);
    var laterController = $controller('ChooseOrganizationModalController', {
      $scope: $scope
    }, true);
    COMC = laterController();
    $rootScope.$apply();
  }

  describe('Personal accounts', function () {
    it('should set true if there is one account', function () {
      initialize();
      mockGrantedOrgs.models = [];
      mockWhitelistedOrgs = [];
      setup();
      expect(COMC.personalAccountOnly).to.equal(true);
    });
    it('should set false if there is more than one whitelisted account', function () {
      initialize();
      mockGrantedOrgs.models = [];
      mockWhitelistedOrgs = [codenowWhitelistedOrg];
      setup();
      expect(COMC.personalAccountOnly).to.equal(false);
    });
    it('should set false if there is more than one org with grantes access', function () {
      initialize();
      mockGrantedOrgs.models = [{ login: 'wow' }];
      mockWhitelistedOrgs = [];
      setup();
      expect(COMC.personalAccountOnly).to.equal(false);
    });
  });

  describe('Polling stuff', function () {
    beforeEach(function () {
      initialize();
    });

    beforeEach(function () {
      setup();
    });

    describe('cancelPollingForWhitelisted', function () {
      it('should cancel the polling when pollForWhitelistPromise is running', function () {
        sinon.stub($interval, 'cancel').returns();
        COMC.pollForWhitelistPromise = true;
        COMC.cancelPollingForWhitelisted();
        sinon.assert.calledOnce($interval.cancel);
      });
    });
  });

  describe('#selectAccount', function () {
    beforeEach(function () {
      initialize();
    });

    beforeEach(function () {
      setup();
    });

    it('should to go to the instances pages if already created', function () {
      COMC.actions.selectAccount('codeNow');
      $rootScope.$digest();

      sinon.assert.notCalled(mockCreateNewSandboxForUserService);
      sinon.assert.calledOnce(closeStub);
      sinon.assert.calledOnce(mockState.go);
      sinon.assert.calledWith(mockState.go, 'base.instances', { userName: 'codeNow' }, { reload: true });
    });

    it ('should to go to the instances pages if already created', function () {
      COMC.actions.selectAccount('Runnable');
      $rootScope.$digest();

      sinon.assert.calledOnce(mockCreateNewSandboxForUserService);
      sinon.assert.calledWith(mockCreateNewSandboxForUserService, 'Runnable');
      sinon.assert.calledOnce(closeStub);
      sinon.assert.calledOnce(mockState.go);
      sinon.assert.calledWith(mockState.go, 'base.instances', { userName: 'Runnable' }, { reload: true });
    });
  });

  describe('grantAccess', function () {
    it('should initiate polling for new orgs', function () {
      COMC.grantAccess();
      sinon.assert.calledWith(mockLoading, 'grantAccess', true);
      expect(COMC.pollForWhitelistPromise).to.be.truthy;
    });

    it('should cancel polling when new orgs are found', function () {
      COMC.grantAccess();
      $rootScope.$digest();
      mockGrantedOrgs.fetch.returns($q.when({
        models: [mockOrg, mockOrg1]
      }));
      $interval.flush(10 * 1000);
      $rootScope.$digest();
      expect(COMC.showGrantAccess).to.be.falsey;
      sinon.assert.calledWith(mockLoading, 'grantAccess', false);
    });

    it('should continue polling when no new orgs are found', function () {
      COMC.grantAccess();
      mockGrantedOrgs.fetch.returns($q.when({
        models: [mockOrg]
      }));
      $rootScope.$digest();
      $interval.flush(10 * 1000);
      $rootScope.$digest();
      expect(COMC.showGrantAccess).to.be.truthy;
      sinon.assert.neverCalledWith(mockLoading, 'grantAccess', false);
    });
  });

  describe('on $destroy', function () {
    beforeEach(function () {
      sinon.stub(COMC, 'cancelPollingForWhitelisted');
    });

    afterEach(function () {
      COMC.cancelPollingForWhitelisted.restore();
    });

    it('should cancel all polling operaions', function () {
      $scope.$broadcast('$destroy');
      sinon.assert.calledOnce(COMC.cancelPollingForWhitelisted);
    });
  });
});
