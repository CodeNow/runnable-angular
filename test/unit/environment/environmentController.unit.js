'use strict';

var $controller,
    $rootScope,
    $scope,
    $q,
    $timeout;
var keypather;
var apiMocks = require('../apiMocks/index');
var fetchUserMock = new (require('../fixtures/mockFetch'))();
var fetchStackInfoMock = new (require('../fixtures/mockFetch'))();
var fetchContextsMock = new (require('../fixtures/mockFetch'))();
var fetchInstancesMock = new (require('../fixtures/mockFetch'))();
var fetchInstancesByPodMock = new (require('../fixtures/mockFetch'))();
var createNewInstanceMock = new (require('../fixtures/mockFetch'))();

var stacks = angular.copy(apiMocks.stackInfo);
var thisUser = runnable.newUser(apiMocks.user);

describe('environmentController'.bold.underline.blue, function () {
  var ctx = {};

  function createMasterPods() {
    ctx.masterPods = runnable.newInstances(
      [apiMocks.instances.building, apiMocks.instances.runningWithContainers],
      {noStore: true}
    );
    ctx.masterPods.githubUsername = thisUser.oauthName();
  }
  function setup() {
    ctx = {};
    ctx.$log = {
      error: sinon.spy()
    };
    ctx.errs = {
      handler: sinon.spy()
    };
    ctx.eventTracking = {
      triggeredBuild: sinon.spy()
    };
    ctx.fakeOrg1 = {
      attrs: angular.copy(apiMocks.user),
      oauthName: function () {
        return 'org1';
      }
    };
    ctx.favicoMock = {
      reset : sinon.spy(),
      setImage: sinon.spy(),
      setInstanceState: sinon.spy()
    };
    ctx.pageNameMock = {
      setTitle: sinon.spy()
    };

    runnable.reset(apiMocks.user);
    angular.mock.module('app', function ($provide) {
      $provide.value('favico', ctx.favicoMock);
      $provide.value('pageName', ctx.pageNameMock);
      $provide.value('eventTracking', ctx.eventTracking);
      $provide.value('user', thisUser);
      $provide.factory('fetchStackInfo', fetchStackInfoMock.fetch());
      $provide.factory('fetchInstances', fetchInstancesMock.fetch());
      $provide.factory('fetchInstancesByPod', fetchInstancesByPodMock.fetch());
      $provide.factory('fetchContexts', fetchContextsMock.fetch());
      $provide.factory('createNewInstance', createNewInstanceMock.fetch());
      $provide.value('$log', ctx.$log);
      $provide.value('errs', ctx.errs);
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

    var ca = $controller('EnvironmentController', {
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
      expect($scope).to.have.property('actions');
      expect($scope.actions.deleteServer, 'deleteServer').to.be.ok;
      expect($scope.actions.createAndBuild, 'createAndBuild').to.be.ok;

      expect($scope.data.allDependencies, 'allDependencies').to.not.be.ok;
      var templateInstances = runnable.newInstances(
        [apiMocks.instances.running, apiMocks.instances.stopped],
        {noStore: true}
      );
      templateInstances.githubUsername = 'HelloRunnable';
      fetchInstancesMock.triggerPromise(templateInstances);
      fetchStackInfoMock.triggerPromise(stacks);
      fetchInstancesByPodMock.triggerPromise(ctx.masterPods);
      var sourceContexts = [{
        attrs: 'awesome'
      }];

      sinon.assert.calledWith(ctx.pageNameMock.setTitle, 'Configure - Runnable');
      sinon.assert.calledOnce(ctx.favicoMock.reset);

      fetchContextsMock.triggerPromise(sourceContexts);
      $rootScope.$digest();
      expect($scope.data.allDependencies, 'allDependencies').to.equal(templateInstances);
      // this should now be loaded
      expect($scope.data.instances, 'masterPods').to.equal(ctx.masterPods);
      expect($scope.data.stacks, 'stacks').to.equal(stacks);
      expect($scope.data.sourceContexts).to.equal(sourceContexts);
    });
  });

  describe('actions', function () {
    it('should delete a server', function () {
      setup();
      $rootScope.$digest();
      var instance = runnable.newInstance(
        apiMocks.instances.running,
        {noStore: true}
      );
      instance.destroy = sinon.spy(function (cb) {
        cb();
      });
      sinon.stub(window, 'confirm', function () {
        return true;
      });
      var closePopoverSpy = sinon.spy();
      $rootScope.$on('close-popovers', closePopoverSpy);
      var server = {
        instance: instance
      };
      $scope.actions.deleteServer(server);
      $rootScope.$digest();
      sinon.assert.calledOnce(closePopoverSpy);
      $timeout.flush();
      $rootScope.$digest();
      sinon.assert.calledOnce(window.confirm);
      $rootScope.$digest();
      sinon.assert.calledOnce(instance.destroy);
    });

    it('should create a server', function () {
      setup();
      $rootScope.$digest();
      var instance = runnable.newInstance(
        apiMocks.instances.running,
        {noStore: true}
      );
      var closeModalSpy = sinon.spy();
      $rootScope.$on('close-modal', closeModalSpy);
      $scope.data.instances = {
        add: sinon.spy()
      };
      sinon.stub(thisUser, 'newInstance');
      keypather.set($rootScope, 'dataApp.data.activeAccount', ctx.fakeOrg1);
      var server = {
        instance: instance
      };
      $scope.actions.createAndBuild($q.when(server), 'newName');
      $rootScope.$digest();

      sinon.assert.calledWith(thisUser.newInstance, {
        name: 'newName',
        owner: {
          username: ctx.fakeOrg1.oauthName()
        }
      }, { warn: false });

      sinon.assert.calledOnce($scope.data.instances.add);
      sinon.assert.calledOnce(closeModalSpy);
      sinon.assert.calledOnce(ctx.eventTracking.triggeredBuild);


      createNewInstanceMock.triggerPromise(instance);
      $rootScope.$digest();
    });
  });

  describe('failures', function () {
    it('should fail successfully when it receives a failed promise', function () {
      setup();
      $rootScope.$digest();
      var instance = runnable.newInstance(
        apiMocks.instances.running,
        {noStore: true}
      );
      instance.dealloc = sinon.spy();
      var closeModalSpy = sinon.spy();
      $rootScope.$on('close-modal', closeModalSpy);
      $scope.data.instances = {
        add: sinon.spy()
      };
      thisUser.newInstance = sinon.spy(function () {
        return instance;
      });
      keypather.set($rootScope, 'dataApp.data.activeAccount', ctx.fakeOrg1);

      var error = new Error('Oops');
      $scope.actions.createAndBuild($q.reject(error), 'newName');
      $rootScope.$digest();

      sinon.assert.calledWith(thisUser.newInstance, {
        name: 'newName',
        owner: {
          username: ctx.fakeOrg1.oauthName()
        }
      }, { warn: false });

      sinon.assert.notCalled(createNewInstanceMock.getFetchSpy());
      sinon.assert.calledOnce(ctx.eventTracking.triggeredBuild);
      sinon.assert.calledWith(ctx.errs.handler, error);
      sinon.assert.calledOnce($scope.data.instances.add);
      sinon.assert.calledOnce(closeModalSpy);

      sinon.assert.calledOnce(instance.dealloc);


      $rootScope.$digest();
    });
  });
});
