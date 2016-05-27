'use strict';

module.exports = function (masterInstances) {
  return function ($q, keypather) {
    return function (instance) {
      var foundMasterInstance = masterInstances.find(function (masterInstance) {
        return keypather.get(masterInstance, 'attrs.contextVersion.context') ===
          keypather.get(instance, 'attrs.contextVersion.context');
      });
      return $q.when(foundMasterInstance);
    };
  };
};
