'use strict';

require('app')
  .filter('unaddedModels', unaddedModels);
/**
 * @ngInject
 */
function unaddedModels(
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
        'attrs._id': model.attrs._id
      }));
      return !findResults;
    });
  };
}
