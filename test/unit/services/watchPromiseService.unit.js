'use strict';

var $rootScope;
var $scope;
var $q;
var WatchOnlyOnceConstructor;

describe('watchOnlyOncePromiseService'.bold.underline.blue, function () {
  beforeEach(function () {
    angular.mock.module('app');
    angular.mock.inject(function (
      _$rootScope_,
      _$q_,
      _WatchOnlyOnce_
    ) {
      $q = _$q_;
      $rootScope = _$rootScope_;
      $scope = _$rootScope_.$new();
      WatchOnlyOnceConstructor = _WatchOnlyOnce_;
    });
  });

  it('should then when something is true', function (done) {
    var watcher = new WatchOnlyOnceConstructor($scope);
    watcher.watchPromise('beans', true)
      .then(function (beansValue) {
        expect(beansValue).to.equal('hello');
      })
      .finally(done);
    $scope.beans = 'hello';
    $scope.$digest();
  });
  it('should then when something is false', function (done) {
    $scope.beans = 'hello';
    var watcher = new WatchOnlyOnceConstructor($scope);
    watcher.watchPromise('beans', false)
      .then(function (beansValue) {
        expect(beansValue).to.be.false;
      })
      .finally(done);
    $scope.$digest();
    $scope.beans = false;
    $scope.$digest();
  });
  it('should then when something is undefined', function (done) {
    $scope.beans = 'hello';
    var watcher = new WatchOnlyOnceConstructor($scope);
    watcher.watchPromise('beans')
      .then(function (beansValue) {
        expect(beansValue).to.be.undefined;
      })
      .finally(done);
    $scope.$digest();
    delete $scope.beans;
    $scope.$digest();
  });

  it('should only fire one watcher if set multiple times', function (done) {
    var watcher = new WatchOnlyOnceConstructor($scope);
    watcher.watchPromise('beans', true)
      .then(function () {
        done(new Error('This should not have been called'));
      });
    watcher.watchPromise('beans', true)
      .then(function (beansValue) {
        expect(beansValue).to.equal('hello');
      })
      .finally(done);
    $scope.beans = 'hello';
    $scope.$digest();
  });

  it('multiple watchers should impact each other', function (done) {
    var watcher = new WatchOnlyOnceConstructor($scope);
    var watcher2 = new WatchOnlyOnceConstructor($scope);
    watcher.watchPromise('beans', true)
      .then(function () {
        done(new Error('This should not have been called'));
      });
    watcher2.watchPromise('chicken', true)
      .then(function (chickenValue) {
        expect(chickenValue).to.equal('beans');
        $scope.beans = 'hello';
      });
    watcher.watchPromise('beans', true)
      .then(function (beansValue) {
        expect(beansValue).to.equal('hello');
      })
      .finally(done);
    $scope.chicken = 'beans';
    $scope.$digest();
  });
});
