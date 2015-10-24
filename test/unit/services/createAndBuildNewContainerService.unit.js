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
var createNewInstanceMock = new (require('../fixtures/mockFetch'))();
var createAndBuildNewContainer;
var helpCardsMock = require('../apiMocks/HelpCardServiceMock');

var thisUser = runnable.newUser(apiMocks.user);

describe('createAndBuildNewContainer'.bold.underline.blue, function () {
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
      $provide.value('eventTracking', ctx.eventTracking);
      $provide.factory('fetchUser', function ($q) {
        ctx.fetchUserMock = sinon.stub().returns($q.when(ctx.fakeUser));
        return ctx.fetchUserMock;
      });
      $provide.factory('helpCards', helpCardsMock.create(ctx));
      $provide.factory('fetchInstancesByPod', fetchInstancesByPodMock.fetch());
      $provide.factory('createNewInstance', createNewInstanceMock.fetch());
      $provide.value('errs', ctx.errs);
    });
    angular.mock.inject(function (
      _$rootScope_,
      _$q_,
      _createAndBuildNewContainer_,
      _keypather_
    ) {
      $q = _$q_;
      $rootScope = _$rootScope_;
      createAndBuildNewContainer = _createAndBuildNewContainer_;
      keypather = _keypather_;
    });

    createMasterPods();
  }

  describe('success', function () {
    it('should create a server', function () {
      setup();
      $rootScope.$digest();
      var instance = runnable.newInstance(
        apiMocks.instances.running,
        {noStore: true}
      );
      var instances = {
        add: sinon.spy()
      };
      ctx.fakeUser.newInstance = sinon.spy(function () {
        return instance;
      });
      keypather.set($rootScope, 'dataApp.data.activeAccount', ctx.fakeOrg1);
      var server = {
        instance: instance
      };
      createAndBuildNewContainer($q.when(server), 'newName');
      $rootScope.$digest();

      fetchInstancesByPodMock.triggerPromise(instances);
      $rootScope.$digest();

      sinon.assert.calledWith(ctx.fakeUser.newInstance, {
        name: 'newName',
        owner: {
          username: ctx.fakeOrg1.oauthName()
        }
      }, { warn: false });

      sinon.assert.calledOnce(ctx.helpCards.hideActiveCard);
      sinon.assert.calledOnce(instances.add);
      sinon.assert.calledOnce(ctx.eventTracking.triggeredBuild);

      createNewInstanceMock.triggerPromise(instance);
      $rootScope.$digest();
      sinon.assert.calledOnce(ctx.helpCards.refreshAllCards);
    });
  });

  describe('failures', function () {
    it('should fail successfully when the createPromise fails', function () {
      setup();
      $rootScope.$digest();
      var instance = runnable.newInstance(
        apiMocks.instances.running,
        {noStore: true}
      );
      instance.dealloc = sinon.spy();
      var instances = {
        add: sinon.spy()
      };
      ctx.fakeUser.newInstance = sinon.spy(function () {
        return instance;
      });
      keypather.set($rootScope, 'dataApp.data.activeAccount', ctx.fakeOrg1);

      var error = new Error('Oops');
      createAndBuildNewContainer($q.reject(error), 'newName');
      $rootScope.$digest();

      fetchInstancesByPodMock.triggerPromise(instances);
      $rootScope.$digest();
      sinon.assert.calledWith(ctx.fakeUser.newInstance, {
        name: 'newName',
        owner: {
          username: ctx.fakeOrg1.oauthName()
        }
      }, { warn: false });


      sinon.assert.calledOnce(ctx.fakeUser.newInstance);
      sinon.assert.calledOnce(instances.add);

      sinon.assert.notCalled(createNewInstanceMock.getFetchSpy());
      sinon.assert.calledOnce(ctx.eventTracking.triggeredBuild);
    });
    it('should fail successfully the createNewInstance promise fails', function (done) {
      setup();
      $rootScope.$digest();
      var instance = runnable.newInstance(
        apiMocks.instances.running,
        {noStore: true}
      );
      sinon.stub(instance, 'dealloc');
      var instances = {
        add: sinon.spy()
      };
      ctx.fakeUser.newInstance = sinon.spy(function () {
        return instance;
      });
      keypather.set($rootScope, 'dataApp.data.activeAccount', ctx.fakeOrg1);
      var server = {
        instance: instance
      };
      var error = new Error('Oops');

      createAndBuildNewContainer($q.when(server), 'newName')
        .catch(function (err) {
          sinon.assert.notCalled(ctx.helpCards.refreshAllCards);
          expect(err).to.equal(error);
          sinon.assert.calledOnce(instance.dealloc);
          done();
        });
      $rootScope.$digest();

      fetchInstancesByPodMock.triggerPromise(instances);
      $rootScope.$digest();
      sinon.assert.calledWith(ctx.fakeUser.newInstance, {
        name: 'newName',
        owner: {
          username: ctx.fakeOrg1.oauthName()
        }
      }, { warn: false });

      sinon.assert.calledOnce(instances.add);
      sinon.assert.calledOnce(ctx.helpCards.hideActiveCard);
      sinon.assert.calledOnce(ctx.eventTracking.triggeredBuild);

      createNewInstanceMock.triggerPromiseError(error);
      $rootScope.$digest();
    });
  });
});
