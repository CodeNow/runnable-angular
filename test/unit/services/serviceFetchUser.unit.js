'use strict';

describe('serviceFetchUser'.bold.underline.blue, function () {
  var $state, user, fetchUser;
  beforeEach(function () {
    user = {};
    angular.mock.module('app');
    angular.mock.module(function ($provide) {
      $provide.value('user', user);
    });
    angular.mock.inject(function (_fetchUser_, _$state_) {
      $state = _$state_;
      fetchUser = _fetchUser_;
    });
  });

  it('Fetches the user if it has not done so yet', function(done) {
    user.fetchUser = sinon.spy(function (str, innerCb) {
      // You're so vain you probably think this expect is about you
      expect(str).to.equal('me');
      setTimeout(innerCb, 10);
      return {
        name: 'user'
      };
    });
    var cb = sinon.spy(function () {
      sinon.assert.called(user.fetchUser);
      sinon.assert.calledWith(cb, undefined, {
        name: 'user'
      });
      done();
    });
    fetchUser(cb);
  });

  it('passes errors through', function(done) {
    user.fetchUser = sinon.spy(function (str, cb) {
      expect(str).to.equal('me');
      cb('BAD!');
    });
    var cb = sinon.spy(function () {
      sinon.assert.called(user.fetchUser);
      sinon.assert.calledWith(cb, 'BAD!', undefined);
      done();
    });
    fetchUser(cb);
  });

  it('calls back from the cache if there is one', function (done) {
    user.fetchUser = sinon.spy(function (str, innerCb) {
      expect(str).to.equal('me');
      setTimeout(innerCb, 10);
      return {
        name: 'user'
      };
    });
    var cbOne = sinon.spy(function () {
      sinon.assert.called(user.fetchUser);
      sinon.assert.calledWith(cbOne, undefined, {
        name: 'user'
      });
      fetchUser(cbTwo);
    });
    fetchUser(cbOne);
    var cbTwo = sinon.spy(function() {
      sinon.assert.calledOnce(user.fetchUser);
      sinon.assert.calledWith(cbOne, undefined, {
        name: 'user'
      });
      done();
    });
  });

  it('sends the user home if they are not logged in', function(done) {
    user.fetchUser = sinon.spy(function (str, cb) {
      expect(str).to.equal('me');
      cb({
        data: {
          statusCode: 401
        }
      });
    });
    sinon.stub($state, 'go');

    var cb = sinon.spy(function () {
      sinon.assert.called(user.fetchUser);
      sinon.assert.calledWith(cb, {
        data: {
          statusCode: 401
        }
      });
      sinon.assert.calledWith($state.go, 'home');
      done();
    });
    fetchUser(cb);
  });
});
