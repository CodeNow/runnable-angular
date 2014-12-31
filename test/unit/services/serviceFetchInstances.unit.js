var $state, user, fetchInstances, ctx;
describe('serviceFetchUser'.bold.underline.blue, function () {
  var apiMocks = require('../apiMocks/index');
  beforeEach(function () {
    user = {};
    ctx = {};
    angular.mock.module('app');
    angular.mock.module(function ($provide) {
      $provide.value('user', user);
      $provide.value('fetchUser', function(cb) {
        cb(null, user);
      });
    });
    angular.mock.inject(function (_fetchInstances_, _$state_) {
      $state = _$state_;
      fetchInstances = _fetchInstances_;
    });
    ctx.fakeuser = {
      attrs: angular.copy(apiMocks.user),
      oauthName: function () {
        return 'user';
      }
    };
    ctx.fakeOrg1 = {
      attrs: angular.copy(apiMocks.user),
      oauthName: function () {
        return 'org1';
      }
    };
    ctx.fakeOrg2 = {
      attrs: angular.copy(apiMocks.user),
      oauthName: function () {
        return 'org2';
      }
    };

    ctx.userList = {
      user: ctx.fakeuser,
      org1: ctx.fakeOrg1,
      org2: ctx.fakeOrg2
    };

    ctx.instanceLists = {
      user: {
        models: [{
          attrs: angular.copy(apiMocks.instances.running)
        }, {
          attrs: angular.copy(apiMocks.instances.stopped)
        }]
      },
      org1: {
        models: [{
          attrs: angular.copy(apiMocks.instances.building)
        }]
      },
      org2: {
        models: []
      }
    };
  });

  /**
   * Things to check
   *
   * Make sure forceQuery works
   * Make sure it always performs the query when changing active accounts
   *
   */

  it('should fetch the instances the first time', function(done) {
    user.fetchInstances = sinon.spy(function (opts, innerCb) {
      expect(opts).to.deep.equal({
        githubUsername: 'user'
      });
      setTimeout(innerCb, 10);
      return ctx.instanceLists['user'];
    });
    var cb = sinon.spy(function (err, instances, username) {
      sinon.assert.called(user.fetchInstances);
      expect(instances).to.equal(ctx.instanceLists['user']);
      expect(username).to.equal('user');
      done();
    });
    fetchInstances('user', false, cb);
  });
  it('should use its own cache when refetching', function(done) {
    user.fetchInstances = sinon.spy(function (opts, innerCb) {
      expect(opts).to.deep.equal({
        githubUsername: 'user'
      });
      setTimeout(innerCb, 10);
      return ctx.instanceLists['user'];
    });
    var cb = sinon.spy(function (err, instances, username) {
      sinon.assert.calledOnce(user.fetchInstances);

      expect(instances).to.equal(ctx.instanceLists['user']);
      expect(username).to.equal('user');
      part2();
    });
    fetchInstances('user', false, cb);
    function part2() {
      user.fetchInstances = sinon.spy(function (opts, innerCb) {
        innerCb(null, ctx.instanceLists['user'], 'user');
      });
      cb = sinon.spy(function (err, instances, username) {
        sinon.assert.notCalled(user.fetchInstances);
        expect(instances).to.equal(ctx.instanceLists['user']);
        expect(username).to.equal('user');
        done();
      });
      fetchInstances('user', false, cb);
    }
  });
  it('should skip its own cache when forced', function(done) {
    user.fetchInstances = sinon.spy(function (opts, innerCb) {
      expect(opts).to.deep.equal({
        githubUsername: 'user'
      });
      setTimeout(innerCb, 10);
      return ctx.instanceLists['user'];
    });
    var cb = sinon.spy(function (err, instances, username) {
      sinon.assert.calledOnce(user.fetchInstances);

      expect(instances).to.equal(ctx.instanceLists['user']);
      expect(username).to.equal('user');
      part2();
    });
    fetchInstances('user', false, cb);
    function part2() {
      user.fetchInstances = sinon.spy(function (opts, innerCb) {
        innerCb(null, ctx.instanceLists['user'], 'user');
      });
      cb = sinon.spy(function (err, instances, username) {
        sinon.assert.calledOnce(user.fetchInstances);
        expect(instances).to.equal(ctx.instanceLists['user']);
        expect(username).to.equal('user');
        done();
      });
      fetchInstances('user', true, cb);
    }
  });
  it('should return the correct user with the correct instances when they come out of order', function(done) {
    var cb1, cb2;
    var isUser = true;
    user.fetchInstances = sinon.spy(function (opts, innerCb) {
      if (opts.githubUsername === 'user') {
        expect(isUser).to.be.true;
        isUser = false;
        cb1 = innerCb;
      } else {
        expect(isUser).to.be.false;
        cb2 = innerCb;
      }
      return ctx.instanceLists[opts.githubUsername];
    });
    var doneCb = sinon.spy(function (err, instances, username) {
    });
    var doneCb2 = sinon.spy(function (err, instances, username) {
      sinon.assert.notCalled(doneCb);
      expect('org1').to.deep.equal(username);
      expect(instances).to.not.deep.equal(ctx.instanceLists['user']);
      expect(instances).to.deep.equal(ctx.instanceLists[username]);
      done();
    });
    fetchInstances('user', false, doneCb);
    fetchInstances('org1', false, doneCb2);
    cb2();
    cb1();
  });
});