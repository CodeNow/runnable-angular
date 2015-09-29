'use strict';

module.exports = function (masterInstances) {
  return function ($q) {
    return function (instance) {
      var foundMasterInstance = masterInstances.find(function (masterInstance) {
        console.log('masterInstance.attrs.contextVersion.context', masterInstance.attrs.contextVersion.context);
        console.log(instance);
        console.log('instance.attrs.contextVersion.context', instance.attrs.contextVersion.context);
        return masterInstance.attrs.contextVersion.context === instance.attrs.contextVersion.context;
      });
      return $q.when(foundMasterInstance);
    };
  };
};
