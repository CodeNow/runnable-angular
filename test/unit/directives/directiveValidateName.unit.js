'use strict';

function fakeInstance (name) {
  return {
    attrs: {
      name: name
    }
  };
}

describe('directiveValidateName'.bold.underline.blue, function() {
  var $scope;
  var element;
  var form;

  /**
   * Runs two tests, changing the view on one, and the model on the other
   * @param  {String} desc Description for the test
   * @param  {Function} func Test function to run - should have change type
   *                         as `this.setName`
   */
  function testBoth_it (desc, func) {
    it(desc + ' (view change)', func.bind({
      setName: function (newName) {
        form.instanceName.$setViewValue(newName);
        $scope.$digest();
      },
      type: 'view'
    }));
    it(desc + ' (model change)', func.bind({
      setName: function (newName) {
        $scope.model.instanceName = newName;
        form.instanceName.$pristine = false;
        $scope.$digest();
      },
      type: 'model'
    }));
  }

  function initState() {
    angular.mock.module('app');
    angular.mock.inject(function($compile, $rootScope, $timeout){
      $scope = $rootScope.$new();

      $scope.instance = fakeInstance('Test-Instance');
      $scope.instances = {
        find: function (func) {
          return ['Test-Instance', 'Test-Instance0', 'Test-Instance1'].map(fakeInstance).some(func);
        }
      };
      $scope.model = {
        instanceName: ''
      };
      var tmpl = '<form name="form">' +
        '<input ng-model="model.instanceName" name="instanceName" validate-name="instances"' +
        '  instance="instance" current-instance-valid="false">' +
        '</form>';

      element = $compile(tmpl)($scope);
      $scope.$apply();
      form = $scope.form;
    });
  }
  beforeEach(initState);

  testBoth_it('should allow a brand new name', function() {
    this.setName('New-Name');
    expect($scope.model.instanceName).to.equal('New-Name');
    expect(form.instanceName.$valid).to.be.true;
  });

  it('should allow a pristine state with a name', function() {
    $scope.model.instanceName = 'adsfadsfadsf';
    $scope.$apply();
    expect(form.$pristine).to.be.true;
    expect($scope.model.instanceName).to.equal('adsfadsfadsf');
    expect(form.instanceName.$valid).to.be.true;
  });

  it('should not allow a pristine state with an empty name', function() {
    expect(form.$pristine).to.be.true;
    expect($scope.model.instanceName).to.equal('');
    expect(form.instanceName.$valid).to.be.false;
  });

  // Only testing view changes here
  // Model changes don't set $dirty
  it('should not allow an empty string', function() {
    form.instanceName.$setViewValue('newName');
    form.instanceName.$setViewValue('');
    $scope.$digest();
    expect(form.$dirty).to.be.true;
    expect(form.instanceName.$valid).to.be.false;
  });

  testBoth_it('should not set values for an identical name', function() {
    this.setName('Test-Instance');
    expect($scope.model.instanceName).to.equal('Test-Instance');
    expect(form.instanceName.$valid).to.be.undefined;
    expect(form.instanceName.$error.nameAvailable).to.be.undefined;
  });

  testBoth_it('should complain about an identical name to a different instance', function() {
    this.setName('Test-Instance1');
    expect($scope.model.instanceName).to.equal('Test-Instance1');
    expect(form.instanceName.$valid).to.be.false;
    expect(form.instanceName.$error.nameAvailable).to.be.true;
  });

  testBoth_it('should complain about names with different cases', function() {
    this.setName('test-instance1');
    expect($scope.model.instanceName).to.equal('test-instance1');
    expect(form.instanceName.$valid).to.be.false;
    expect(form.instanceName.$error.nameAvailable).to.be.true;
  });

  describe('no instances'.blue, function () {
    beforeEach(function () {
      $scope.instances = undefined;
      $scope.$digest();
    });

    testBoth_it('should ok any name with no instances', function() {
      this.setName('asdf');
      expect(form.instanceName.$valid).to.be.true;
    });
  });

  describe('currentInstanceValid'.blue, function() {
    beforeEach(function() {
      $scope.model.instanceName = 'adsfadsfadsf';
      $scope.$apply();
    });

    testBoth_it('should allow the same name', function() {
      this.setName('asdf');
      this.setName('adsfadsfadsf');
      expect(form.instanceName.$valid).to.be.true;
    });
  });
});
