var main    = require('main');
var chai    = require('chai');
var sinon   = require('sinon');
var colors  = require('colors');
var angular = require('angular');
require('browserify-angular-mocks');

var expect = chai.expect;

describe('servicePrimus'.bold.underline.blue, function () {
  var primus;
  function initState () {

    angular.mock.module('app', function ($provide) {
      $provide.value('apiConfig', {
        username: "root",
        ipaddress: "runnable3.net",
        port: "3111",
        type: "filibuster",
        pid: 896,
        host: 'http://api.runnable3.net'
      });
    });

    angular.mock.inject(function (_primus_) {
      primus = _primus_;
    });
  }
  beforeEach(initState);

  it('should connect to the server', function () {
    expect(primus).to.be.a('function');
  });

  it('should have substreams', function () {
    var sub = primus().substream('terminal');
    expect(sub).to.be.ok;
  });

});
