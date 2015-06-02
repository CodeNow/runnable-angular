'use strict';

require('app')
  .filter('removeTemplateInstances', removeTemplateInstances);
/**
 * @ngInject
 */
function removeTemplateInstances(
) {
  return function (instances) {
    if (!instances) {
      return [];
    }
    return instances.filter(function (instance) {
      return instance.attrs.name.indexOf('TEMPLATE-') !== 0;
    });
  };
}
