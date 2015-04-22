'use strict';

require('app')
  .directive('fancySelect', fancySelect);
/**
 * @ngInject
 */
function fancySelect(
  $document,
  $timeout,
  $compile
) {
  return {
    replace: true,
    restrict: 'E',
    templateUrl: function (elem, attrs) {
      if (attrs.type === 'text') {
        return 'viewFancySelectText';
      }
      return 'viewFancySelectButton';
    },
    transclude: true,
    scope: {
      value: '=',
      placeholder: '@?',
      type: '@?',
      showDropdown: '=?'
    },
    link: function ($scope, element, attrs, controller, transcludeFn){
      var type = 'button';
      if ($scope.type === 'text') {
        type = 'text';
      }
      var transcludedContent;
      var transclusionScope;

      $scope.placeholder = $scope.placeholder || 'Select an item';

      var list = $compile('<ul class="fancy-select" ng-class="{in: isOpen}" ng-style="getDropdownStyles()">')($scope);
      $scope.isOpen = false;

      var positionDropdown = false;

      var unbindDocumentClick = angular.noop;

      function openDropdown() {
        if($scope.showDropdown === false){
          return;
        }
        if (positionDropdown){
          return;
        }
        $scope.isOpen = true;
        positionDropdown = true;
        $document.find('body').append(list);

        unbindDocumentClick = $scope.$on('app-document-click', function (event, target) {
          if(!target || (target && $document.find('body')[0].contains(target) && !list[0].contains(target) && list[0] !== target) && !element[0].contains(target) && element[0] !== target){
            closeDropdown();
          }
        });
      }

      $scope.$on('$destroy', function () {
        list.remove();
      });

      function closeDropdown() {
        $scope.isOpen = false;
        unbindDocumentClick();
        $timeout(function () {
          list.detach();
          positionDropdown = false;
        }, 200);
      }

      $scope.getDropdownStyles = function () {
        if (!positionDropdown) {
          return;
        }
        var boundingRect = element[0].getBoundingClientRect();


        var padding = 24;
        var top = boundingRect.top + element[0].offsetHeight;
        if (list[0].offsetHeight + top > $document.find('body')[0].offsetHeight - padding) {
          top =  $document.find('body')[0].offsetHeight - padding - list[0].offsetHeight;
        }

        return {
          top: top + 'px',
          left: boundingRect.left + 'px',
          minWidth: element[0].offsetWidth + 'px'
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

      if (type === 'button') {
        $scope.$watch('value', function (newValue) {
          $timeout(function () {
            var matchedOption = options.find(function (option) {
              return angular.equals(option.value, newValue);
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
    }
  };
}
