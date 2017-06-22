'use strict';

require('app')
  .directive('composeCard', composeCard);

function composeCard(
  $rootScope,
  github,
  keypather
) {
  return {
    restrict: 'A',
    templateUrl: 'viewComposeCard',
    controller: 'ComposeCardController',
    controllerAs: 'CCC',
    bindToController: true,
    scope: {
      composeCluster: '=',
      isChild: '=?'
    },
    link: function ($scope) {
      getCardName();
      $scope.isActive = false;
      var stopListening = $rootScope.$on('$stateChangeSuccess', function () {
        $scope.CCC.checkIfActive();
      });
      $scope.$on('$destroy', stopListening);
      $scope.CCC.checkIfActive();

      function getCardName () {
        if ($scope.CCC.isChild) {
          return $scope.CCC.composeCluster.master.getBranchName();
        }
        var orgAndRepoInfo = keypather.get($scope.CCC, 'composeCluster.repoName').split('/')
        var org = orgAndRepoInfo[0];
        var repo = orgAndRepoInfo[1];

        return github.getRepoInfo(org, repo)
          .then(function(info) {
            $scope.cardName = info.name + '/' + info.default_branch;
          })
          .catch(function() {
            $scope.cardName = repo;
          })
      };
    }
  };
}
