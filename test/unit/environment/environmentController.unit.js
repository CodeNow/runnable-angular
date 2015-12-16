'use strict';

var $controller,
    $rootScope,
    $scope,
    $q,
    $timeout;
var keypather;
var apiMocks = require('../apiMocks/index');
var runnable = window.runnable;
var fetchInstancesByPodMock = new (require('../fixtures/mockFetch'))();
var createAndBuildNewContainer = new (require('../fixtures/mockFetch'))();

var stacks = angular.copy(apiMocks.stackInfo);
var thisUser = runnable.newUser(apiMocks.user);
var EC;

describe('environmentController'.bold.underline.blue, function () {
  var ctx = {};

  function createMasterPods() {
    ctx.masterPods = runnable.newInstances(
      [apiMocks.instances.building, apiMocks.instances.runningWithContainers[0]],
      {noStore: true}
    );
    ctx.masterPods.githubUsername = thisUser.oauthName();
  }
  function setup(opts) {
    opts = opts || {};
    ctx = {};
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
      $provide.factory('fetchInstancesByPod', fetchInstancesByPodMock.fetch());
      $provide.factory('fetchOrgMembers', function ($q) {
        ctx.uninvitedUsersArray = [1, 2, 999];
        if (opts.failFetchOrgMembers) {
          ctx.fetchOrgMembersStub = sinon.stub().returns($q.reject(ctx.fetchError));
        } else {
          ctx.fetchOrgMembersStub = sinon.stub().returns($q.when({
            uninvited: ctx.uninvitedUsersArray
          }));
        }
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
    createMasterPods();
  }


  describe('basics', function () {
    it('should attempt all of the required fetches, plus add its actions to the scope', function () {

      setup();
      $rootScope.$digest();
      expect($scope).to.have.property('data');
      // this isn't loaded until stacks
      expect($scope.data).to.not.have.property('instances');
      expect($scope).to.have.property('state');
      expect($scope.state).to.have.property('validation');
      expect($scope.state.validation).to.have.property('env');

      var templateInstances = runnable.newInstances(
        [apiMocks.instances.running, apiMocks.instances.stopped],
        {noStore: true}
      );
      templateInstances.githubUsername = 'HelloRunnable';
      fetchInstancesByPodMock.triggerPromise(ctx.masterPods);

      sinon.assert.calledWith(ctx.pageNameMock.setTitle, 'Configure - Runnable');
      sinon.assert.calledOnce(ctx.favicoMock.reset);

      $rootScope.$digest();
      // this should now be loaded
      expect($scope.data.instances, 'masterPods').to.equal(ctx.masterPods);
    });
  });

  describe('Modals', function () {
    describe('inviteTeammate', function () {
      describe('Succes Cases', function () {
        beforeEach(function () {
          setup();
        });

        it('should fetchOrgMembers with the username', function () {
          EC.triggerModal.inviteTeammate();
          $scope.$digest();
          sinon.assert.calledOnce(ctx.fetchOrgMembersStub);
          sinon.assert.calledWith(ctx.fetchOrgMembersStub, ctx.state.params.userName, true);
        });

        it('should invoke the modal with the username and uninvited members', function () {
          EC.triggerModal.inviteTeammate();
          $scope.$digest();
          sinon.assert.calledOnce(ctx.showModalStub);
          sinon.assert.calledWith(ctx.showModalStub, {
              controller: 'InviteModalController',
              controllerAs: 'IMC',
              templateUrl: 'inviteModalView',
              inputs: {
                teamName: ctx.state.params.userName,
                unInvitedMembers: ctx.uninvitedUsersArray
              }
          });
        });
      });

      describe('Error Handling', function () {
        beforeEach(function () {
          setup({
            failFetchOrgMembers: true
          });
        });

        it('should notify the user if there was any errors', function () {
          EC.triggerModal.inviteTeammate();
          $scope.$digest();
          sinon.assert.calledOnce(ctx.errs.handler);
          sinon.assert.calledWith(ctx.errs.handler, ctx.fetchError);
        });
      });
    });
  });
});
