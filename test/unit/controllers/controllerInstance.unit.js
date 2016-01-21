'use strict';

// injector-provided
var $controller,
    $httpBackend,
    $rootScope,
    $scope,
    $state,
    $stateParams,
    $timeout,
    $window,
    OpenItems,
    eventTracking,
    keypather,
    apiClientBridge;
var runnable = window.runnable;
var mockFavico;

var mockUserFetch = new (require('../fixtures/mockFetch'))();

describe('controllerInstance'.bold.underline.blue, function () {
  beforeEach(angular.mock.module('app'));

  beforeEach(function () {
    angular.mock.module(function ($provide) {
      mockFavico = {
        reset : sinon.spy(),
        setInstanceState: sinon.spy()
      }
      $provide.value('favico', mockFavico);
      $provide.factory('fetchUser', mockUserFetch.fetch());
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
      $provide.factory('fetchInstances', fixtures.mockFetchInstances.runningWithExtras({
        contextVersion: {
          appCodeVersions: {
            models: [
              {}
            ]
          }
        }
      }));
      $provide.factory('fetchSettings', function ($q) {
        return function () {
          return $q.when({});
        };
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

  it('basic', function () {

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

    mockUserFetch.triggerPromise(apiClientBridge);
    $rootScope.$digest();

    // mixpanel tracking user visit to instance page
    expect(eventTracking.visitedState.callCount).to.equal(1);
    eventTracking.visitedState.restore();

  });


  describe('instance status', function () {
    var controller;
    beforeEach(function () {
      sinon.stub(OpenItems.prototype, 'removeAllButBuildLogs').returns();
      sinon.stub(OpenItems.prototype, 'removeAllButLogs').returns();
      sinon.stub(OpenItems.prototype, 'restoreTabs').returns();
    });
    beforeEach(function () {
      $scope = $rootScope.$new();
      keypather.set($scope, 'dataApp.actions.setToggled', sinon.spy());
      keypather.set($scope, 'dataApp.data.loading', false);

      controller = $controller('ControllerInstance', {
        '$scope': $scope
      });
      $rootScope.$digest();
    });
    describe('Remove all but build logs', function () {
      it('building', function () {
        keypather.set($scope, 'dataInstance.data.instance', {
          status: sinon.stub().returns('building'),
          id: sinon.stub().returns(1)
        });
        $rootScope.$digest();
        sinon.assert.calledOnce(OpenItems.prototype.removeAllButBuildLogs);
        $timeout.flush();
        sinon.assert.calledOnce(mockFavico.setInstanceState);
      });
      it('buildFailed', function () {
        keypather.set($scope, 'dataInstance.data.instance', {
          status: sinon.stub().returns('buildFailed'),
          id: sinon.stub().returns(1)
        });
        $rootScope.$digest();
        sinon.assert.calledOnce(OpenItems.prototype.removeAllButBuildLogs);
        $timeout.flush();
        sinon.assert.calledOnce(mockFavico.setInstanceState);
      });
      it('neverStarted', function () {
        keypather.set($scope, 'dataInstance.data.instance', {
          status: sinon.stub().returns('neverStarted'),
          id: sinon.stub().returns(1)
        });
        $rootScope.$digest();
        sinon.assert.calledOnce(OpenItems.prototype.removeAllButBuildLogs);
        $timeout.flush();
        sinon.assert.calledOnce(mockFavico.setInstanceState);
      });
    });
    describe('Remove all but logs', function () {
      it('crashed', function () {
        keypather.set($scope, 'dataInstance.data.instance', {
          status: sinon.stub().returns('crashed'),
          id: sinon.stub().returns(1)
        });
        $rootScope.$digest();
        sinon.assert.calledOnce(OpenItems.prototype.removeAllButLogs);
        $timeout.flush();
        sinon.assert.calledOnce(mockFavico.setInstanceState);
      });
      it('stopped', function () {
        keypather.set($scope, 'dataInstance.data.instance', {
          status: sinon.stub().returns('stopped'),
          id: sinon.stub().returns(1)
        });
        $rootScope.$digest();
        sinon.assert.calledOnce(OpenItems.prototype.removeAllButLogs);
        $timeout.flush();
        sinon.assert.calledOnce(mockFavico.setInstanceState);
      });
      it('starting', function () {
        keypather.set($scope, 'dataInstance.data.instance', {
          status: sinon.stub().returns('starting'),
          id: sinon.stub().returns(1)
        });
        $rootScope.$digest();
        sinon.assert.calledOnce(OpenItems.prototype.removeAllButLogs);
        $timeout.flush();
        sinon.assert.calledOnce(mockFavico.setInstanceState);
      });
      it('stopping', function () {
        keypather.set($scope, 'dataInstance.data.instance', {
          status: sinon.stub().returns('stopping'),
          id: sinon.stub().returns(1)
        });
        $rootScope.$digest();
        sinon.assert.calledOnce(OpenItems.prototype.removeAllButLogs);
        $timeout.flush();
        sinon.assert.calledOnce(mockFavico.setInstanceState);
      });
    });
    it('should restore tabs when running', function () {
      keypather.set($scope, 'dataInstance.data.instance', {
        status: sinon.stub().returns('running'),
        id: sinon.stub().returns(1),
        containers: {
          models: [{
            hello: 'hi'
          }]
        }
      });
      $rootScope.$digest();
      sinon.assert.calledOnce(OpenItems.prototype.restoreTabs);
      sinon.assert.calledWith(OpenItems.prototype.restoreTabs, { instanceId: 1 }, {
        hello: 'hi'
      });
      $timeout.flush();
      sinon.assert.calledOnce(mockFavico.setInstanceState);
    });
    it('should ignore status changes when migrating', function () {
      keypather.set($scope, 'dataInstance.data.instance', {
        status: sinon.stub().returns('running'),
        id: sinon.stub().returns(1),
        containers: {
          models: [{
            hello: 'hi'
          }]
        },
        isMigrating: sinon.stub().returns(true)
      });
      $rootScope.$digest();
      sinon.assert.notCalled(OpenItems.prototype.restoreTabs);
      $timeout.flush();
      sinon.assert.notCalled(mockFavico.setInstanceState);
    });
  });
});
