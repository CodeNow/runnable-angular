'use strict';

describe('loadingPromises'.bold.underline.blue, function () {
  var loadingPromises;
  var $q;
  var $rootScope;
  function initState () {

    angular.mock.module('app');

    angular.mock.inject(function (_loadingPromises_, _$q_, _$rootScope_) {
      loadingPromises = _loadingPromises_;
      $q = _$q_;
      $rootScope = _$rootScope_;
    });
  }
  beforeEach(initState);

  it('should not have an identity crisis', function () {
    expect(loadingPromises.add).to.be.a('function');
    expect(loadingPromises.clear).to.be.a('function');
    expect(loadingPromises.finished).to.be.a('function');
  });
  describe('basic operations'.bold, function () {
    it('should flow fine', function (done) {
      var cb = null;
      var temp = 1;
      loadingPromises.add('hello', $q(function (resolve) {
        cb = function (hey) {
          resolve(hey);
        };
      }));
      loadingPromises.finished('hello')
        .then(function (length) {
          expect(temp).to.equal(2);
          expect(length).to.deep.equal(1);
          done();
        });
      $rootScope.$apply();
      temp = 2;
      cb('hi');
      $rootScope.$apply();
      $rootScope.$apply();
    });
    it('should clear previous', function (done) {
      var cb = null;
      var temp = 1;
      loadingPromises.add('hello', $q(function (resolve) {
        // never resolve
      }));
      loadingPromises.clear('hello');
      loadingPromises.add('hello', $q(function (resolve) {
        cb = function (hey) {
          resolve(hey);
        };
      }));
      loadingPromises.finished('hello')
        .then(function (length) {
          expect(temp).to.equal(2);
          expect(length).to.deep.equal(1);
          done();
        });
      $rootScope.$apply();
      temp = 2;
      cb('hi');
      $rootScope.$apply();
      $rootScope.$apply();
    });
  });
  describe('Without namespace'.bold, function () {
    it('should just return without adding anything to the hash', function (done) {
      loadingPromises.add(null, $q(function (resolve) {
        resolve();
      }))
        .then(function () {
          // We should not get here
          done();
        });

      $rootScope.$apply();
      $rootScope.$apply();
    });
  });
});
