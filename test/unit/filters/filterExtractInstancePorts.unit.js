'use strict';

describe('filterExtractInstancePorts', function () {
  var extractInstancePortsFilter;
  var extractInstancePorts;

  beforeEach(function() {
    extractInstancePorts = sinon.spy();
    angular.mock.module('app');

    angular.mock.module('app', function ($provide) {
      $provide.value('extractInstancePorts', extractInstancePorts);
    });

    angular.mock.inject(function(_extractInstancePortsFilter_) {
      extractInstancePortsFilter = _extractInstancePortsFilter_;
    });
  });

  it('should call extract instance ports', function () {
    extractInstancePortsFilter('foo');
    sinon.assert.calledOnce(extractInstancePorts);
    sinon.assert.calledWith(extractInstancePorts, 'foo');
  });

});
