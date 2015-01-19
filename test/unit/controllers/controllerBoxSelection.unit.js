'use strict';

var $controller,
    $scope,
    $window;

describe('controllerBoxSelection'.underline.bold.blue, function () {
  var ctx = {};
  ctx.fakeuser = {
    attrs: angular.copy(mocks.user),
    oauthName: function () {
      return 'user';
    }
  };
  function fetchUserMock (cb) {
    cb(null, ctx.fakeuser);
  };

  var mockUser = {
    fetchInstances: sinon.spy(function(qs, cb) {
      cb();
    }),
    createBuild: sinon.spy(function(qs, cb) {
      cb();
    })
  };

  beforeEach(function() {
    angular.mock.module('app');
    angular.mock.module(function($provide) {
      $provide.value('fetchUser', fetchUserMock);
      $provide.value('$stateParams', {
        userName: 'test',
        repo: 'hello',
        branch: 'world',
        message: 'pants'
      });

      $provide.value('user', mockUser);
    });
    angular.mock.inject(function(
      _$controller_,
      _$window_,
      $rootScope
    ) {
      $controller = _$controller_;
      $window = _$window_;
      $scope = $rootScope.$new();
    });

    $window.heap = null;

    var cbs = $controller('ControllerBoxSelection', {
      '$scope': $scope
    });
  });

  describe('basic init', function() {
    it('initalizes properly', function() {
      $scope.$digest();
      sinon.assert.calledTwice(mockUser.fetchInstances);
      sinon.assert.notCalled(mockUser.createBuild);
      expect($scope.fullRepoName).to.equal('test/hello');
    });

    // Skipping until promises
    it.skip('handles errors properly');
  });

  describe.skip('fork/overwrite', function() {
    it('properly overwrites an instance', function() {
    });
  });
});