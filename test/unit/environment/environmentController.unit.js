'use strict';

var apiMocks = require('../apiMocks/index');
var keypather = require('keypather')();
var runnable = window.runnable;
var hasPaymentMethod;

var $controller;
var $q;
var $rootScope;
var $scope;
var $timeout;

var thisUser = runnable.newUser(apiMocks.user);
var EC;
var fetchDockerfileForContextVersionStub;

describe('environmentController'.bold.underline.blue, function () {
  var ctx = {};

  function setup() {
    ctx = {};
    var buildingInstance = apiMocks.instances.building;
    ctx.runningInstance = apiMocks.instances.runningWithContainers[0];
    keypather.set(ctx.runningInstance, 'contextVersion.buildDockerfilePath', '/Dockerfile');
    ctx.masterPods = runnable.newInstances(
      [ buildingInstance, ctx.runningInstance ],
      {noStore: true}
    );
    ctx.masterPods.githubUsername = thisUser.oauthName();
    ctx.dockerfile = {};
    ctx.$log = {
      error: sinon.stub()
    };
    ctx.errs = {
      handler: sinon.stub()
    };
    ctx.eventTracking = {
      triggeredBuild: sinon.stub()
    };
    ctx.fakeOrg1 = {
      attrs: angular.copy(apiMocks.user),
      oauthName: function () {
        return 'org1';
      },
      poppa: {
        attrs: {
          hasPaymentMethod: hasPaymentMethod
        }
      }
    };
    ctx.fakeUser = {
      attrs: angular.copy(apiMocks.user),
      oauthName: function () {
        return 'user';
      }
    };
    ctx.favicoMock = {
      reset : sinon.stub(),
      setInstanceState: sinon.stub()
    };
    ctx.pageNameMock = {
      setTitle: sinon.stub()
    };
    ctx.state = {
      params: {
        userName: 'helloWorld'
      }
    };
    ctx.fetchError = new Error('fetchOrgMembers failed');

    runnable.reset(apiMocks.user);
    angular.mock.module('app', function ($provide) {
      $provide.value('favico', ctx.favicoMock);
      $provide.value('pageName', ctx.pageNameMock);
      $provide.value('eventTracking', ctx.eventTracking);
      $provide.value('user', thisUser);
      $provide.value('$state', ctx.state);
      $provide.value('ahaGuide', {
        isAddingFirstRepo: sinon.stub().returns(false),
        getCurrentStep: sinon.stub(),
        isInGuide: sinon.stub().returns(true),
        steps: {
          ADD_FIRST_REPO: 'addFirstRepo?!'
        }
      });
      $provide.value('currentOrg', ctx.fakeOrg1);
      $provide.value('instancesByPod', ctx.masterPods);
      $provide.factory('fetchDockerfileForContextVersion', function ($q) {
        fetchDockerfileForContextVersionStub = sinon.stub().returns($q.when(ctx.dockerfile));
        return fetchDockerfileForContextVersionStub;
      });
      $provide.factory('fetchUser', function ($q) {
         var user = {};
         keypather.set(user, 'attrs.accounts.github.username', 'thejsj');
         ctx.fetchUser = sinon.stub().returns($q.when(user));
         return ctx.fetchUser;
      });
      $provide.factory('fetchOrgMembers', function ($q) {
        ctx.uninvitedUsersArray = [1, 2, 999];
        ctx.fetchOrgMembersStub = sinon.stub().returns($q.when({
          uninvited: ctx.uninvitedUsersArray,
        }));
        return ctx.fetchOrgMembersStub;
      });
      $provide.value('$log', ctx.$log);
      $provide.value('errs', ctx.errs);
      $provide.factory('ModalService', function ($q) {
        ctx.showModalStub = sinon.stub().returns($q.when({
          close: $q.when(true)
        }));
        return {
          showModal: ctx.showModalStub
        };
      });
    });
    angular.mock.inject(function (
      _$controller_,
      _$rootScope_,
      _keypather_,
      _$timeout_,
      _$q_
    ) {
      $q = _$q_;
      $timeout = _$timeout_;
      $controller = _$controller_;
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
      keypather = _keypather_;
    });

    EC = $controller('EnvironmentController', {
      '$scope': $scope,
      '$rootScope': $rootScope
    });
  }


  describe('basics', function () {
    it('should attempt all of the required fetches, plus add its actions to the scope', function () {
      setup();
      $rootScope.$digest();
      expect($scope).to.have.property('data');
      expect($scope).to.have.property('state');
      sinon.assert.calledWith(ctx.pageNameMock.setTitle, 'Configure - Runnable');
      sinon.assert.calledOnce(ctx.favicoMock.reset);
      expect($scope.data.instances, 'masterPods').to.equal(ctx.masterPods);
    });
  });

  describe('Dockerfile mirroring', function () {
    it('should attempt all of the required fetches, plus add its actions to the scope', function () {
      setup();
      $rootScope.$digest();
      // this should now be loaded
      sinon.assert.calledOnce(fetchDockerfileForContextVersionStub);
      expect(ctx.masterPods.models[1].mirroredDockerfile).to.equal(ctx.dockerfile);
    });
  });

  describe('showInviteButton', function () {
    beforeEach(function () {
      setup();
    });

    it('should not show the invite button by default', function () {
      expect(EC.showInviteButton).to.not.equal(true);
    });

    it('should show the invite button if the user is an org', function () {
      $rootScope.$digest();
      expect(EC.showInviteButton).to.equal(true);
    });

    it('should not show the user is equal to userName', function () {
      ctx.state.params.userName = 'thejsj';
      EC.isPersonalAccount = false;
      $rootScope.$digest();
      expect(EC.showInviteButton).to.equal(false);
    });
  });

  describe('plan upgrade notification', function () {

    it('should not show the \'bumped to next plan\' notification if the user does not have a credit card', function () {
      hasPaymentMethod = false;
      setup();
      sinon.stub(EC.actions, 'closeAlert');
      $rootScope.$broadcast('alert', {newPlan: true});
      expect(EC.alert.newPlan).to.equal(null);
      $timeout.flush();
      sinon.assert.calledOnce(EC.actions.closeAlert);
    });

    it('should show the \'bumped to next plan\' notification if the user has a credit card', function () {
      hasPaymentMethod = true;
      setup();
      sinon.stub(EC.actions, 'closeAlert');
      $rootScope.$broadcast('alert', {newPlan: true});
      expect(EC.alert.newPlan).to.equal(true);
      $timeout.flush();
      sinon.assert.calledOnce(EC.actions.closeAlert);
    });
  });

  describe('Modals', function () {
    describe('inviteTeammate', function () {
      describe('Succes Cases', function () {
        beforeEach(function () {
          setup();
        });

        it('should invoke the modal with the username and uninvited members', function () {
          EC.isPersonalAccount = false;
          EC.orgMembers = [1, 2, 999];
          EC.triggerModal.inviteTeammate();
          $scope.$digest();
          sinon.assert.calledOnce(ctx.showModalStub);
          sinon.assert.calledWith(ctx.showModalStub, {
              controller: 'InviteModalController',
              controllerAs: 'IMC',
              templateUrl: 'inviteModalView',
              inputs: {
                teamName: ctx.state.params.userName,
                unInvitedMembers: null,
                orgMembers: ctx.uninvitedUsersArray,
                isPersonalAccount: false
              }
          });
        });
      });
    });
  });
});
