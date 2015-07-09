'use strict';

var $controller,
    $rootScope,
    $scope,
    $q,
    $timeout;
var keypather;
var apiMocks = require('../apiMocks/index');
var runnable = window.runnable;
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
      [apiMocks.instances.building, apiMocks.instances.runningWithContainers[0]],
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
    ctx.fakeUser = {
      attrs: angular.copy(apiMocks.user),
      oauthName: function () {
        return 'user';
      }
    };
    ctx.favicoMock = {
      reset : sinon.spy(),
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

    ctx.ca = $controller('EnvironmentController', {
      '$scope': $scope,
      '$rootScope': $rootScope
    });
    createMasterPods();
  }


  describe('basics', function () {
    it('should attempt all of the required fetches, plus add its actions to the scope', function () {

      setup();
      $rootScope.$digest();
      expect(ctx.ca).to.have.property('data');
      // this isn't loaded until stacks
      expect(ctx.ca.data).to.not.have.property('instances');
      expect(ctx.ca).to.have.property('state');
      expect(ctx.ca.state).to.have.property('validation');
      expect(ctx.ca.state.validation).to.have.property('env');
      expect(ctx.ca).to.have.property('actions');
      expect(ctx.ca.actions.createAndBuild, 'createAndBuild').to.be.ok;

      expect(ctx.ca.data.allDependencies, 'allDependencies').to.not.be.ok;
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
      expect(ctx.ca.data.allDependencies, 'allDependencies').to.equal(templateInstances);
      // this should now be loaded
      expect(ctx.ca.data.instances, 'masterPods').to.equal(ctx.masterPods);
      expect(ctx.ca.data.stacks, 'stacks').to.equal(stacks);
      expect(ctx.ca.data.sourceContexts).to.equal(sourceContexts);
    });
  });

  describe('actions', function () {

    it('should create a server', function () {
      setup();
      $rootScope.$digest();
      var instance = runnable.newInstance(
        apiMocks.instances.running,
        {noStore: true}
      );
      var closeModalSpy = sinon.spy();
      $rootScope.$on('close-modal', closeModalSpy);
      ctx.ca.data.instances = {
        add: sinon.spy()
      };
      ctx.fakeUser.newInstance = sinon.spy(function () {
        return instance;
      });
      keypather.set($rootScope, 'dataApp.data.user', ctx.fakeUser);
      keypather.set($rootScope, 'dataApp.data.activeAccount', ctx.fakeOrg1);
      var server = {
        instance: instance
      };
      ctx.ca.actions.createAndBuild($q.when(server), 'newName');
      $rootScope.$digest();

      sinon.assert.calledWith(ctx.fakeUser.newInstance, {
        name: 'newName',
        owner: {
          username: ctx.fakeOrg1.oauthName()
        }
      }, { warn: false });

      sinon.assert.calledOnce(ctx.ca.data.instances.add);
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
      ctx.ca.data.instances = {
        add: sinon.spy()
      };
      ctx.fakeUser.newInstance = sinon.spy(function () {
        return instance;
      });
      keypather.set($rootScope, 'dataApp.data.user', ctx.fakeUser);
      keypather.set($rootScope, 'dataApp.data.activeAccount', ctx.fakeOrg1);

      var error = new Error('Oops');
      ctx.ca.actions.createAndBuild($q.reject(error), 'newName');
      $rootScope.$digest();

      sinon.assert.calledWith(ctx.fakeUser.newInstance, {
        name: 'newName',
        owner: {
          username: ctx.fakeOrg1.oauthName()
        }
      }, { warn: false });

      sinon.assert.notCalled(createNewInstanceMock.getFetchSpy());
      sinon.assert.calledOnce(ctx.eventTracking.triggeredBuild);
      sinon.assert.calledWith(ctx.errs.handler, error);
      sinon.assert.calledOnce(ctx.ca.data.instances.add);
      sinon.assert.calledOnce(closeModalSpy);

      sinon.assert.calledOnce(instance.dealloc);


      $rootScope.$digest();
    });
  });
});
