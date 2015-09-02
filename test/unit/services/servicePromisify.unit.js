'use strict';

var promisify,
    $timeout,
    mockExceptionHandler,
    UserModel = require('runnable/lib/models/user'),
    $rootScope;

describe('servicePromisify'.underline.bold.blue, function () {
  beforeEach(function() {
    mockExceptionHandler = sinon.spy();
    angular.mock.module('app');
    angular.mock.module(function($provide) {
      $provide.value('$exceptionHandler', mockExceptionHandler);
    });
    angular.mock.inject(function(
      _$rootScope_,
      _$timeout_,
      _promisify_
    ) {
      $rootScope = _$rootScope_;
      $timeout = _$timeout_;
      promisify = _promisify_;
    });
  });

  describe('standard promisification'.blue, function() {
    it('promisifies a standard model func', function(done) {
      var model = {
        myFunc: function(cb) {
          cb();
        }
      };
      var promise = promisify(model, 'myFunc')();
      expect(promise.then).to.be.a.Function;
      expect(promise.catch).to.be.a.Function;

      var thenFunc = sinon.spy(function (data) {
        expect(data).to.equal(model);
        done();
      });

      promise.then(function(data) {
        thenFunc(data);
      });

      sinon.assert.notCalled(thenFunc);

      $rootScope.$digest();
      // .then is called, test finishes
    });
    it('rejects a promise when cb is called with an error', function(done) {
      var model = {
        myFunc: function(cb) {
          cb(new Error('Compiler got bored and left'));
        }
      };
      var promise = promisify(model, 'myFunc')();

      var thenFunc = sinon.spy();

      var catchFunc = sinon.spy(function (err) {
        sinon.assert.notCalled(thenFunc);
        expect(err).to.be.an.Error;
        expect(err.message).to.equal('Compiler got bored and left');
        done();
      });

      promise.then(thenFunc);
      promise.catch(catchFunc);

      sinon.assert.notCalled(thenFunc);

      $rootScope.$digest();
    });
    it('returns a cached value when there is one', function(done) {
      var model = {
        fetch: function(cb) {
          $timeout(function () {
            cb();
          }, 100);
          return 'DATUMS';
        }
      };
      var promise = promisify(model, 'fetch')();

      var thenFunc = sinon.spy(function (data) {
        expect(data).to.equal('DATUMS');
        done();
      });

      promise.then(thenFunc);
      $rootScope.$digest();
      $timeout.flush();
    });
    it('resolves early if returnedVal has attrs', function(done) {
      var returnData = {
        attrs: {
          data: 'DATUMS',
          name: 'God-Emperor of Mankind',
          occupation: 'Slayer of xenos'
        }
      };
      var model = {
        fetch: function(cb) {
          return returnData;
        }
      };
      var promise = promisify(model, 'fetch')();

      var thenFunc = sinon.spy(function (data) {
        expect(data).to.equal(returnData);
        done();
      });

      promise.then(thenFunc);
      $rootScope.$digest();
    });
    it('does not resolve early if returnedVal has attrs but isn\'t a fetch', function(done) {
      var returnData = {
        attrs: {
          data: 'DATUMS',
          name: 'God-Emperor of Mankind',
          occupation: 'Slayer of xenos'
        }
      };
      var model = {
        update: function(cb) {
          $timeout(function () {
            returnData.attrs.data = 'NEWNEWNEW';
            cb();
          });
          return returnData;
        }
      };
      var promise = promisify(model, 'update')();

      var thenFunc = sinon.spy(function (data) {
        expect(data).to.equal(returnData);
        expect(data.attrs.data).to.not.equal('DATUMS');
        expect(data.attrs.data).to.equal('NEWNEWNEW');
        done();
      });

      promise.then(thenFunc);
      $rootScope.$digest();
      $timeout.flush();
    });
    it('resolves early if returnedVal has models', function(done) {
      var returnData = {
        models: [{
          data: 'DATUMS',
          name: 'God-Emperor of Mankind'
        }]
      };
      var model = {
        fetch: function(cb) {
          return returnData;
        }
      };
      var promise = promisify(model, 'fetch')();

      var thenFunc = sinon.spy(function (data) {
        expect(data).to.equal(returnData);
        done();
      });

      promise.then(thenFunc);
      $rootScope.$digest();
    });
  });

  describe('errors'.blue, function() {
    it('throws an error if we try to promisify a function that does not exist', function() {
      function throwErr () {
        promisify('a', 'error');
      }
      expect(throwErr).to.throw(Error);
    });
    it('rejects the promise if fn throws an error', function(done) {
      var model = {
        myFunc: function(cb) {
          throw new Error('Compiler got bored and left');
        }
      };
      var promise = promisify(model, 'myFunc')();

      var thenFunc = sinon.spy();

      var catchFunc = sinon.spy(function (err) {
        sinon.assert.notCalled(thenFunc);
        sinon.assert.called(mockExceptionHandler);
        expect(err).to.be.an.Error;
        expect(err.message).to.equal('Compiler got bored and left');
        done();
      });

      promise.then(thenFunc);
      promise.catch(catchFunc);

      sinon.assert.notCalled(thenFunc);

      $rootScope.$digest();
    });
    it('rejects the promise if the method fn doesn\'t exist', function() {
      var Model = function Model () {};
      Model.prototype.myFunc = function(cb) {
        return 1;
      };
      var model = new Model();
      var throwErr = function () {
        return promisify(model, 'methodThatDoesntExist');
      };
      expect(throwErr).to.throw(Error);
    });

  });
});
