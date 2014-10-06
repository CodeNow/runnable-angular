var main    = require('main');
var chai    = require('chai');
var sinon   = require('sinon');
var colors  = require('colors');
var angular = require('angular');
require('browserify-angular-mocks');

var expect = chai.expect;

describe('serviceValidateEnvVars'.bold.underline.blue, function () {
  var validateEnvVars;
  beforeEach(function () {
    angular.mock.module('app', function ($provide) {});
    angular.mock.inject(function (_validateEnvVars_) {
      validateEnvVars = _validateEnvVars_;
    })
  });
  describe('basic operations'.blue, function () {
    it('should handle empty array', function () {
      var env = [];
      var result = validateEnvVars(env);
      expect(result).to.be.ok;
      expect(result).to.be.an('object');
      expect(result).to.have.property('valid', true);
      expect(result).to.have.property('errors');
    });

    it('should correctly identifiy valid/invalid lines', function () {
    })
  });
});
