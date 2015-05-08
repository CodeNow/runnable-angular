'use strict';

require('app')
  .directive('ruleTable', function ruleTable(
    $q,
    errs,
    JSTagsCollection,
    hasKeypaths,
    getInstanceClasses,
    eventTracking,
    fetchDockerfileFromSource,
    findLinkedServerVariables,
    keypather,
    OpenItems,
    pFetchUser,
    populateDockerfile,
    promisify,
    $rootScope
  ) {
    return {
      restrict: 'A',
      templateUrl: 'ruleTableView',
      link: function ($scope, elem, attrs) {

      }
    };
  });
