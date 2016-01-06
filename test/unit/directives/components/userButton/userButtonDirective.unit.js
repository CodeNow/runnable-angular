/*global before:true, directiveTemplate: true */
'use strict';

describe('userButtonDirective'.bold.underline.blue, function() {
  var element;
  var $scope;
  var $elScope;
  var $rootScope;
  var errs;

  function setup(scopeExtendedOpts) {
    var $compile;

    angular.mock.inject(function (
      _$compile_,
      _$rootScope_
    ) {
      $compile = _$compile_;
      $scope = _$rootScope_.$new();
      var template = directiveTemplate.attribute('user-button', {
        'commit': 'commit'
      });

      $scope.ports = []; // Set default `ports` as an empty array
      angular.extend($scope, scopeExtendedOpts);

      element = $compile(template)($scope);
      $scope.$digest();
      $elScope = element.isolateScope();
    });
  }

  describe('$watch', function () {
  })

  describe('ifShowInviteFormAndInviteNotSent', function () {
  });

  describe('ifNotShowInviteFormAndNotRunnableUser', function () {
  });
});

