var main    = require('main');
var chai    = require('chai');
var sinon   = require('sinon');
var colors  = require('colors');
var angular = require('angular');
require('browserify-angular-mocks');

var expect = chai.expect;

var VersionFileModel = require('runnable/lib/models/context/version/file');

describe('serviceOpenItems'.bold.underline.blue, function () {
  var $localStorage, keypather, pluck, equals, async, OpenItems;
  var fileObj = {"path":"/home","name":"defined","isDir":false,"body":"adsf","state":{"from":"File"}};
  var fileModel = new VersionFileModel(fileObj, { noStore: true });
  function initState () {

    angular.mock.module('app', function ($provide) {
      $provide.value('$localStorage', {
        test: [fileObj]
      });
    });
    angular.mock.inject(function (_OpenItems_, _$localStorage_) {
      OpenItems = _OpenItems_;
      $localStorage = _$localStorage_;
    });
  }
  beforeEach(initState);

  describe('basic operations'.blue, function () {
    it('should initalize properly', function () {
      var oi = new OpenItems('123456');
      expect(oi).to.be.ok;
      expect(oi.models).to.be.an('array');
      expect(oi.models.length).to.eql(0);
      expect(oi.activeHistory.constructor.name).to.eql('ActiveHistory');
      expect(oi.fromCache).to.be.falsy;
    });

    it('should throw errors when we misuse it', function () {
      var oi = new OpenItems('123456');

      expect(oi.newModel).to.throw('you are doing it wrong');
      expect(oi.activeHistory.newModel).to.throw('you are doing it wrong');
    });
  });

  describe('adding tabs'.blue, function () {
    ['WebView', 'Terminal', 'BuildStream', 'Logs'].forEach(function (tab) {
      it('adds ' + tab, function () {
        var oi = new OpenItems('123456');
        expect(oi['add' + tab]()).to.be.ok;
      });
    });
  });

  describe('hitting cache'.blue, function () {
    it('Should set fromCache to true', function () {
      var oi = new OpenItems('test');

      expect(oi.fromCache).to.be.true;
    });

    it('Should initalize with cached items', function () {
      var oi = new OpenItems('test');

      expect(oi).to.be.ok;
      expect(oi.models).to.be.an('array');
      expect(oi.models.length).to.eql(1);

      var model = oi.models[0];
      expect(model.constructor.name).to.eql('File');
      expect(model.attrs.body).to.eql('adsf');

      var ah = oi.activeHistory;
      expect(ah).to.be.ok;
      expect(ah.constructor.name).to.eql('ActiveHistory');
      expect(ah.models).to.be.an('array');
      expect(ah.models.length).to.eql(1);

      expect(oi.fromCache).to.be.true;
    });
  });

  describe('adding and removing files'.blue, function () {
    it('Should add a file', function () {
      var oi = new OpenItems('123456');

      expect(oi).to.be.ok;
      expect(oi.models).to.be.an('array');
      expect(oi.models.length).to.eql(0);

      oi.add(fileModel);

      expect(oi).to.be.ok;
      expect(oi.models).to.be.an('array');
      expect(oi.models.length).to.eql(1);

      var model = oi.models[0];
      expect(model.constructor.name).to.eql('File');
      expect(model.attrs.body).to.eql('adsf');

      var ah = oi.activeHistory;
      expect(ah).to.be.ok;
      expect(ah.constructor.name).to.eql('ActiveHistory');
      expect(ah.models).to.be.an('array');
      expect(ah.models.length).to.eql(1);

      expect(oi.fromCache).to.be.falsey;
    });

    it('Should remove a file', function () {
      var oi = new OpenItems('123456');

      oi.add(fileModel);

      oi.remove(fileModel);

      expect(oi).to.be.ok;
      expect(oi.models.length).to.eql(0);
      expect(oi.activeHistory.models.length).to.eql(0);
    });
  });

  describe('error states'.blue, function () {
    it('should throw an error when we try to add a non-model', function () {
      var oi = new OpenItems('123456');

      function badAdd() {
        oi.add(fileObj);
      }

      expect(badAdd).to.throw('Trying to add a non-model');
    });
  });
});
