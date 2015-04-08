'use strict';

require('app')
  .controller('ControllerEnvironment', ControllerEnvironment);
/**
 * ControllerEnvironment
 * @param $scope
 * @constructor
 * @export
 * @ngInject
 */
function ControllerEnvironment(
  $scope,
  $rootScope,
  $state,
  $stateParams,
  $log,
  keypather,
  OpenItems,
  favico,
  fetchBuild,
  fetchInstances,
  pageName,
  $window
) {
  favico.reset();
  var dataSetup = $scope.dataSetup = {
    data: {
      instanceOpts: {},
      unsavedAcvs: []
    },
    actions: {}
  };
  $scope.state = {
    step: 1
  };

  $scope.portTagOptions = {
    texts: {
      'inputPlaceHolder': 'Add ports here'
    },
    defaultTags: ['3000', '3001']
  };

  var data = dataSetup.data;
  pageName.setTitle('Create Server');

  dataSetup.actions.olarkShrink = function() {
    if (angular.isFunction($window.olark)) {
      $window.olark('api.box.shrink');
    }
  };

  $scope.$watch('dataSetup.data.build.contextVersions.models[0].source', function(n, p) {
    if (n && dataSetup.data.showVideo) {
      dataSetup.data.showVideoFixed = true;
    }
    if (n && !p && data.showVideo) {
      // first time user has selected a seed dockerfile, minimize olark if video is playing
      //
      dataSetup.actions.olarkShrink();
    }
  });

  data.openItems = new OpenItems();
  data.showExplorer = false;
  data.loading = false;

  fetchBuild($stateParams.buildId)
    .then(function(build) {
      if (keypather.get(build, 'attrs.started')) {
        // this build has been built.
        // redirect to new?
        $state.go('instance.new', {
          userName: $stateParams.userName
        });
        $log.error('build already built');
      } else {
        data.build = build;
      }
    });

  fetchInstances()
    .then(function (instances) {
      data.instances = instances;
    });

  $scope.$on('$destroy', function () {
  });

}
