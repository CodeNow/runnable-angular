'use strict';

// injector-provided
var async,
    $controller,
    $httpBackend,
    keypather,
    OpenItems,
    $scope,
    $rootScope,
    $state,
    $stateParams,
    user;

describe('controllerInstance'.bold.underline.blue, function () {
  var ctx = {};

  beforeEach(angular.mock.module('app'));

  beforeEach(function () {
    angular.mock.module(function ($provide) {
      $provide.value('favico', {
        reset : sinon.spy(),
        setImage: sinon.spy(),
        setInstanceState: sinon.spy()
      });
      $provide.factory('pFetchUser', fixtures.mockFetchUser);
      $provide.factory('fetchInstances', fixtures.mockFetchInstances.running);
    });
    angular.mock.inject(function (
      _async_,
      _$controller_,
      _$httpBackend_,
      _keypather_,
      _OpenItems_,
      _$rootScope_,
      _$state_,
      _$stateParams_,
      _user_
    ) {
      async = _async_;
      $controller = _$controller_;
      $httpBackend = _$httpBackend_;
      keypather = _keypather_;
      OpenItems = _OpenItems_;
      $rootScope = _$rootScope_;
      $state = _$state_;
      $stateParams = _$stateParams_;
      user = _user_;
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

    var $scope = $rootScope.$new();

    var ci = $controller('ControllerInstance', {
      '$scope': $scope
    });
    $rootScope.$digest();

    expect($scope).to.have.property('dataInstance');
    expect($scope).to.have.deep.property('dataInstance.actions');
    expect($scope).to.have.deep.property('dataInstance.data');
    expect($scope).to.have.deep.property('dataInstance.data.openItems');
    expect($scope).to.have.deep.property('dataInstance.data.saving');
    expect($scope).to.have.deep.property('dataInstance.data.showExplorer');
    expect($scope).to.have.deep.property('dataInstance.data.sectionClasses');

    $scope.$apply();

  });

});
