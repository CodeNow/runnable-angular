'use strict';

var User = require('runnable/lib/models/user');
var apiMocks = require('../apiMocks/index');
var keypather = require('keypather')();

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
    keypather.get(eventTracking, '_Intercom.restore()');
    keypather.get(eventTracking, '_mixpanel.restore()');
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

  it('should have universal event data', function () {
    sinon.stub(eventTracking, '_Intercom', noop);
    sinon.stub(eventTracking, '_mixpanel', noop);
    eventTracking.boot(new User(angular.copy(apiMocks.user)));
    eventTracking.triggeredBuild();
    expect(eventTracking._Intercom.callCount).to.equal(2);
    expect(eventTracking._mixpanel.callCount).to.equal(3);
    expect(eventTracking._Intercom.args[1][1]).to.equal('triggered-build');
    expect(eventTracking._mixpanel.args[2][1]).to.equal('triggered-build');
    // both analytics SDK event reporting methods should be passed same event data
    expect(eventTracking._Intercom.args[1][2]).to.deep.equal(eventTracking._mixpanel.args[2][2]);
    expect(Object.keys(eventTracking._Intercom.args[1][2])).to.contain('state');
    expect(Object.keys(eventTracking._Intercom.args[1][2])).to.contain('href');
    eventTracking._Intercom.restore();
    eventTracking._mixpanel.restore();
  });
});
