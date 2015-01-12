'use strict';

var VersionFileModel = require('runnable/lib/models/context/version/file');

describe.skip('serviceOpenItems'.bold.underline.blue, function () {
  var $localStorage, keypather, pluck, equals, async, OpenItems;
  var fileObj = {"path":"/home","name":"defined","isDir":false,"body":"adsf","state":{"from":"File"}};
  var fileModel = new VersionFileModel(fileObj, { noStore: true });

  var fileObj2 = {"path":"/home2","name":"defined2","isDir":false,"body":"adsf","state":{"from":"File"}};
  var fileModel2 = new VersionFileModel(fileObj2, { noStore: true });

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

    it('can initalize without a shortHash', function () {
      var oi = new OpenItems();
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

    describe('should not add a log tab if one is already open'.blue, function() {
      it('BuildStream', function() {
        var oi = new OpenItems();

        var oldStream = oi.addBuildStream();

        var result = oi.addBuildStream();

        expect(result).to.deep.eql(oldStream);
      });

      it('LogView', function() {
        var oi = new OpenItems();

        var oldStream = oi.addLogs();

        var result = oi.addLogs();

        expect(result).to.deep.eql(oldStream);
      });
    })
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

    it('Should preserve active state of each tab', function () {
      var oi = new OpenItems('abc123');
      oi.add(fileModel);
      oi.add(fileModel2); //fileModel2.state.active = true

      expect(fileModel.state.active).to.eql(false);
      expect(fileModel2.state.active).to.eql(true);

      var oi2 = new OpenItems('abc123');
      oi2.restoreActiveTab();
      expect(oi2.previouslyActiveTab.name).to.eql(fileModel2.attrs.name);

      // switch up active tab && preserve state
      oi.activeHistory.add(fileModel);
      oi.saveState();

      var oi3 = new OpenItems('abc123');
      expect(oi3.previouslyActiveTab.name).to.eql(fileModel.attrs.name);

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

    it('Should reset collection', function () {
      var oi = new OpenItems();

      oi.add(fileModel2);
      expect(oi).to.be.ok;
      expect(oi.models.length).to.eql(1);
      expect(oi.activeHistory.models.length).to.eql(1);

      oi.reset([]);
      expect(oi.models.length).to.eql(0);
      expect(oi.activeHistory.models.length).to.eql(0);

      oi.reset([fileModel, fileModel2]);
      expect(oi.models.length).to.eql(2);
      expect(oi.activeHistory.models.length).to.eql(2);
    });
  });

  describe('hasOpen'.blue, function () {
    it('should return true when OI has that type open', function() {
      var oi = new OpenItems();

      oi.add(fileModel);

      var result = oi.hasOpen('File');

      expect(result).to.be.true;
    });

    it('should return false when OI does not have an item of that type open', function() {
      var oi = new OpenItems();

      oi.add(fileModel);

      var result = oi.hasOpen('Terminal');

      expect(result).to.be.false;
    });
  });

  describe('getFirst'.blue, function() {
    it('should return the first item of that type in OpenItems', function() {
      var oi = new OpenItems();

      oi.add(fileModel);

      var result = oi.getFirst('File');

      expect(result).to.be.ok;
      expect(result).to.deep.eql(fileModel);
    });

    it('should return false when there are no items of that type', function() {
      var oi = new OpenItems();

      oi.add(fileModel);

      var result = oi.hasOpen('Terminal');

      expect(result).to.be.false;
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
