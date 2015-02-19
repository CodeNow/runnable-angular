'use strict';

require('app')
  .controller('ControllerInstanceEdit', ControllerInstanceEdit);
/**
 * @ngInject
 */
function ControllerInstanceEdit(
  keypather,
  errs,
  OpenItems,
  favico,
  fetchInstances,
  fetchBuild,
  pageName,
  promisify,
  $scope,
  $state,
  $stateParams
) {

  favico.reset();
  var dataInstanceEdit = $scope.dataInstanceEdit = {
    data: {
      unsavedAcvs: []
    },
    actions: {}
  };
  var data = dataInstanceEdit.data;
  var actions = dataInstanceEdit.actions;

  data.openItems = new OpenItems();

  data.loading = false;
  data.showExplorer = true;

  // open "Dockerfile" build file by default
  function setDefaultTabs(build) {
    var rootDir = keypather.get(build, 'contextVersions.models[0].rootDir');
    if (!rootDir) { throw new Error('rootDir not found'); }
    rootDir.contents.fetch(function (err) {
      if (err) { throw err; }
      var file = rootDir.contents.models.find(function (file) {
        return (file.attrs.name === 'Dockerfile');
      });
      if (file) {
        data.openItems.add(file);
      }
    });
  }

  fetchInstances({
    name: $stateParams.instanceName
  }).then(function (instance) {
    data.instance = instance;
    pageName.setTitle('Edit: ' + instance.attrs.name);
    data.instance.state = {};
  });

  fetchBuild(
    $stateParams.buildId
  ).then(function (build) {
    if (build.attrs.completed) {
      $state.go('instance.instance', $stateParams);
      return build;
    }
    data.build = build;
    setDefaultTabs(build);
  });

}
