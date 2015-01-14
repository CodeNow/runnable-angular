'use strict';

describe('directiveDockerValidation'.bold.underline.blue, function() {
  var element;
  var $scope;
  var $rootScope;
  var openItems;
  var fakeFile;
  function initState () {
    angular.mock.module('app');
    angular.mock.inject(function($compile, _$rootScope_, $timeout){
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();

      $scope.openItems = {
        activeHistory: {
          last: function () {
            return fakeFile;
          }
        }
      };
      var tpl = directiveTemplate('docker-validation', {
        'open-items': 'openItems'
      });

      element = $compile(tpl)($scope);
      $scope.$digest();
    });
  }
  beforeEach(initState);

  it('Should return valid when given something other than a dockerfile', function() {
    fakeFile = {
      attrs: {
        body: 'Runnable is the best!'
      },
      id: function () {
        return 'Not a Dockerfile';
      }
    };
    $scope.$digest();

    var validDockerfile = element.isolateScope().validDockerfile;
    expect(validDockerfile).to.be.an.Object;
    expect(validDockerfile.valid).to.be.true;
  });

  it('Should run the validator when given a Dockerfile', function() {
    // Using an invalid dockerfile here - otherwise we can't be sure the validator was run
    fakeFile = {
      attrs: {
        body: 'FROM dockerfile/nodejs\nCDM sleep 123456789'
      },
      id: function () {
        return '/Dockerfile';
      }
    };
    $scope.$digest();

    var validDockerfile = element.isolateScope().validDockerfile;
    expect(validDockerfile).to.be.an.Object;
    expect(validDockerfile.valid).to.be.false;
  });
});
