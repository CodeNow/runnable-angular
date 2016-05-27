'use strict';

describe('getMatchingIsolatedInstance'.bold.underline.blue, function () {
  var getMatchingIsolatedInstance;
  var keypather;
  var instanceToMatch;
  var contextId;

  function initState() {
    angular.mock.module('app');

    angular.mock.inject(function (_getMatchingIsolatedInstance_, _keypather_) {
      getMatchingIsolatedInstance = _getMatchingIsolatedInstance_;
      keypather = _keypather_;
    });
    instanceToMatch = {};
    contextId = 'dsfasdfsdafsdfsadf';
    keypather.set(instanceToMatch, 'attrs.contextVersion.context', contextId);
  }
  beforeEach(initState);

  it('should return undefined when not given an isolation model', function () {
    expect(getMatchingIsolatedInstance(null, instanceToMatch)).to.be.falsy;
  });

  it('should find the matching instance', function () {
    var otherInstance = {};
    keypather.set(otherInstance, 'attrs.contextVersion.context', '1qe12ed1212e12');
    var isolationModel = {
      instances: {
        models: [
          instanceToMatch,
          otherInstance
        ]
      }
    };
    expect(getMatchingIsolatedInstance(isolationModel, instanceToMatch)).to.equal(instanceToMatch);
  });

  it('should return nothing when it couldn\'t match the instance', function () {
    var otherInstance = {};
    keypather.set(otherInstance, 'attrs.contextVersion.context', '1qe12ed1212e12');
    var isolationModel = {
      instances: {
        models: [
          otherInstance
        ]
      }
    };
    expect(getMatchingIsolatedInstance(isolationModel, instanceToMatch)).to.be.falsy;
  });
});
