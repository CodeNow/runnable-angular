'use strict';

describe('serviceEventTracking'.bold.underline.blue, function () {
  var eventTracking;
  function initState () {
    angular.mock.module('app', function ($provide) {
    });
    angular.mock.inject(function (_eventTracking_) {
      eventTracking = _eventTracking_;
    });
  }
  beforeEach(initState);

  it('should stub/assign Intercom JS SDK', function () {
    expect(eventTracking._Intercom).to.be.a('function');
  });
});
