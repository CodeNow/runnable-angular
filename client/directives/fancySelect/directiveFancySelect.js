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
    replace: true,
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
          if(!target || (target && $document.find('body')[0].contains(target) && !list[0].contains(target) && list[0] !== target)){
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
        var button = element[0];
        var boundingRect = button.getBoundingClientRect();


        var padding = 24;
        var top = boundingRect.top + button.offsetHeight;
        if (list[0].offsetHeight + top > $document.find('body')[0].offsetHeight - padding) {
          top =  $document.find('body')[0].offsetHeight - padding - list[0].offsetHeight;
        }

        return {
          top: top + 'px',
          left: boundingRect.left + 'px',
          minWidth: button.offsetWidth + 'px'
        };
      };


      $scope.actions = {
        toggleSelect: function (evt) {
          evt.stopPropagation();
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
        $timeout(function () {
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
        }, 0);
      });
    }
  };
}
