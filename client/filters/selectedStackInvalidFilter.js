'use strict';

require('app')
  .filter('selectedStackInvalid', function () {
    return function selectedStackInvalid(selectedStack) {
      if (!selectedStack || !selectedStack.selectedVersion) {
        return true;
      }
      if (selectedStack.dependencies) {
        var depsEmpty = selectedStack.dependencies.find(function (dep) {
          return selectedStackInvalid(dep);
        });
        return !!depsEmpty;
      }
    };
  });
