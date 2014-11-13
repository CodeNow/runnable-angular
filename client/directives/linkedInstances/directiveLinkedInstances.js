require('app')
  .directive('linkedInstances', linkedInstances);

function linkedInstances (
  async,
  user
) {
  return {
    restrict: 'E',
    templateUrl: function (elem, attrs) {
      if (attrs.type === 'modal') {
        return 'viewLinkedInstancesModal';
      } else if (attrs.type === 'sidebar') {
        return 'viewLinkedInstancesSidebar';
      } else {
        throw new Error('linkedInstances requires a type of modal or sidebar');
      }
    },
    replace: true,
    scope: {
      linkedInstances: '='
    },
    link: function ($scope, elem, attrs) {
      if (!$scope.linkedInstances) {
        // The instance did not have any dependencies
        return;
      }

      $scope.deps = [];

      function fetchInstances (instances, cb) {
        async.each(Object.keys(linkedInstances),
          function (instanceKey, cb) {
            var instanceJSON = instances[instanceKey];
            function fetchInstance (cb) {
              var instance = user.newInstance(instanceJSON);
              instance.fetch(function (err) {
                if (err) {
                  cb(err);
                }
                $scope.deps.push(instance);
                cb();
              });
            }
            if (instanceJSON.dependencies) {
              async.parallel([
                function (cb) {
                  fetchInstances(instanceJSON.dependencies, cb);
                },
                fetchInstance
              ], cb);
              fetchInstances(instanceJSON.dependencies, cb);
            } else {
              fetchInstance(cb);
            }
          },
          function (err) {
            if (err) { throw err; }
            console.log('all fetched');
            cb();
          });
      }
      fetchInstances($scope.linkedInstances, console.log.bind(console));

    }
  };
}