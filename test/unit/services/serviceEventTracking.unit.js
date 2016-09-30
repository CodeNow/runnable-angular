'use strict';

var User = require('@runnable/api-client/lib/models/user');
var apiMocks = require('../apiMocks/index');
var keypather = require('keypather')();

describe('serviceEventTracking'.bold.underline.blue, function () {
  var $log;
  var $window;
  var eventTracking;

  beforeEach(function () {
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
});
