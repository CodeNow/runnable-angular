'use strict';

var $rootScope;
var $q;
var keypather;
var apiMocks = require('../apiMocks/index');
var runnable = window.runnable;
var fetchInstancesByPodMock = new (require('../fixtures/mockFetch'))();
var createNewInstanceMock = new (require('../fixtures/mockFetch'))();
var createAndBuildNewContainer;

var thisUser = runnable.newUser(apiMocks.user);

describe('createAndBuildNewContainer'.bold.underline.blue, function () {
  describe('factory createAndBuildNewContainer'.bold.underline.blue, function () {
    var mockFetchPlan;
    var mockPlan;
    var ctx = {};
    var errsStub;
    var alertContainerCreatedStub;

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
      mockPlan = {
        next: {
          id: '1234'
        }
      };
      errsStub = {
        report: sinon.stub()
      };

      runnable.reset(apiMocks.user);
      angular.mock.module('app', function ($provide) {
        $provide.value('eventTracking', ctx.eventTracking);
        $provide.factory('fetchUser', function ($q) {
          ctx.fetchUserMock = sinon.stub().returns($q.when(ctx.fakeUser));
          return ctx.fetchUserMock;
        });
        $provide.factory('fetchInstancesByPod', fetchInstancesByPodMock.fetch());
        $provide.factory('createNewInstance', createNewInstanceMock.fetch());
        $provide.factory('alertContainerCreated', function ($q) {
          alertContainerCreatedStub = sinon.stub().returns($q.when());
          return alertContainerCreatedStub;
        });
        $provide.factory('fetchPlan', function ($q) {
          mockFetchPlan = sinon.stub().returns($q.when(mockPlan));
          mockFetchPlan.cache = {
            clear: sinon.stub()
          };
          return mockFetchPlan;
        });
        $provide.value('errs', errsStub);
      });
      angular.mock.inject(function (
        _$rootScope_,
        _$q_,
        _createAndBuildNewContainer_,
        _keypather_
      ) {
        $q = _$q_;
        $rootScope = _$rootScope_;
        $rootScope.$broadcast = sinon.stub();
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
          apiMocks.instances.running.name,
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

        sinon.assert.calledOnce(instances.add);
        sinon.assert.calledOnce(ctx.eventTracking.triggeredBuild);

        mockFetchPlan.reset();
        mockFetchPlan.returns($q.when({next: {id: '5678'}}));
        createNewInstanceMock.triggerPromise(instance);
        $rootScope.$digest();
        sinon.assert.calledOnce(alertContainerCreatedStub);
      });

      it('should create a server with isolation', function () {
        setup();
        $rootScope.$digest();
        var isolation = {
          id: sinon.stub().returns('1234'),
          instances: {
            add: sinon.stub()
          }
        };
        var build = {
          id: 'fakeBuild'
        };
        var fakeServerModal = {
          opts: {
            name: 'newName',
            owner: {
              username: ctx.fakeOrg1.oauthName()
            }
          },
          build: build
        };
        var instance = runnable.newInstance(
          apiMocks.instances.running.name,
          {noStore: true},
          { isolation: isolation }
        );
        var instances = {
          add: sinon.spy()
        };
        ctx.fakeUser.newInstance = sinon.spy(function () {
          return instance;
        });
        keypather.set($rootScope, 'dataApp.data.activeAccount', ctx.fakeOrg1);
        createAndBuildNewContainer($q.when(fakeServerModal), 'newName', {
          isolation: isolation
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

        sinon.assert.calledOnce(ctx.eventTracking.triggeredBuild);

        createNewInstanceMock.triggerPromise(instance);
        $rootScope.$digest();


        sinon.assert.calledOnce(createNewInstanceMock.getFetchSpy());
        sinon.assert.calledWith(createNewInstanceMock.getFetchSpy(), ctx.fakeOrg1, build, {
          name: 'newName',
          owner: {
            username: ctx.fakeOrg1.oauthName()
          },
          isIsolationGroupMaster: false,
          isolated: '1234'
        });
        sinon.assert.calledOnce(isolation.instances.add);
        sinon.assert.calledOnce(isolation.id);
      });
    });

    describe('failures', function () {
      it('should fail successfully when the createPromise fails', function () {
        setup();
        $rootScope.$digest();
        var instance = runnable.newInstance(
          apiMocks.instances.running.name,
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
          apiMocks.instances.running.name,
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
        sinon.assert.calledOnce(ctx.eventTracking.triggeredBuild);

        createNewInstanceMock.triggerPromiseError(error);
        $rootScope.$digest();
      });
    });
  });


  describe('factory alertContainerCreated'.bold.underline.blue, function () {
    var fetchPlanStub;
    var mockPlan;
    var alertContainerCreated;

    beforeEach(function () {
      angular.mock.module('app', function ($provide) {
        mockPlan = {
          next: {
            id: '1234'
          }
        };
        $provide.factory('fetchPlan', function ($q) {
          fetchPlanStub = sinon.stub().returns($q.when(mockPlan));
          fetchPlanStub.cache = {
            clear: sinon.stub()
          };
          return fetchPlanStub;
        });
      });
      angular.mock.inject(function (
        _$rootScope_,
        _$q_,
        _alertContainerCreated_
      ) {
        $q = _$q_;
        $rootScope = _$rootScope_;
        $rootScope.$broadcast = sinon.stub();
        alertContainerCreated = _alertContainerCreated_;
      });
    });

    it('should throw an error if no `oldPlanId` is passed', function () {
      alertContainerCreated()
      .catch(function (err) {
        expect(err).to.exist;
        expect(err.message).to.match(/no.*oldplanid.*supplied/i);
      });
      $rootScope.$digest();
    });

    it('should clear the cache', function () {
      alertContainerCreated('runnable-starter');
      $rootScope.$digest();
      sinon.assert.calledOnce(fetchPlanStub.cache.clear);
    });

    it('should fetch the plan and broadcast the event', function () {
      alertContainerCreated('runnable-starter');
      $rootScope.$digest();
      sinon.assert.calledOnce(fetchPlanStub);
      sinon.assert.calledWith($rootScope.$broadcast, 'alert', {
        type: 'success',
        text: 'Container Created',
        newPlan: true
      });
    });

    it('should pass the right boolean to `newPlan`', function () {
      fetchPlanStub.returns($q.when({ next: { id: 'runnable-starter' } }));
      alertContainerCreated('runnable-starter');
      $rootScope.$digest();
      sinon.assert.calledWith($rootScope.$broadcast, 'alert', {
        type: sinon.match.any,
        text: sinon.match.any,
        newPlan: false
      });

      alertContainerCreated('runnable-standard');
      $rootScope.$digest();
      sinon.assert.calledWith($rootScope.$broadcast, 'alert', {
        type: sinon.match.any,
        text: sinon.match.any,
        newPlan: true
      });
    });
  });
});
