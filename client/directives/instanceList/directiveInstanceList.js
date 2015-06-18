'use strict';

require('app')
  .directive('instanceList', instanceList);
/**
 * @ngInject
 */
function instanceList(
  $rootScope,
  $timeout,
  createServerObjectFromInstance,
  fetchStackInfo,
  fetchContexts,
  parseDockerfileForCardInfoFromInstance,
  errs,
  watchOncePromise,
  keypather
) {
  return {
    restrict: 'A',
    templateUrl: 'viewInstanceList',
    scope: {
      data: '='
    },
    link: function ($scope, ele) {
      $scope.isLoading = $rootScope.isLoading;

      var isLoadingWatch = $scope.$watch('isLoading.sidebar', function (newVal) {
        if (newVal === false) {
          isLoadingWatch();
          $timeout(function () {
            var instanceLink = angular.element(ele[0].querySelector('.selected'));
            ele.find('ul').scrollToElement(instanceLink, 33*3, 200);
          });
        }
      });

      $scope.$watch('data.instancesByPod.models.length', function (n) {
        if (!n) { return; }
        // This is so dumb
        // model === model.server.instance
        // Needed because the modal code was written late at night on crazy deadline
        $scope.data.instancesByPod.models.forEach(function (model) {
          model.server = createServerObjectFromInstance(model);
          if (keypather.get(model, 'contextVersion.attrs.advanced')) { return; }

          model.server.parsing = true;
          parseDockerfileForCardInfoFromInstance(model)
            .then(function (data) {
              if (!data) { return; }
              Object.keys(data).forEach(function (key) {
                model.server[key] = data[key];
              });
            })
            .catch(errs.handler)
            .finally(function () {
              model.server.parsing = false;
            });
        });
      });

      $scope.data = {};
      $scope.actions = {};

      fetchStackInfo()
      .then(function (stackInfo) {
        $scope.data.stacks = stackInfo;
      });
      fetchContexts({ isSource: true })
      .then(function (contexts) {
        $scope.data.sourceContexts = contexts;
      });
    }
  };
}
