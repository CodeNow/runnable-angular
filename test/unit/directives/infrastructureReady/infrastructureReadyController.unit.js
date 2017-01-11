'use strict';

var $controller;
var $rootScope;
var $scope;
var keypather;
var $interval;
var $q;

var apiMocks = require('../../apiMocks/index');
var user = require('../../apiMocks').user;

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

var mockFetchGrantedGithubOrgs;
var mockFetchUser;

var codenowWhitelistedOrg;
var createdDockOrg;
var IRC;

describe('InfrastructureReadyController', function () {

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
      attrs: {
        name: 'CodeNow'
      },
      oauthName: function () {
        return 'CodeNow';
      },
      gravitar: function () {
        return true;
      }
    };
    mockOrg1 = {
      attrs: {
         name: 'CodeNow123'
      },
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
          spunUpInfrastructure: sinon.stub()
        };
        return eventTrackingStub;
      });
      $provide.factory('createNewSandboxForUserService', function ($q) {
        mockCreateNewSandboxForUserService = sinon.stub().returns($q.when(true));
        return mockCreateNewSandboxForUserService;
      });
      $provide.value('errs', mockErrs);
      $provide.factory('fetchWhitelistForDockCreated', function ($q) {
        mockFetchWhitelistForDockCreated = sinon.stub().returns($q.when(mockWhitelistedOrgs));
        return mockFetchWhitelistForDockCreated;
      });
      $provide.factory('fetchGrantedGithubOrgs', function ($q) {
        mockFetchGrantedGithubOrgs = sinon.stub().returns($q.when(mockGrantedOrgs));
        return mockFetchGrantedGithubOrgs;
      });
      $provide.factory('fetchUser', function ($q) {
        mockFetchUser = sinon.stub().returns($q.when(mockWhitelistedOrgs));
        return mockFetchUser;
      });
      $provide.value('whitelistedOrgs', mockWhitelistedOrgs);
      $provide.value('currentOrg', { poppa: codenowWhitelistedOrg });
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
    var laterController = $controller('InfrastructureReadyController', {
      $scope: $scope
    }, true);
    IRC = laterController();
    $rootScope.$apply();
  }

  beforeEach(function () {
    initialize();
  });

  beforeEach(function () {
    setup();
  });

  describe('searching methods', function () {
    describe('#matchWhitelistedOrgByName', function () {
      it('should match orgs by their names (case insensitive)', function () {
        expect(IRC.matchWhitelistedOrgByName(mockWhitelistedOrgs, 'codenow')).to.equal(codenowWhitelistedOrg);
      });
    });

    describe('#getSelectedOrg', function () {
      it('should match orgs by their names (case insensitive)', function (done) {
        IRC.getSelectedOrg('codenow')
          .then(function (org) {
            expect(org).to.equal(mockOrg);
            done();
          });
        $rootScope.$apply();
      });
    });
  });

  describe('#fetchUpdatedWhitelistedOrg', function () {
    beforeEach(function () {
      sinon.stub(IRC, 'matchWhitelistedOrgByName').returns(createdDockOrg);
    });

    it('should update the controllers orgs, and attempt to match the name for the return value', function (done) {
      mockWhitelistedOrgs.push(createdDockOrg);

      IRC.fetchUpdatedWhitelistedOrg('Runnable')
        .then(function (matchedOrg) {
          expect(matchedOrg).to.equal(createdDockOrg);
          sinon.assert.calledWith(IRC.matchWhitelistedOrgByName, mockWhitelistedOrgs, 'Runnable');
          done();
        });
      $rootScope.$digest();
    });
  });

  describe('pollForDockCreated', function () {
    beforeEach(function () {
      IRC.cancelPollingForDockCreated();
      sinon.stub(IRC, 'cancelPollingForDockCreated').returns();
      sinon.stub(IRC, 'fetchUpdatedWhitelistedOrg').returns($q.when(codenowWhitelistedOrg));
    });
    afterEach(function () {
      IRC.cancelPollingForDockCreated.restore();
      IRC.fetchUpdatedWhitelistedOrg.restore();
    });

    it('should return and goToPanel dockLoaded if whitelistedDock is ready', function () {
      stubGoToPanel.reset();
      IRC.pollForDockCreated(createdDockOrg, 'name');
      $rootScope.$digest();

      sinon.assert.calledOnce(stubGoToPanel);
      sinon.assert.calledWith(stubGoToPanel, sinon.match.object, 'dockLoaded');
      sinon.assert.calledOnce(IRC.cancelPollingForDockCreated);
    });

    it('should go to dockLoading, then poll for update', function () {
      stubGoToPanel.reset();
      IRC.pollForDockCreated(codenowWhitelistedOrg, 'name', stubGoToPanel);

      sinon.assert.calledOnce(IRC.cancelPollingForDockCreated);
      sinon.assert.calledOnce(stubGoToPanel);
      sinon.assert.calledOnce(stubGoToPanel, sinon.match.object, 'dockLoading');
      expect(IRC.pollForDockCreatedPromise).to.be.truthy;

      codenowWhitelistedOrg.attrs.firstDockCreated = true;
      $interval.flush(1000);
      $rootScope.$digest();

      sinon.assert.calledTwice(IRC.cancelPollingForDockCreated);
      sinon.assert.calledTwice(stubGoToPanel);
      sinon.assert.calledWith(stubGoToPanel, sinon.match.object, 'dockLoaded');
    });
  });

  describe('on $destroy', function () {
    beforeEach(function () {
      sinon.stub(IRC, 'cancelPollingForDockCreated');
    });

    afterEach(function () {
      IRC.cancelPollingForDockCreated.restore();
    });

    it('should cancel all polling operaions', function () {
      $scope.$broadcast('$destroy');
      sinon.assert.calledOnce(IRC.cancelPollingForDockCreated);
    });
  });

  describe('#cancelPollingForDockCreated', function () {
    it('should cancel the polling when pollForDockCreatedPromise is running', function () {
      sinon.stub($interval, 'cancel').returns();
      IRC.pollForDockCreatedPromise = true;
      IRC.cancelPollingForDockCreated();
      sinon.assert.calledOnce($interval.cancel);
    });
  });

  describe('#goToOrgSelect', function () {
    it('should change the state', function () {
      IRC.goToOrgSelect();
      sinon.assert.calledOnce(mockState.go);
      sinon.assert.calledWith(mockState.go, 'orgSelect');
    });
  });

  describe('#checkDoc', function () {
    beforeEach(function () {
      sinon.stub(IRC, 'fetchUpdatedWhitelistedOrg');
      sinon.stub(IRC, 'getSelectedOrg');
      IRC.fetchUpdatedWhitelistedOrg.returns($q.when());
      sinon.stub(IRC, 'pollForDockCreated').returns();
    });
    afterEach(function () {
      IRC.getSelectedOrg.restore();
      IRC.fetchUpdatedWhitelistedOrg.restore();
      IRC.pollForDockCreated.restore();
    });
    it('should go nowhere if no org was selected', function () {
      IRC.getSelectedOrg.returns($q.when());

      IRC.checkDock();

      sinon.assert.notCalled(IRC.fetchUpdatedWhitelistedOrg);
    });
    it('should go to created panel since this org is ready', function () {
      eventTrackingStub.spunUpInfrastructure.reset();
      IRC.getSelectedOrg.returns($q.when(createdDockOrg));
      IRC.fetchUpdatedWhitelistedOrg.returns($q.when(createdDockOrg));

      IRC.checkDock('Runnable');

      sinon.assert.calledOnce(IRC.getSelectedOrg);
      sinon.assert.calledWith(IRC.getSelectedOrg, 'Runnable');
      $rootScope.$digest();

      sinon.assert.calledOnce(IRC.fetchUpdatedWhitelistedOrg);
      sinon.assert.calledWith(IRC.fetchUpdatedWhitelistedOrg, 'Runnable');
      $rootScope.$digest();

      sinon.assert.notCalled(IRC.pollForDockCreated);

      sinon.assert.calledOnce(eventTrackingStub.spunUpInfrastructure);
    });
  });
});
