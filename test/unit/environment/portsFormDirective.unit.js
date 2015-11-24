/*global before:true, directiveTemplate: true */
'use strict';

describe('portsFormDirective'.bold.underline.blue, function() {
  var element;
  var $scope;
  var $elScope;
  var $rootScope;
  var errs;

  function setup(scopeExtendedOpts) {
    var $compile;

    angular.mock.module('app', function ($provide) {
      errs = {
        handler: sinon.stub()
      };
      $provide.factory('errs', function () {
        return errs;
      });
    });

    angular.mock.inject(function (
      _$compile_,
      _$rootScope_
    ) {
      $compile = _$compile_;
      $scope = _$rootScope_.$new();
      var template = directiveTemplate.attribute('ports-form', {
        'ports': 'ports'
      });

      $scope.ports = []; // Set default `ports` as an empty array
      angular.extend($scope, scopeExtendedOpts);

      element = $compile(template)($scope);
      $scope.$digest();
      $elScope = element.isolateScope();
    });
  }

  describe('Adding Ports', function () {

    beforeEach(function () {
      setup();
    });

    it('should not add a tag/port with chars', function () {
      $elScope.portTagOptions.tags.addTag('9000');
      $elScope.portTagOptions.tags.addTag('7000');
      $elScope.portTagOptions.tags.addTag('8000');
      $scope.$digest();
      expect($elScope.ports).to.eql(['9000', '7000', '8000']);
      sinon.assert.notCalled(errs.handler);
    });

    it('should not add a tag/port with chars', function () {
      $elScope.portTagOptions.tags.addTag('9000');
      $elScope.portTagOptions.tags.addTag('9000a');
      $scope.$digest();
      expect($elScope.ports).to.eql(['9000']);
      sinon.assert.calledOnce(errs.handler);
    });

    it('should not add a tag/port with special chars', function () {
      $elScope.portTagOptions.tags.addTag('10000');
      $elScope.portTagOptions.tags.addTag('900o');
      $scope.$digest();
      expect($scope.ports).to.eql(['10000']);
      sinon.assert.calledOnce(errs.handler);
    });

    it('should not add a tag/port with an invalid port (> 65,535)', function () {
      $elScope.portTagOptions.tags.addTag('65535');
      $elScope.portTagOptions.tags.addTag('65536');
      $elScope.portTagOptions.tags.addTag('99999');
      $scope.$digest();
      expect($scope.ports).to.eql(['65535']);
      sinon.assert.calledTwice(errs.handler); // Two invalid ports
    });

    it('should not add a tag/port that is a duplicate', function () {
      $elScope.portTagOptions.tags.addTag('9999');
      $elScope.portTagOptions.tags.addTag('9999');
      $scope.$digest();
      expect($scope.ports).to.eql(['9999']);
      sinon.assert.calledOnce(errs.handler);
    });

  });

});
