'use strict';

describe('serviceCleanStartCommand'.bold.underline.blue, function () {
  var cleanStartCommand;
  function initState () {
    angular.mock.module('app');
    angular.mock.inject(function (_cleanStartCommand_) {
      cleanStartCommand = _cleanStartCommand_;
    });
  }
  beforeEach(initState);

  it('should not replace other commands', function () {
    expect(cleanStartCommand('abc')).to.equal('abc');
  });

  it('should not replace other commands', function () {
    var cmd = 'until grep -q ethwe /proc/net/dev; do sleep 1; done;sleep 10';
    expect(cleanStartCommand(cmd)).to.equal('sleep 10');
  });
});
