'use strict';

require('app')
  .directive('fancySelect', fancySelect);
/**
 * @ngInject
 */
function fancySelect(
  $document,
  $timeout
) {
  return {
    restrict: 'E',
    templateUrl: 'viewFancySelect',
    transclude: true,
    scope: {
      value: '=',
      placeholder: '@'
    },
    link: function ($scope, element, attrs, controller, transcludeFn) {
      var transcludedContent;
      var transclusionScope;

      $scope.placeholder = $scope.placeholder || 'Select an item';

      var list =  element.find('ul');
      $scope.isOpen = false;

      var positionDropdown = false;

      var unbindDocumentClick = angular.noop;

      function openDropdown() {
        if (positionDropdown){
          return;
        }
        $scope.isOpen = true;
        positionDropdown = true;
        $document.find('body').append(list);

        unbindDocumentClick = $scope.$on('app-document-click', function (event, target) {
          if(!target || (target && $document[0].contains(target) && !list[0].contains(target) && list[0] !== target)){
            closeDropdown();
          }
        });
      }

      function closeDropdown() {
        $scope.isOpen = false;
        unbindDocumentClick();
        $timeout(function () {
          element.append(list);
          positionDropdown = false;
        }, 200);
      }

      $scope.getDropdownStyles = function () {
        if (!positionDropdown) {
          return;
        }
        var button = element.find('button')[0];
        var boundingRect = button.getBoundingClientRect();

        return {
          top: boundingRect.top + button.offsetHeight + 'px',
          left: boundingRect.left + 'px'
        };
      };


      $scope.actions = {
        toggleSelect: function () {
          if ($scope.isOpen) {
            closeDropdown();
          } else {
            openDropdown();
          }
        },
        clickedOption: function (clickedOption) {
          $scope.value = clickedOption.value;
          closeDropdown();
        }
      };

      var options = [];

      $scope.registerOption = function (option) {
        options.push(option);
      };

      transcludeFn($scope, function(clone, innerScope ){
        list.append(clone);
        transcludedContent = clone;
        transclusionScope = innerScope;
      });

      $scope.$watch('value', function (newValue) {
        var matchedOption = options.find(function (option) {
          return option.value === newValue;
        });

        if (matchedOption) {
          options.forEach(function (option) {
            option.selected = false;
          });
          matchedOption.selected = true;
          angular.element(element[0].querySelector('.display')).html(matchedOption.element.html());
        }
      });
    }
  };
}
