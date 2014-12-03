require('app')
  .controller('ControllerInstanceAnon', controllerInstanceAnon);

function controllerInstanceAnon (
  $scope
) {
  console.log('hello world');
}