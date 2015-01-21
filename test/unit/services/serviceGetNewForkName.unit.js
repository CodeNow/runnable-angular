'use strict';

function makeInstances() {
  return {
    models: [{
      attrs: {
        name: 'instance'
      }
    }, {
      attrs: {
        name: 'instance2'
      }
    }, {
      attrs: {
        name: 'instance2-copy'
      }
    }, {
      attrs: {
        name: 'instance2-copy2'
      }
    }]
  };
}

describe('serviceGetNewForkName'.bold.underline.blue, function () {
  var getNewForkName, instances;
  beforeEach(function () {
    angular.mock.module('app');
    angular.mock.inject(function (_getNewForkName_) {
      getNewForkName = _getNewForkName_;
    });
  });
  beforeEach(function () {
    instances = makeInstances();
  });
  describe('basic operations'.blue, function () {
    it('should just return base -copy name with a null collection of instances', function () {
      var result = getNewForkName(instances.models[0], null);
      expect(result).to.equal('instance-copy', true);
    });
    it('should just return base -copy name with no instances matching', function () {
      var result = getNewForkName(instances.models[0], instances);
      expect(result).to.equal('instance-copy', true);
    });
    it('should try to make a name 3 times before getting instance2-copy3', function () {
      var result = getNewForkName(instances.models[1], instances);
      expect(result).to.equal('instance2-copy3', true);
    });
    it('should just add -copy on top of the already added copy', function () {
      var result = getNewForkName(instances.models[2], instances);
      expect(result).to.equal('instance2-copy-copy', true);
    });
  });
});
