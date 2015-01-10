'use strict';

require('app')
  .filter('repos', repoFilter);
/**
 * @ngInject
 */
function repoFilter() {
  return function (items, filterBy) {
    if (!filterBy) {
      return items;
    }

    filterBy = filterBy.toLowerCase();

    return items.filter(function (item) {
      return ~item.attrs.name.toLowerCase().indexOf(filterBy);
    });
  };
}
