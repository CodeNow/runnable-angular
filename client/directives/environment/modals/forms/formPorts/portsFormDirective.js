'use strict';

require('app')
  .directive('portsForm', portsFormDirective);

function portsFormDirective (
  JSTagsCollection,
  errs
) {
  return {
    restrict: 'A',
    templateUrl: 'viewFormPorts',
    scope: {
      ports: '= ports'
    },
    link: function ($scope, elem, attrs) {

      $scope.portTagOptions = {
        breakCodes:  [
          13, // return
          32, // space
          44, // comma (opera)
          188 // comma (mozilla)
        ],
        texts:  {
          'inputPlaceHolder': 'Add ports here',
          maxInputLength: 5,
          onlyDigits: true
        },
        minTagWidth: 120,
        tags: new JSTagsCollection([])
      };

      // Set our tags based on `$scope.ports`
      reAddAllPortsIntoTagCollection();

      // Don't allow any other tags to get added, after initially set
      $scope.portTagOptions.tags.onAdd(addTagHandler);
      $scope.portTagOptions.tags.onRemove(addTagHandler);

      function reAddAllPortsIntoTagCollection () {
        var tags = $scope.portTagOptions.tags;
        Object.keys(tags.tags).forEach(function (key) {
          var tag = tags.tags[key];
          tags.removeTag(tag.id);
        });

        if (Array.isArray($scope.ports) && $scope.ports.length > 0) {
          $scope.ports.forEach(function (port) {
            tags.addTag(port);
          });
        }
      }

      function addTagHandler (newTag) {
        if (newTag) {
          var tags = $scope.portTagOptions.tags;
          /*!
           * Check for non-allowed chars and ports
           */
          // Remove ports over the max
          if ((newTag.value.match(/[^0-9]/g) !== null) || (parseInt(newTag.value, 10) > 65535)) {
              tags.removeTag(newTag.id);
              // Should I be throwing errors from a service
              errs.handler(new Error('Port is invalid (Above 65,535)'));
          }
          /*!
           * Check for duplicate ports
           */
          // Check that there are no duplicates
          Object.keys(tags.tags).forEach(function (key) {
            var tag = tags.tags[key];
            if (tag && tag.value === newTag.value && tag.id !== newTag.id) {
              // Remove duplicate tag. Perhaps, have a pop-up?
              errs.handler(new Error('No duplicate ports allowed.'));
              tags.removeTag(newTag.id);
            }
          });
        }
        // Re-set and overwrite ports
        $scope.ports.splice(0, $scope.ports.length);
        convertTagsToPortList().forEach(function (value) {
          $scope.ports.push(value);
        });
      }

      function convertTagsToPortList () {
        var tags = $scope.portTagOptions.tags.tags;
        return Object.keys(tags).map(function (key) {
          return tags[key].value;
        });
      }

    }
  };
}


