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
  JSTagsCollection,
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

  $scope.data = {
    dataModalEditServer: {
      portTagOptions: {
        breakCodes: [
           13, // return
           32, // space
           44, // comma (opera)
           188 // comma (mozilla)
         ],
        texts: {
          'inputPlaceHolder': 'Add ports here',
          maxInputLength: 5,
          onlyDigits: true
        },
        tags: new JSTagsCollection(['2000', '3001'])
      }
    }
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
