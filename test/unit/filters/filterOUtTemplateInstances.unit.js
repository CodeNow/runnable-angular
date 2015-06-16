'use strict';

describe('removeTemplateInstances', function () {
  var removeTemplateInstances;
  beforeEach(function() {
    angular.mock.module('app');
    angular.mock.inject(function(_removeTemplateInstancesFilter_) {
      removeTemplateInstances = _removeTemplateInstancesFilter_;
    });
  });

  it('should remove all templates from the list', function () {
    var instances = [
      {
        attrs: {
          name: 'TEMPLATE-foo'
        }
      },
      {
        attrs: {
          name: 'TEMPLATE-foo1'
        }
      },
      {
        attrs: {
          name: 'TEMPLATE-fo2o'
        }
      },
      {
        attrs: {
          name: 'MyTEMPLATE-foo'
        }
      }
    ];
    var filtered = removeTemplateInstances(instances);
    expect(filtered.length).to.equal(1);
    expect(filtered[0].attrs.name).to.equal('MyTEMPLATE-foo');
  });

  it('should return an empty array if nothing passed in', function () {
    expect(removeTemplateInstances()).to.be.empty;
    expect(removeTemplateInstances()).to.be.instanceof(Array);
  });
});
