require('app')
  .controller('ControllerInstance', ControllerInstance);
/**
 * ControllerInstance
 * @constructor
 * @export
 * @ngInject
 */
function ControllerInstance(
  $scope,
  async,
  $stateParams,
  user
) {

  var self = ControllerInstance;
  var dataInstance = $scope.dataInstance = self.initData();
  var data = dataInstance.data,
    actions = dataInstance.actions;

  // init
  dataInstance.popoverAddTab = {
    filter: ''
  };

  dataInstance.showAddTab = false;
  dataInstance.showFileMenu = false;

  $scope.$on('app-document-click', function () {
    dataInstance.data.showAddTab = false;
    dataInstance.data.showFileMenu = false;
    dataInstance.data.popoverAddTab.filter = '';
  });
}

ControllerInstance.initData = function () {
  return {
    data: {
      popoverAddTab: {
        filter: ''
      },
      showAddTab: false,
      showFileMenu: false
    },
    actions: {}
  };
};
