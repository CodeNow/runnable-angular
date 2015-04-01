'use strict';

// var User = require('runnable/lib/models/user');
// var apiMocks = require('../apiMocks/index');
// var keypather = require('keypather')();

// describe('serviceEventTracking'.bold.underline.blue, function () {

//   var $log;
//   var eventTracking;

//   function initState () {
//     angular.mock.module('app', function ($provide) {
//     });
//     angular.mock.inject(function (
//       _$log_,
//       _eventTracking_
//     ) {
//       $log = _$log_;
//       eventTracking = _eventTracking_;
//       sinon.stub($log, 'error', noop);
//     });
//   }

//   function tearDownState () {
//     $log.error.restore();
//     keypather.get(eventTracking, '_Intercom.restore()');
//     keypather.get(eventTracking, '_mixpanel.restore()');
//   }

//   beforeEach(initState);
//   afterEach(tearDownState);

//   it('should stub/assign Intercom SDK instance', function () {
//     expect(eventTracking._Intercom).to.be.a('function');
//   });

//   it('should stub/assign Mixpanel SDK instance', function () {
//     expect(eventTracking._mixpanel).to.be.a('function');
//   });

//   it('should produce an error if attempting to report an event before proper initialization', function () {
//     // have not yet invoked eventTracking.boot
//     eventTracking.triggeredBuild();
//     expect($log.error.callCount).to.equal(1);
//     expect($log.error.args[0][0]).to.equal('eventTracking.boot() must be invoked before reporting events');
//     $log.error.reset();
//     eventTracking.boot(new User(angular.copy(apiMocks.user)));
//     eventTracking.triggeredBuild();
//     expect($log.error.callCount).to.equal(0);
//   });

//   it('should have universal event data', function () {
//     sinon.stub(eventTracking, '_Intercom', noop);
//     sinon.stub(eventTracking, '_mixpanel', noop);
//     eventTracking.boot(new User(angular.copy(apiMocks.user)));
//     eventTracking.triggeredBuild();
//     expect(eventTracking._Intercom.callCount).to.equal(2);
//     expect(eventTracking._mixpanel.callCount).to.equal(3);
//     expect(eventTracking._Intercom.args[1][1]).to.equal('triggered-build');
//     expect(eventTracking._mixpanel.args[2][1]).to.equal('triggered-build');
//     // both analytics SDK event reporting methods should be passed same event data
//     expect(eventTracking._Intercom.args[1][2]).to.deep.equal(eventTracking._mixpanel.args[2][2]);
//     expect(Object.keys(eventTracking._Intercom.args[1][2])).to.contain('state');
//     expect(Object.keys(eventTracking._Intercom.args[1][2])).to.contain('href');
//     eventTracking._Intercom.restore();
//     eventTracking._mixpanel.restore();
//   });
// });

var verifyChatIntegration;
var $rootScope;
var keypather;

describe.only('serviceVerifyChatIntegration', function () {
  var mockSettings = {
    attrs: {
      notifications: {
        slack: {
          apiToken: '123',
          githubUsernameToSlackIdMap: {
            valentina: 'hullo'
          }
        }
      }
    }
  };
  var mockIntegrationsCache = {
    Jeb: {}
  };

  beforeEach(function () {
    angular.mock.module('app', function ($provide) {
      $provide.factory('fetchSlackMembers', function ($q) {
        return function (token) {
          return $q.when([{
            real_name: 'bill',
            id: 'snacks'
          }, {
            real_name: 'bob',
            id: 'not snacks'
          }, {
            real_name: 'valentina',
            id: 'hullo'
          }]);
        };
      });
      $provide.factory('fetchGitHubMembers', function ($q) {
        return function (username) {
          return $q.when([{
            login: 'bill'
          }, {
            login: 'jeb'
          }, {
            login: 'valentina'
          }]);
        };
      });
      $provide.factory('fetchGitHubUser', function ($q) {
        return function (username) {
          return $q.when({
            name: username,
            login: username
          });
        };
      });

      $provide.value('integrationsCache', mockIntegrationsCache);
      $provide.value('$state', {
        params: {
          userName: 'Jeb'
        }
      });
    });
    angular.mock.inject(function (
      _$rootScope_,
      _verifyChatIntegration_,
      _keypather_
    ) {
      verifyChatIntegration = _verifyChatIntegration_;
      keypather = _keypather_;
      $rootScope = _$rootScope_;
      $rootScope.$apply();
    });
  });

  it('filters regular responses with an empty cache', function (done) {
    verifyChatIntegration(mockSettings, 'slack')
    .then(function (results) {
      expect(results.github).to.deep.equal(['jeb']);
      expect(results.slack).to.deep.equal([{
          real_name: 'bill',
          id: 'snacks',
          found: true,
          ghName: 'bill'
        }, {
          real_name: 'bob',
          id: 'not snacks'
        }, {
          real_name: 'valentina',
          id: 'hullo',
          slackOn: true,
          found: true,
          ghName: 'valentina'
        }
      ]);
      done();
    });
    $rootScope.$apply();
  });

  it('returns early if cache is valid', function (done) {
    keypather.set(mockIntegrationsCache, 'Jeb.settings.attrs.notifications.slack.apiToken', '123');
    mockIntegrationsCache.Jeb.github = ['bill'];
    verifyChatIntegration(mockSettings)
    .then(function (results) {
      expect(results).to.deep.equal(mockIntegrationsCache.Jeb);
      done();
    });
    $rootScope.$apply();
  });
});