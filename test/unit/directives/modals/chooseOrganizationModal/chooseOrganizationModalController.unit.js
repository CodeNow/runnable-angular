'use strict';

var $controller;
var $rootScope;
var $scope;
var keypather;
var $interval;
var $q;

var apiMocks = require('../../../apiMocks/index');
var user = require('../../../apiMocks').user;

var mockWhitelistedOrgs;
var mockGrantedOrgs;
var mockCreateNewSandboxForUserService;
var mockErrs;
var mockFetchWhitelistForDockCreated;
var mockOrg;
var mockState;
var mockUser;

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
    mockGrantedOrgs = {
      models: [mockOrg]
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
    angular.mock.module('app', function ($provide) {
      $provide.value('$state', mockState);
      $provide.factory('createNewSandboxForUserService', function ($q) {
        mockCreateNewSandboxForUserService = sinon.stub().returns($q.when(true));
        return mockCreateNewSandboxForUserService;
      });
      $provide.value('errs', mockErrs);
      $provide.factory('fetchWhitelistForDockCreated', function ($q) {
        mockFetchWhitelistForDockCreated = sinon.stub().returns($q.when(mockWhitelistedOrgs));
        return mockFetchWhitelistForDockCreated;
      });
      $provide.value('whitelistedOrgs', mockWhitelistedOrgs);
      $provide.value('grantedOrgs', mockGrantedOrgs);
      $provide.value('user', mockUser);
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

    var laterController = $controller('ChooseOrganizationModalController', {
      $scope: $scope
    }, true);
    COMC = laterController();
    $rootScope.$apply();
  }


  describe('searching methods', function () {
    beforeEach(function () {
      initialize();
    });

    beforeEach(function () {
      setup();
    });


    describe('getFirstDockOrg', function () {
      it('should return nothing when no whitelistedOrg has firstDockCreated', function () {
        expect(COMC.getFirstDockOrg()).to.be.undefined;
      });

      it('should return the first firstDockCreated it finds', function () {
        var createdDockOrg = {
          attrs: {
            _id: '1312312',
            name: 'Runnable',
            lowername: 'runnable',
            githubId: 1231233,
            firstDockCreated: true,
            allowed: true
          }
        };
        COMC.whitelistedOrgs.push(createdDockOrg);
        expect(COMC.getFirstDockOrg()).to.equal(createdDockOrg);
      });
    });

    describe('matchWhitelistedOrgByName', function () {
      it('should match orgs by their names (case insensitive)', function () {
        expect(COMC.matchWhitelistedOrgByName('codenow')).to.equal(codenowWhitelistedOrg);
      });
    });

    describe('getSelectedOrg', function () {
      it('should match orgs by their names (case insensitive)', function () {
        expect(COMC.getSelectedOrg('codenow')).to.equal(mockOrg);
      });
    });
  });

  describe('Polling stuff', function () {
    beforeEach(function () {
      initialize();
    });

    beforeEach(function () {
      setup();
    });

    beforeEach(function () {
      sinon.stub(COMC, 'fetchUpdatedWhitelistedOrg').returns($q.when(codenowWhitelistedOrg));
    });


    describe('cancelPolling', function () {
      it('should cancel the polling when pollingInterval is running', function () {
        sinon.stub($interval, 'cancel').returns();
        COMC.pollingInterval = true;
        COMC.cancelPolling();
        sinon.assert.calledOnce($interval.cancel);
      });
    });

    describe('pollForDockCreated', function () {
      beforeEach(function () {
        sinon.stub(COMC, 'cancelPolling').returns();
      });

      it('should return and goToPanel dockLoaded if whitelistedDock is ready', function () {
        var stubGoToPanelCb = sinon.stub().returns();
        COMC.pollForDockCreated(createdDockOrg, 'name', stubGoToPanelCb);
        $rootScope.$digest();

        sinon.assert.calledOnce(stubGoToPanelCb);
        sinon.assert.calledWith(stubGoToPanelCb, 'dockLoaded');
        sinon.assert.calledOnce(COMC.cancelPolling);
      });

      it('should go to dockLoading, then poll for update', function () {
        var stubGoToPanelCb = sinon.stub().returns();
        COMC.pollForDockCreated(codenowWhitelistedOrg, 'name', stubGoToPanelCb);

        sinon.assert.calledOnce(COMC.cancelPolling);
        sinon.assert.calledOnce(stubGoToPanelCb);
        sinon.assert.calledWith(stubGoToPanelCb, 'dockLoading');
        expect(COMC.pollingInterval).to.be.truthy;

        codenowWhitelistedOrg.attrs.firstDockCreated = true;
        $interval.flush(1000);
        $rootScope.$digest();

        sinon.assert.calledTwice(COMC.cancelPolling);
        sinon.assert.calledTwice(stubGoToPanelCb);
        sinon.assert.calledWith(stubGoToPanelCb, 'dockLoaded');
      });
    });
  });

  describe('fetchUpdatedWhitelistedOrg', function () {
    beforeEach(function () {
      initialize();
    });

    beforeEach(function () {
      setup();
    });

    beforeEach(function () {
      sinon.stub(COMC, 'matchWhitelistedOrgByName').returns(createdDockOrg);
    });

    it('should update the controllers orgs, and attempt to match the name for the return value', function (done) {
      expect(COMC.whitelistedOrgs).to.deep.equal(mockWhitelistedOrgs);
      mockWhitelistedOrgs.push(createdDockOrg);

      COMC.fetchUpdatedWhitelistedOrg('codenow')
        .then(function (matchedOrg) {
          expect(matchedOrg).to.equal(createdDockOrg);
          sinon.assert.calledWith(COMC.matchWhitelistedOrgByName, 'codenow');
          expect(COMC.whitelistedOrgs).to.equal(mockWhitelistedOrgs);
          expect(COMC.whitelistedOrgs.length).to.equal(2);
          done();
        });
      $rootScope.$digest();
    });
  });

  describe('actions', function () {
    beforeEach(function () {
      initialize();
    });

    beforeEach(function () {
      setup();
    });
    beforeEach(function () {
      sinon.stub(COMC, 'getSelectedOrg');
    });

    describe('createOrCheckDock', function () {
      beforeEach(function () {
        sinon.stub(COMC, 'fetchUpdatedWhitelistedOrg');
        COMC.fetchUpdatedWhitelistedOrg.returns($q.when());
        sinon.stub(COMC, 'pollForDockCreated').returns();
      });
      it('should go nowhere if no org was selected', function () {
        COMC.getSelectedOrg.returns();

        $scope.actions.createOrCheckDock();

        sinon.assert.notCalled(COMC.fetchUpdatedWhitelistedOrg);
      });
      it('should create the sandbox, then start polling ', function () {
        COMC.getSelectedOrg.returns(codenowWhitelistedOrg);

        var gotoPanelStub = sinon.stub().returns();
        $scope.actions.createOrCheckDock('CodeNow', gotoPanelStub);

        sinon.assert.calledOnce(COMC.fetchUpdatedWhitelistedOrg);
        sinon.assert.calledWith(COMC.fetchUpdatedWhitelistedOrg, 'CodeNow');
        $rootScope.$digest();

        sinon.assert.calledOnce(mockCreateNewSandboxForUserService);
        sinon.assert.calledWith(mockCreateNewSandboxForUserService, 'CodeNow');

        sinon.assert.calledOnce(COMC.pollForDockCreated);
        sinon.assert.calledWith(COMC.pollForDockCreated, null, 'CodeNow', gotoPanelStub);
      });

      it('should go to created panel since this org is ready', function () {
        COMC.getSelectedOrg.returns(createdDockOrg);
        COMC.fetchUpdatedWhitelistedOrg.returns($q.when(createdDockOrg));

        var gotoPanelStub = sinon.stub().returns();
        $scope.actions.createOrCheckDock('Runnable', gotoPanelStub);

        sinon.assert.calledOnce(COMC.fetchUpdatedWhitelistedOrg);
        sinon.assert.calledWith(COMC.fetchUpdatedWhitelistedOrg, 'Runnable');
        $rootScope.$digest();

        sinon.assert.notCalled(mockCreateNewSandboxForUserService);

        sinon.assert.calledOnce(COMC.pollForDockCreated);
        sinon.assert.calledWith(COMC.pollForDockCreated, createdDockOrg, 'Runnable', gotoPanelStub);
      });
    });
  });
});
