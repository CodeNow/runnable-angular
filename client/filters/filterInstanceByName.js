'use strict';

require('app').filter('filterInstanceByName', function () {
  return function (instances, filter) {
    filter = filter || '';
    filter = filter.toLowerCase();
    if (filter === '') {
      return instances;
    }
    return instances.filter(function (instance) {
      return instance.attrs.name.indexOf(filter) !== 0;
    });
  };
});
