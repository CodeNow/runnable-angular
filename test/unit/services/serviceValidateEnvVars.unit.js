'use strict';

function expectPass(result) {
  expect(result).to.deep.equal({
    valid: true,
    errors: []
  });
}

function expectFail(result) {
  expect(result).to.deep.equal({
    valid: false,
    errors: [1]
  });
}

describe('serviceValidateEnvVars'.bold.underline.blue, function () {
  var validateEnvVars;
  beforeEach(function () {
    angular.mock.module('app', function ($provide) {});
    angular.mock.inject(function (_validateEnvVars_) {
      validateEnvVars = _validateEnvVars_;
    });
  });
  it('should handle empty array', function () {
    var env = [];
    expectPass(validateEnvVars(env));
  });

  it('should handle string input', function() {
    var env = 'TEST=test\nTOODLE=oo';
    expectPass(validateEnvVars(env));
  });

  it('should reject duplicate keys', function() {
    var env = [
      'TEST=test1',
      'TEST=test2'
    ];
    expectFail(validateEnvVars(env));
  });

  it('should return valid on input that is neither a string nor an array', function() {
    expectPass(validateEnvVars());
  });

  it('should correctly identifiy invalid lines', function () {
    var env = [
      'PROPERTY1=test', //valid
      '$1!!!'           //invalid
    ];
    expectFail(validateEnvVars(env));
  });
});
