'use strict';

function fakeInstance (name) {
  return {
    attrs: {
      name: name
    }
  };
}

describe('directiveValidateNamePattern'.bold.underline.blue, function() {
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

      $scope.model = {
        instanceName: ''
      };

      var tmpl = angular.element('<form name="form">' +
        '<input ng-model="model.instanceName" name="instanceName" validate-name-pattern>' +
        '</form>'
      );

      element = $compile(tmpl)($scope);
      $scope.$apply();
      form = $scope.form;
    });
  }
  beforeEach(initState);

  it('should allow a pristine state', function() {
    expect(form.$pristine).to.be.true;
    expect($scope.model.instanceName).to.equal('');
    expect(form.instanceName.$valid).to.be.true;
  });

  // Only testing view changes here
  // Model changes don't set $dirty
  it('should allow an empty string', function() {
    form.instanceName.$setViewValue('newName');
    form.instanceName.$setViewValue('');
    $scope.$digest();
    expect(form.$dirty).to.be.true;
    expect(form.instanceName.$valid).to.be.true;
  });

  testBoth_it('should allow a generic name', function() {
    this.setName('name');
    expect(form.instanceName.$valid).to.be.true;
  });

  testBoth_it('should allow dashes', function() {
    this.setName('instance-name');
    expect(form.instanceName.$valid).to.be.true;
  });

  testBoth_it('should allow multiple cases', function() {
    this.setName('NaMe');
    expect(form.instanceName.$valid).to.be.true;
  });

  testBoth_it('should allow numbers', function() {
    this.setName('name01239');
    expect(form.instanceName.$valid).to.be.true;
  });

  testBoth_it('should reject whitespace', function() {
    this.setName('name    ');
    expect(form.instanceName.$valid).to.be.false;
    expect(form.instanceName.$error.namePattern).to.be.true;
  });

  testBoth_it('should reject non-dash/underscore punctuation', function() {
    this.setName('name^&*$^&*#@^&*');
    expect(form.instanceName.$valid).to.be.false;
    expect(form.instanceName.$error.namePattern).to.be.true;
  });
});
