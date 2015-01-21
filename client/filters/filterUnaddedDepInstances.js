'use strict';

require('app')
  .filter('unaddedDepInstances', unaddedDepInstances);
/**
 * @ngInject
 */
function unaddedDepInstances(
  hasKeypaths
) {
  return function (fullModelsList, selectedModelsList) {
    if (!selectedModelsList) {
      return fullModelsList;
    }
    if (!fullModelsList) {
      return [];
    }
    return fullModelsList.filter(function (model) {
      var findResults = selectedModelsList.find(hasKeypaths({
        'instance.attrs.name': model.attrs.name
      }));
      return !findResults;
    });
  };
}
