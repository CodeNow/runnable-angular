'use strict';

module.exports = function (masterInstances) {
  return function ($q) {
    return function (instance) {
      var foundMasterInstance = masterInstances.find(function (masterInstance) {
        return masterInstance.attrs.contextVersion.context === instance.attrs.contextVersion.context;
      });
      return $q.when(foundMasterInstance);
    };
  };
};
