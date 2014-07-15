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
    dataInstance.showAddTab = false;
    dataInstance.showFileMenu = false;
    dataInstance.popoverAddTab.filter = '';
  });

  dataInstance.togglePopover = function (popoverName, event) {
    event.stopPropagation();
    dataInstance.showAddTab = false;
    dataInstance.showFileMenu = false;
    dataInstance['show' + popoverName] = true;
  };
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
