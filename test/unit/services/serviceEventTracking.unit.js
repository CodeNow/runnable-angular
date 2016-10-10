'use strict';

var User = require('@runnable/api-client/lib/models/user');
var apiMocks = require('../apiMocks/index');
var keypather = require('keypather')();

describe.only('serviceEventTracking'.bold.underline.blue, function () {
  var $rootScope;
  var $log;
  var $window;
  var eventTracking;
  var userMock;
  var orgsMock;
  var fetchUserStub;
  var fetchUserUnCachedStub;
  var fetchGrantedGithubOrgsStub;
  var currentOrgMock;
  var currentOrgName = 'Runnable';
  var grantedOrgs = [{}, {}, {}];
  var bigPoppaId = 23423;
  var email = 'jorge@runnable.com';
  var userName = 'thejsj';
  var bigPoppaUser = { id: bigPoppaId, organizations: [{}, {}] };

  beforeEach(function () {
    userMock = {
      toJSON: sinon.stub().returns({
        bigPoppaUser: bigPoppaUser,
        email: email,
        accounts: {
          github: {
            username: userName
          }
        }
      })
    };
    orgsMock = {
      models: grantedOrgs
    };
    angular.mock.module('app', function ($provide) {
      $provide.factory('fetchUser', function ($q) {
        fetchUserStub = sinon.stub().returns($q.when(userMock));
        return fetchUserStub;
      });
      $provide.factory('fetchUserUnCached', function ($q) {
        fetchUserUnCachedStub = sinon.stub().returns($q.when(userMock));
        return fetchUserUnCachedStub;
      });
      $provide.factory('fetchGrantedGithubOrgs', function ($q) {
        fetchGrantedGithubOrgsStub = sinon.stub().returns($q.when(orgsMock));
        return fetchGrantedGithubOrgsStub;
      });
      $provide.factory('currentOrg', function ($q) {
        currentOrgMock = {
          poppa: {
            attrs: {
              creator: 9878,
              name: currentOrgName
            }
          }
        };
        return currentOrgMock;
      });
    });
    angular.mock.inject(function (
      _$rootScope_,
      _$log_,
      _$window_,
      _eventTracking_
    ) {
      $rootScope = _$rootScope_;
      $log = _$log_;
      $window = _$window_;
      eventTracking = _eventTracking_;
      sinon.stub($log, 'error', noop);
      sinon.stub(eventTracking, 'Intercom', noop);
      sinon.stub(eventTracking, '_mixpanel', noop);
    });
  });

  afterEach(function () {
    $log.error.restore();
    eventTracking.Intercom.restore();
    eventTracking._mixpanel.restore();
  });

  it('should stub/assign Intercom SDK instance', function () {
    expect(eventTracking.Intercom).to.be.a('function');
  });

  it('should stub/assign Mixpanel SDK instance', function () {
    expect(eventTracking._mixpanel).to.be.a('function');
  });

  it('should produce an error if attempting to report an event before proper initialization', function () {
    // have not yet invoked eventTracking.boot
    eventTracking.triggeredBuild();
    expect($log.error.callCount).to.equal(1);
    expect($log.error.args[0][0]).to.equal('eventTracking.boot() must be invoked before reporting events');
    $log.error.reset();
    eventTracking.boot(new User(angular.copy(apiMocks.user)));
    eventTracking.triggeredBuild();
    expect($log.error.callCount).to.equal(0);
  });

  it('should have universal event data', function () {
    eventTracking.boot(new User(angular.copy(apiMocks.user)));
    eventTracking.triggeredBuild();
    expect(eventTracking.Intercom.callCount).to.equal(2);
    expect(eventTracking._mixpanel.callCount).to.equal(4);
    expect(eventTracking.Intercom.args[1][1]).to.equal('triggered-build');
    expect(eventTracking._mixpanel.args[3][1]).to.equal('triggered-build');
    // both analytics SDK event reporting methods should be passed same event data
    expect(eventTracking.Intercom.args[1][2]).to.deep.equal(eventTracking._mixpanel.args[3][2]);
    expect(Object.keys(eventTracking.Intercom.args[1][2])).to.contain('state');
    expect(Object.keys(eventTracking.Intercom.args[1][2])).to.contain('href');
  });

  describe('updateCurrentPersonProfile', function () {
    var step = 1;

    it('should fetch the user', function () {
      eventTracking.updateCurrentPersonProfile(step);
      sinon.assert.calledOnce(fetchUserUnCachedStub);
    });

    it('should fetch the granted orgs', function () {
      eventTracking.updateCurrentPersonProfile(step);
      sinon.assert.calledOnce(fetchGrantedGithubOrgsStub);
    });

    it('should set the person in mixpanel', function () {
      eventTracking.updateCurrentPersonProfile(step);
      $rootScope.$digest();
      sinon.assert.calledOnce(eventTracking._mixpanel);
      sinon.assert.calledWithExactly(eventTracking._mixpanel, 'people.set', {
        'bigPoppaId': bigPoppaId,
        'userName': userName,
        'email': email,
        'FurthestStep': step,
        'CurrentOrg': currentOrgName,
        'IsFirstUser': false,
        'IsCreatorOfCurrentOrg': false,
        'IsCreatorOfWaitingOrg': false,
        'IsWaitingForOrg': false,
        'NumberOfOrgs': bigPoppaUser.organizations.length,
        'NumberOfOrgsWithGrantedAccess': grantedOrgs.length,
        'NumberOfOrgsWhereCreator': 0,
        'HasAnyOrgCompletedAha': sinon.match.bool
      });
    });

    it('should set `HasAnyOrgCompletedAha` if any org has completed the aha guide', function () {
      bigPoppaUser.organizations = [{ metadata: { hasAha: false } }, { metadata: { hasAha: true } }];

      eventTracking.updateCurrentPersonProfile(step);
      $rootScope.$digest();
      sinon.assert.calledOnce(eventTracking._mixpanel);
      sinon.assert.calledWithExactly(eventTracking._mixpanel, 'people.set', {
        'bigPoppaId': bigPoppaId,
        'userName': userName,
        'email': email,
        'FurthestStep': step,
        'CurrentOrg': currentOrgName,
        'IsFirstUser': false,
        'IsCreatorOfCurrentOrg':  false,
        'IsCreatorOfWaitingOrg': false,
        'IsWaitingForOrg': false,
        'NumberOfOrgs': bigPoppaUser.organizations.length,
        'NumberOfOrgsWithGrantedAccess': grantedOrgs.length,
        'NumberOfOrgsWhereCreator': 0,
        'HasAnyOrgCompletedAha': true
      });
    });

    it('should not set `HasAnyOrgCompletedAha` if no orgs have completed the aha guide', function () {
      bigPoppaUser.organizations = [{ metadata: { hasAha: true } }, { metadata: { hasAha: true } }];

      eventTracking.updateCurrentPersonProfile(step);
      $rootScope.$digest();
      sinon.assert.calledOnce(eventTracking._mixpanel);
      sinon.assert.calledWithExactly(eventTracking._mixpanel, 'people.set', {
        'bigPoppaId': bigPoppaId,
        'userName': userName,
        'email': email,
        'FurthestStep': step,
        'CurrentOrg': currentOrgName,
        'IsFirstUser': false,
        'IsCreatorOfCurrentOrg': false,
        'IsCreatorOfWaitingOrg': false,
        'IsWaitingForOrg': false,
        'NumberOfOrgs': bigPoppaUser.organizations.length,
        'NumberOfOrgsWithGrantedAccess': grantedOrgs.length,
        'NumberOfOrgsWhereCreator': 0,
        'HasAnyOrgCompletedAha': false
      });
    });
  });
});
