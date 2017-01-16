/*global fixtures:true, host:true, mocks:true */
'use strict';

// injector-provided
var $controller;
var $httpBackend;
var $rootScope;
var $scope;
var $state;
var $stateParams;
var $timeout;
var $window;
var OpenItems;
var eventTracking;
var keypather;
var apiClientBridge;
var mockFavico;
var instance;
var container;
var commitHash;
var dockerfile;
var getCommitForCurrentlyBuildingBuild;
var fetchDockerfileForContextVersionStub;
var q;

describe('controllerInstance'.bold.underline.blue, function () {
  beforeEach(angular.mock.module('app'));

  beforeEach(function () {
    container = {
      hello: 'hi',
      running: sinon.stub()
    };
    commitHash = 'asdfasdfasdf1234234';
    dockerfile = {};
    instance = {
      id: sinon.stub().returns(1),
      hasDockerfileMirroring: sinon.stub().returns(false),
      attrs: {
        name: 'hello'
      },
      containers: {
        models: [container]
      },
      contextVersion: {
        appCodeVersions: {
          models: [
            {
              commit: commitHash
            }
          ]
        }
      },
      status: sinon.stub().returns('building'),
      on: sinon.stub()
    };
    window.helpers.killDirective('ahaSidebar');
    angular.mock.module(function ($provide) {
      mockFavico = {
        reset : sinon.spy(),
        setInstanceState: sinon.spy()
      };
      $provide.value('ahaGuide', {
        isAddingFirstRepo: sinon.stub().returns(false),
        getCurrentStep: sinon.stub().returns(1),
        isInGuide: sinon.stub().returns(true),
        isPersonalAccount: sinon.stub().returns(false),
        steps: {
          ADD_FIRST_BRANCH: 123
        }
      });
      $provide.value('instancesByPod', {
        models: []
      });
      $provide.value('favico', mockFavico);
      $provide.factory('fetchUser', function ($q) {
        return function () {
          return $q.when({});
        };
      });
      $provide.factory('setLastInstance', function () {
        return sinon.stub();
      });
      $provide.factory('fetchDockerfileForContextVersion', function ($q) {
        fetchDockerfileForContextVersionStub = sinon.stub().returns($q.when(dockerfile));
        return fetchDockerfileForContextVersionStub;
      });
      $provide.factory('fetchCommitData', function () {
        return {
          activeCommit: sinon.spy(function () {
            return {
              attrs: {
                commit: {
                  message: 'hello',
                  html_url: 'asdasd'
                }
              }
            };
          })
        };
      });
      $provide.factory('fetchInstances', function () {
        return sinon.stub().returns(instance);
      });
      $provide.factory('fetchSettings', function ($q) {
        return sinon.stub().returns($q.when({}));
      });
      $provide.factory('getCommitForCurrentlyBuildingBuild', function ($q) {
        q = $q;
        getCommitForCurrentlyBuildingBuild = sinon.stub().returns($q.when(false));
        return getCommitForCurrentlyBuildingBuild;
      });
    });
    angular.mock.inject(function (
      _$controller_,
      _$httpBackend_,
      _$rootScope_,
      _$stateParams_,
      _$state_,
      _$window_,
      _OpenItems_,
      _eventTracking_,
      _keypather_,
      _apiClientBridge_,
      _$timeout_
    ) {
      $controller = _$controller_;
      $httpBackend = _$httpBackend_;
      $rootScope = _$rootScope_;
      $state = _$state_;
      $stateParams = _$stateParams_;
      $window = _$window_;
      OpenItems = _OpenItems_;
      eventTracking = _eventTracking_;
      keypather = _keypather_;
      apiClientBridge = _apiClientBridge_;
      $timeout = _$timeout_;
    });
  });

  beforeEach(function () {
    /**
     * API Requests
     * - GET branches
     * - GET commit
     * - GET commitOffset
     * - GET commits
     */

    var userUrl = host + '/users/me?';
    $httpBackend
      .whenGET(userUrl)
      .respond(mocks.user);

    var branchesUrl = host + '/github/repos/cflynn07/bitcoin/branches?per_page=100';
    $httpBackend
      .expectGET(branchesUrl)
      .respond(mocks.branches.bitcoinRepoBranches);

    var commitUrl = host + '/github/repos/cflynn07/bitcoin/commits/1f27c310a4bcca758f708358601fa25976d56d90?';
    $httpBackend
      .expectGET(commitUrl)
      .respond(mocks.commit.bitcoinRepoCommit1);

    var commitOffsetUrl = host + '/github/repos/cflynn07/bitcoin/compare/master...1f27c310a4bcca758f708358601fa25976d56d90';
    $httpBackend
      .expectGET(commitOffsetUrl)
      .respond(mocks.commitCompare.zeroBehind);

    var commitsUrl = host + '/github/repos/cflynn07/bitcoin/commits?sha=master&per_page=100';
    $httpBackend
      .expectGET(commitsUrl)
      .respond(mocks.gh.bitcoinRepoCommits);
  });

  it('Basic', function () {

    sinon.spy(eventTracking, 'visitedState');

    var $scope = $rootScope.$new();
    keypather.set($scope, 'dataApp.actions.setToggled', sinon.spy());
    keypather.set($scope, 'dataApp.data.loading', false);

    $controller('ControllerInstance', {
      '$scope': $scope
    });
    $rootScope.$digest();

    expect($scope).to.have.property('dataInstance');
    expect($scope).to.have.deep.property('dataInstance.actions');
    expect($scope).to.have.deep.property('dataInstance.data');
    expect($scope).to.have.deep.property('dataInstance.data.openItems');
    expect($scope).to.have.deep.property('dataInstance.data.saving');

    $scope.$apply();

    // mixpanel tracking user visit to instance page
    expect(eventTracking.visitedState.callCount).to.equal(1);
    eventTracking.visitedState.restore();

  });

  it('Dockerfile mirroring', function () {
    instance.hasDockerfileMirroring.returns(true);
    instance.status.returns('buildFailed');

    var $scope = $rootScope.$new();
    $controller('ControllerInstance', {
      '$scope': $scope
    });
    $rootScope.$digest();

    sinon.assert.calledOnce(fetchDockerfileForContextVersionStub);
    sinon.assert.calledWith(fetchDockerfileForContextVersionStub, instance.contextVersion);
    expect(instance.mirroredDockerfile).to.equal(dockerfile);

    $scope.$apply();
  });

  describe('instance status', function () {
    beforeEach(function () {
      sinon.stub(OpenItems.prototype, 'removeAllButBuildLogs').returns();
      sinon.stub(OpenItems.prototype, 'removeAllButLogs').returns();
      sinon.stub(OpenItems.prototype, 'restoreTabs').returns();
    });
    beforeEach(function () {
      $scope = $rootScope.$new();
      keypather.set($scope, 'dataApp.actions.setToggled', sinon.spy());
      keypather.set($scope, 'dataApp.data.loading', false);

      $controller('ControllerInstance', {
        '$scope': $scope
      });
    });
    describe('Check for building containers', function () {
      it('should check if there is a currently building build', function () {
        $rootScope.$digest();
        sinon.assert.calledOnce(getCommitForCurrentlyBuildingBuild);
        sinon.assert.calledWith(getCommitForCurrentlyBuildingBuild, instance);
      });
      it('should not set the commit if there is no commit returned', function () {
        var newCommitHash = '23423234';
        getCommitForCurrentlyBuildingBuild.returns(q.when(newCommitHash));
        $rootScope.$digest();
        sinon.assert.calledOnce(getCommitForCurrentlyBuildingBuild);
        sinon.assert.calledWith(getCommitForCurrentlyBuildingBuild, instance);
        expect($scope.dataInstance.data.commit).to.equal(newCommitHash);
        expect($scope.dataInstance.data.showUpdatingMessage).to.equal(true);
      });
      it('should set the commit if there is aa commit returned', function () {
        var newCommitHash = false;
        getCommitForCurrentlyBuildingBuild.returns(q.when(newCommitHash));
        $rootScope.$digest();
        sinon.assert.calledOnce(getCommitForCurrentlyBuildingBuild);
        sinon.assert.calledWith(getCommitForCurrentlyBuildingBuild, instance);
        expect($scope.dataInstance.data.commit).to.equal(undefined);
        expect($scope.dataInstance.data.showUpdatingMessage).to.equal(undefined);
      });
    });
    describe('Remove all but build logs', function () {
      it('building', function () {
        instance.status = sinon.stub().returns('building');
        $rootScope.$digest();
        sinon.assert.calledOnce(OpenItems.prototype.removeAllButBuildLogs);
        $timeout.flush();
        sinon.assert.calledOnce(mockFavico.setInstanceState);
      });
      it('buildFailed', function () {
        instance.status = sinon.stub().returns('buildFailed');
        $rootScope.$digest();
        sinon.assert.calledOnce(OpenItems.prototype.removeAllButBuildLogs);
        $timeout.flush();
        sinon.assert.calledOnce(mockFavico.setInstanceState);
      });
      it('neverStarted', function () {
        instance.status = sinon.stub().returns('neverStarted');
        $rootScope.$digest();
        sinon.assert.calledOnce(OpenItems.prototype.removeAllButBuildLogs);
        $timeout.flush();
        sinon.assert.calledOnce(mockFavico.setInstanceState);
      });
      it('isTesting and running', function () {
        instance.attrs.isTesting = true;
        $rootScope.$digest();
        instance.status = sinon.stub().returns('running');
        $rootScope.$digest();
        sinon.assert.calledOnce(OpenItems.prototype.removeAllButBuildLogs);
        $timeout.flush();
        // Called twice because we digested twice...
        sinon.assert.calledTwice(mockFavico.setInstanceState);
      });
    });
    describe('Remove all but logs', function () {
      it('crashed', function () {
        instance.status = sinon.stub().returns('crashed');
        sinon.assert.notCalled(OpenItems.prototype.removeAllButLogs);
        $rootScope.$digest();
        sinon.assert.calledOnce(OpenItems.prototype.removeAllButLogs);
        $timeout.flush();
        sinon.assert.calledOnce(mockFavico.setInstanceState);
      });
      it('stopped', function () {
        instance.status = sinon.stub().returns('stopped');
        sinon.assert.notCalled(OpenItems.prototype.removeAllButLogs);
        $rootScope.$digest();
        sinon.assert.calledOnce(OpenItems.prototype.removeAllButLogs);
        $timeout.flush();
        sinon.assert.calledOnce(mockFavico.setInstanceState);
      });
      it('starting', function () {
        instance.status = sinon.stub().returns('starting');
        sinon.assert.notCalled(OpenItems.prototype.removeAllButLogs);
        $rootScope.$digest();
        sinon.assert.calledOnce(OpenItems.prototype.removeAllButLogs);
        $timeout.flush();
        sinon.assert.calledOnce(mockFavico.setInstanceState);
      });
      it('stopping', function () {
        instance.status = sinon.stub().returns('stopping');
        $rootScope.$digest();
        sinon.assert.calledOnce(OpenItems.prototype.removeAllButLogs);
        $timeout.flush();
        sinon.assert.calledOnce(mockFavico.setInstanceState);
      });
    });
    it('should restore tabs when running', function () {
      instance.status = sinon.stub().returns('running');
      $rootScope.$digest();
      sinon.assert.calledOnce(OpenItems.prototype.restoreTabs);
      sinon.assert.calledWith(OpenItems.prototype.restoreTabs, { instanceId: 1 }, container);
      $timeout.flush();
      sinon.assert.calledOnce(mockFavico.setInstanceState);
    });
    it('should ignore status changes when migrating', function () {
      instance.status = sinon.stub().returns('running');
      instance.isMigrating = sinon.stub().returns(true);
      $rootScope.$digest();
      sinon.assert.notCalled(OpenItems.prototype.restoreTabs);
      $timeout.flush();
      sinon.assert.notCalled(mockFavico.setInstanceState);
    });
  });
});
