'use strict';

var $state, user, fetchInstances, ctx;
describe('serviceFetchInstances'.bold.underline.blue, function () {
  var apiMocks = require('../apiMocks/index');
  var MockQueryAssist = require('../fixtures/mockQueryAssist');
  beforeEach(function () {
    user = {};
    ctx = {};
    MockQueryAssist.clearMocks();
    angular.mock.module('app');
    angular.mock.module(function ($provide) {
      $provide.value('user', user);
      $provide.value('QueryAssist', MockQueryAssist);
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
    var fetchInstancesSpy = sinon.spy(function () {
      return ctx.instanceLists['user'];
    });
    MockQueryAssist.setMock('fetchInstances', fetchInstancesSpy);
    var cb = sinon.spy(function (err, instances, username) {
      sinon.assert.called(fetchInstancesSpy);
      expect(instances).to.equal(ctx.instanceLists['user']);
      expect(username).to.equal('user');
      done();
    });
    fetchInstances('user', false, cb);
  });
  it('should return the correct user with the correct instances when they come out of order', function(done) {
    var userFunction;
    var fetchInstancesUser = sinon.spy(function (cb) {
        userFunction = cb;
    });
    var fetchInstancesOrg = sinon.spy(function(cb) {
      cb(ctx.instanceLists['org1']);
    });
    MockQueryAssist.setMockCallback('fetchInstances', fetchInstancesUser, {
      githubUsername: 'user'
    });
    MockQueryAssist.setMockCallback('fetchInstances', fetchInstancesOrg, {
      githubUsername: 'org1'
    });
    var userCb = sinon.spy(function (err, instances, username) {
    });
    var orgCb = sinon.spy(function (err, instances, username) {
      expect('org1').to.deep.equal(username);
      expect(instances).to.not.deep.equal(ctx.instanceLists['user']);
      expect(instances).to.deep.equal(ctx.instanceLists[username]);
      userFunction(ctx.instanceLists['user']);
      setTimeout(function() {
        sinon.assert.notCalled(userCb);
        done();
      }, 10);
    });
    fetchInstances('user', false, userCb);
    fetchInstances('org1', false, orgCb);
    //userFunction(ctx.instanceLists['user']);

  });
});
