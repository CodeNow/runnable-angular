'use strict';

require('app')
  .directive('fancySelect', fancySelect);
/**
 * @ngInject
 */
function fancySelect(
  $document,
  $timeout,
  $compile,
  keypather,
  exists
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
      showDropdown: '=?',
      trackBy: '@?',
      onUpdate: '=?',
      toggleObject: '=?',
      toggleAttribute: '@?',
      spinnerFlag: '=?'
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
            unbindDocumentClick();
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

        top += $document.find('body')[0].scrollTop;

        return {
          top: top + 'px',
          left: boundingRect.left + 'px',
          minWidth: element[0].offsetWidth + 'px'
        };
      };

      if (exists($scope.toggleObject) && exists($scope.toggleAttribute)) {
        $scope.$watch('toggleObject.' + $scope.toggleAttribute, function (newValue) {
          if (newValue){
            openDropdown();
          } else {
            closeDropdown();
          }
        });
      }

      $scope.actions = {
        toggleSelect: function () {
          if (exists($scope.toggleObject)) {
            return;
          }

          if ($scope.isOpen) {
            closeDropdown();
          } else {
            openDropdown();
          }
        },
        clickedOption: function (clickedOption) {
          var newValue = clickedOption.value;
          var originalValue = $scope.value;
          if ($scope.trackBy) {
            newValue = keypather.get(newValue, $scope.trackBy);
            originalValue = keypather.get(originalValue, $scope.trackBy);
          }
          if ($scope.option) {
            $scope.option.selected = false;
          }
          $scope.option = clickedOption;
          $scope.option.selected = true;
          $scope.value = clickedOption.value;

          if (originalValue !== newValue && $scope.onUpdate) {
            $scope.onUpdate(clickedOption.value);
          }
          if (exists($scope.toggleObject) && exists($scope.toggleAttribute)) {
            $scope.toggleObject[$scope.toggleAttribute] = false;
          }
          closeDropdown();
        }
      };

      var options = [];

      $scope.registerOption = function (option) {
        options.push(option);
        if (!$scope.option) {
          checkNewOption(option, $scope.value);
        }
      };
      $scope.deregisterOption = function (option) {
        var index = options.indexOf(option);
        if (~index) {
          options.splice(index, 1);
        }
        if (option.selected) {
          selectNewOption(null);
        }
      };

      transcludeFn($scope, function(clone, innerScope ){
        list.append(clone);
        transcludedContent = clone;
        transclusionScope = innerScope;
      });

      function selectNewOption(newOption, originalValue) {
        if ($scope.option) {
          $scope.option.selected = false;
        }
        $scope.option = newOption;
        if (newOption) {
          newOption.value = originalValue;
          $scope.option.selected = true;
          $scope.value = originalValue;
        }
      }
      function checkNewOption(newOption, originalValue) {
        if (newOption && originalValue) {
          var matchValue = newOption.value;
          var value = originalValue;
          if ($scope.trackBy) {
            matchValue = keypather.get(matchValue, $scope.trackBy);
            value = keypather.get(originalValue, $scope.trackBy);
          }
          var found = angular.equals(matchValue, value);
          if (found) {
            selectNewOption(newOption, originalValue);

            $timeout(function () {
              angular.element(element[0].querySelector('.display')).html(newOption.element.html());
            });
          }
          return found;
        }
      }

      function selectOption (value) {
        options.find(function (option) {
          return checkNewOption(option, value);
        });
      }

      if (type === 'button') {
        $scope.$watch('value', function (newValue) {
          selectOption(newValue);
        });
      }
    }
  };
}
