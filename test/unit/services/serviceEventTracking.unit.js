'use strict';

var User = require('runnable/lib/models/user');
var apiMocks = require('../apiMocks/index');

describe('serviceEventTracking'.bold.underline.blue, function () {

  var $log;
  var eventTracking;

  function initState () {
    angular.mock.module('app', function ($provide) {
    });
    angular.mock.inject(function (
      _$log_,
      _eventTracking_
    ) {
      $log = _$log_;
      eventTracking = _eventTracking_;
      sinon.stub($log, 'error', noop);
    });
  }

  function tearDownState () {
    $log.error.restore();
  }

  beforeEach(initState);
  afterEach(tearDownState);

  it('should stub/assign Intercom SDK instance', function () {
    expect(eventTracking._Intercom).to.be.a('function');
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
});
