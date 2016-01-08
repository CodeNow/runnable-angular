/*global before:true, directiveTemplate: true */
'use strict';

describe('userButtonDirective'.bold.underline.blue, function() {
  var element;
  var $scope;
  var $elScope;
  var $rootScope;
  var $q;
  var errs;

  function setup(scopeExtendedOpts) {
    var $compile;

    angular.mock.module('app');
    angular.mock.inject(function (
      _$compile_,
      _$q_,
      _$rootScope_
    ) {
      $compile = _$compile_;
      $q = _$q_;
      $scope = _$rootScope_.$new();
      angular.extend($scope, scopeExtendedOpts);

      var template = directiveTemplate.attribute('user-button', {
        commit: 'commit',
      });
      var element = $compile(template)($scope);
      $scope.$digest();
      $elScope = element.isolateScope();
      $scope.$digest();
    });
  }

  describe('$watch', function () {
    var fetchUserCommitResponse = true;
    beforeEach(function () {
      setup();
      $elScope.UBC.fetchUserForCommit = sinon.stub().returns($q.when(fetchUserCommitResponse));
    });

    it('should be loading by default', function () {
      expect($elScope.loading).to.equal(true);
    });

    it('should not fetch user commit if the commit is not an object', function () {
      $scope.commit = false;
      $scope.$digest();
      sinon.assert.notCalled($elScope.UBC.fetchUserForCommit);
    });

    it('should fetch the user commit if the commit is an object', function () {
      $scope.commit = {};
      $scope.$digest();
      sinon.assert.calledOnce($elScope.UBC.fetchUserForCommit);
      sinon.assert.calledWith($elScope.UBC.fetchUserForCommit, $scope.commit);
    });

    it('should set the commitUser and unset loading', function () {
      $scope.commit = {};
      $scope.$digest();
      sinon.assert.calledOnce($elScope.UBC.fetchUserForCommit);
      expect($elScope.commitUser).to.equal(fetchUserCommitResponse);
      expect($elScope.loading).to.equal(false);
    });
  });
});

