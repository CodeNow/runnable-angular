'use strict';

var User = require('@runnable/api-client/lib/models/user');
var apiMocks = require('../apiMocks/index');
var keypather = require('keypather')();

describe('serviceEventTracking'.bold.underline.blue, function () {

  var $log;
  var $window;
  var eventTracking;

  function initState () {
    angular.mock.module('app', function ($provide) {
    });
    angular.mock.inject(function (
      _$log_,
      _$window_,
      _eventTracking_
    ) {
      $log = _$log_;
      $window = _$window_;
      eventTracking = _eventTracking_;
      sinon.stub($log, 'error', noop);
      if ($window.Intercom) {
        keypather.get($window, 'Intercom.restore()');
        sinon.stub($window, 'Intercom', noop);
      }
      sinon.stub(eventTracking, '_mixpanel', noop);
    });
  }

  function tearDownState () {
    $log.error.restore();
    keypather.get($window, 'Intercom.restore()');
    keypather.get(eventTracking, '_mixpanel.restore()');
  }

  beforeEach(initState);
  afterEach(tearDownState);

  it('should stub/assign Intercom SDK instance', function () {
    expect(eventTracking.$window.Intercom).to.be.a('function');
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
    expect(eventTracking.$window.Intercom.callCount).to.equal(2);
    expect(eventTracking._mixpanel.callCount).to.equal(4);
    expect(eventTracking.$window.Intercom.args[1][1]).to.equal('triggered-build');
    expect(eventTracking._mixpanel.args[3][1]).to.equal('triggered-build');
    // both analytics SDK event reporting methods should be passed same event data
    expect(eventTracking.$window.Intercom.args[1][2]).to.deep.equal(eventTracking._mixpanel.args[3][2]);
    expect(Object.keys(eventTracking.$window.Intercom.args[1][2])).to.contain('state');
    expect(Object.keys(eventTracking.$window.Intercom.args[1][2])).to.contain('href');
    eventTracking.$window.Intercom.restore();
    eventTracking._mixpanel.restore();
  });
});
