var main    = require('main');
var chai    = require('chai');
var sinon   = require('sinon');
var colors  = require('colors');
var angular = require('angular');
var modelStore = require('runnable/lib/stores/model-store');
var instanceJSON = require('../api-mocks/instance');
var userJSON = require('../api-mocks/user');
require('browserify-angular-mocks');

var expect = chai.expect;

describe('directiveRepoList'.bold.underline.blue, function () {
  var element;
  var $scope;
  var $rootScope;
  var thisUser;
  var ctx = {};
  function initState() {
    angular.mock.module('app');
    angular.mock.inject(function($compile, _$rootScope_, $timeout, user, _jQuery_){
      jQuery = _jQuery_;
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
      thisUser = user;
      thisUser.reset(userJSON);

      $rootScope.dataApp = {
        user: thisUser,
        data: {},
        stateParams: {}
      };
      $rootScope.safeApply = function(cb) {
        $timeout(function() {
          $scope.$apply();
        });
      };

      ctx.instance = user.newInstance(instanceJSON);
      $scope.instance = ctx.instance;
      $scope.build = ctx.instance.build;
      $scope.edit = false;
      $scope.showGuide = true;

      element = angular.element('<repo-list ' +
        'instance="instance" ' +
        'build="build" ' +
        'edit="edit" ' +
        'showGuide="showGuide"' +
        '></repo-list>'
      );

      $compile(element)($scope);
      $scope.$apply();
    });
  }
  beforeEach(function () {
    modelStore.reset();
  });
  beforeEach(initState);

  it('should create the element', function () {
    expect(element[0].classList.contains('row')).to.be.ok;
    expect(ctx.instance).to.be.ok;
    expect(ctx.instance.build).to.be.ok;
  });

  it('should display the guide if we want it to', function() {
    console.log('length', ctx.instance.build.contextVersions.models[0].appCodeVersions.models.length);
    console.log(element);
    $rootScope.$digest();
    // console.log($scope.showGuide, $scope.data.version.appCodeVersions.models.length);
    expect(jQuery(element).find('.guide.blue').length).to.be.ok;
  });
});
