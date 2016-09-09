/*global runnable:true, mocks: true, directiveTemplate: true, xdescribe: true */
'use strict';

var VersionFileModel = require('@runnable/api-client/lib/models/context/version/file');

describe('serviceOpenItems'.bold.underline.blue, function () {
  var $localStorage, keypather, OpenItems;
  var fileObj = {"path":"/home","name":"defined","isDir":false,"body":"adsf","state":{"from":"File"}};
  var fileModel = new VersionFileModel(fileObj, { noStore: true });
  var apiMocks = require('../apiMocks/index');
  var apiClientMockFactory = require('../../unit/apiMocks/apiClientMockFactory');
  var fileObj2 = {"path":"/home2","name":"defined2","isDir":false,"body":"adsf","state":{"from":"File"}};
  var fileModel2 = new VersionFileModel(fileObj2, { noStore: true });
  var mockContextVersion;
  function initState () {
    fileObj = {"path":"/home","name":"defined","isDir":false,"body":"adsf","state":{"from":"File"}};
    fileModel = new VersionFileModel(fileObj, { noStore: true });
    fileObj2 = {"path":"/home2","name":"defined2","isDir":false,"body":"adsf","state":{"from":"File"}};
    fileModel2 = new VersionFileModel(fileObj2, {noStore: true});
    angular.mock.module('app', function ($provide) {
      $provide.value('$localStorage', {
        test: [fileObj]
      });
    });
    angular.mock.inject(function (_OpenItems_, _$localStorage_) {
      OpenItems = _OpenItems_;
      $localStorage = _$localStorage_;
    });
    runnable.reset(apiMocks.user);
    mockContextVersion = apiClientMockFactory.contextVersion(
      runnable,
      apiMocks.contextVersions.angular
    );
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
    ['Terminal', 'BuildStream', 'Logs'].forEach(function (tab) {
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
    });
  });


  describe('remove all but'.blue, function () {
    describe('BuildLogs'.blue, function() {
      it('should remove everything but the buildstream', function() {
        var oi = new OpenItems();

        oi.addBuildStream();
        oi.addLogs();
        oi.add(fileModel);

        expect(oi.models.length).to.eql(3);

        oi.removeAllButBuildLogs();

        expect(oi.models.length).to.eql(1);
        expect(oi.activeHistory.last().state.type).to.eql('BuildStream');
      });
      it('should add a buildstream if one did not exist', function() {
        var oi = new OpenItems();

        oi.addLogs();
        oi.add(fileModel);

        expect(oi.models.length).to.eql(2);

        oi.removeAllButBuildLogs();

        expect(oi.models.length).to.eql(1);
        expect(oi.activeHistory.last().state.type).to.eql('BuildStream');
      });
    });
    describe('Logs'.blue, function() {
      it('should remove everything but the buildstream and logView', function() {
        var oi = new OpenItems();

        oi.addBuildStream();
        oi.addLogs();
        oi.addTerminal();
        oi.add(fileModel);

        expect(oi.models.length).to.eql(4);

        oi.removeAllButLogs();

        expect(oi.models.length).to.eql(2);
        expect(oi.activeHistory.last().state.type).to.eql('LogView');
      });
      it('should add a buildstream if one did not exist', function() {
        var oi = new OpenItems();

        oi.addLogs();
        oi.add(fileModel);

        expect(oi.models.length).to.eql(2);

        oi.removeAllButLogs();

        expect(oi.models.length).to.eql(2);
        expect(oi.activeHistory.last().state.type).to.eql('LogView');
      });
      it('should add a buildstream and logview when nothing exists', function() {
        var oi = new OpenItems();

        oi.addLogs();
        oi.add(fileModel);

        expect(oi.models.length).to.eql(2);

        oi.removeAllButLogs();

        expect(oi.models.length).to.eql(2);
        expect(oi.activeHistory.last().state.type).to.eql('LogView');
      });
    });
  });

  describe('hitting cache'.blue, function () {
    it('Should set fromCache to true', function () {
      var oi = new OpenItems();
      oi.restoreTabs({
        instanceId: 'test'
      }, mockContextVersion);
      expect(oi.fromCache).to.be.true;
    });

    it('Should initalize with cached items', function () {
      var oi = new OpenItems();

      oi.restoreTabs({
        instanceId: 'test'
      }, mockContextVersion);
      expect(oi).to.be.ok;
      // It should have also include the build logs, box logs, and terminal
      expect(oi.models).to.be.an('array');
      expect(oi.models.length).to.eql(4);
      expect(oi.models[0].constructor.name, 'File').to.eql('File');
      expect(oi.models[1].constructor.name, 'BuildStream').to.eql('BuildStream');
      expect(oi.models[2].constructor.name, 'LogView').to.eql('LogView');
      expect(oi.models[3].constructor.name, 'Terminal').to.eql('Terminal');

      var model = oi.models[0];
      expect(model.constructor.name).to.eql('File');
      expect(model.attrs.body).to.eql('adsf');

      var ah = oi.activeHistory;
      expect(ah).to.be.ok;
      expect(ah.constructor.name).to.eql('ActiveHistory');
      expect(ah.models).to.be.an('array');

      expect(ah.models.length).to.eql(4);

      expect(oi.fromCache).to.be.true;
    });

    it('Should preserve active state of each tab', function () {
      var oi = new OpenItems('abc123');
      oi.restoreTabs({
        instanceId: 'abc123'
      }, mockContextVersion);
      oi.add(fileModel);
      oi.add(fileModel2); //fileModel2.state.active = true
      oi.saveState();

      expect(fileModel.state.active).to.eql(false);
      expect(fileModel2.state.active).to.eql(true);

      var oi2 = new OpenItems('abc123');
      oi2.restoreTabs({
        instanceId: 'abc123'
      }, mockContextVersion);
      oi2.restoreActiveTab();
      expect(oi2.previouslyActiveTab.name).to.eql(fileModel2.attrs.name);

      // switch up active tab && preserve state
      oi.activeHistory.add(fileModel);
      oi.saveState();

      var oi3 = new OpenItems('abc123');
      oi3.restoreTabs({
        instanceId: 'abc123'
      }, mockContextVersion);
      expect(oi3.previouslyActiveTab.name).to.eql(fileModel.attrs.name);

    });

  });

  describe('adding and removing files'.blue, function () {
    beforeEach(function () {
      sinon.spy(fileModel, 'on');
      sinon.spy(fileModel, 'once');
      sinon.spy(fileModel, 'off');

      sinon.spy(fileModel2, 'on');
      sinon.spy(fileModel2, 'once');
      sinon.spy(fileModel2, 'off');
    });
    it('Should add a file', function () {
      var oi = new OpenItems('123456');

      expect(oi).to.be.ok;
      expect(oi.models).to.be.an('array');
      expect(oi.models.length).to.eql(0);

      oi.add(fileModel);
      sinon.assert.calledWith(fileModel.on, 'update', oi.boundSaveState);
      sinon.assert.calledWith(fileModel.once, 'destroy', oi.boundRemove);

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
      sinon.assert.calledWith(fileModel.on, 'update', oi.boundSaveState);
      sinon.assert.calledWith(fileModel.once, 'destroy', oi.boundRemove);
      oi.remove(fileModel);
      expect(fileModel.off.getCall(0).calledWith('update', oi.boundSaveState)).to.be.true;
      expect(fileModel.off.getCall(1).calledWith('destroy', oi.boundRemove)).to.be.true;
      expect(oi).to.be.ok;
      expect(oi.models.length).to.eql(0);
      expect(oi.activeHistory.models.length).to.eql(0);
    });

    it('Should reset collection', function () {
      var oi = new OpenItems();

      oi.add(fileModel2);
      sinon.assert.calledWith(fileModel2.on, 'update', oi.boundSaveState);
      sinon.assert.calledWith(fileModel2.once, 'destroy', oi.boundRemove);
      expect(oi).to.be.ok;
      expect(oi.models.length).to.eql(1);
      expect(oi.activeHistory.models.length).to.eql(1);

      oi.reset([]);
      expect(fileModel2.off.getCall(0).calledWith('update', oi.boundSaveState)).to.be.true;
      expect(fileModel2.off.getCall(1).calledWith('destroy', oi.boundRemove)).to.be.true;
      expect(oi.models.length).to.eql(0);
      expect(oi.activeHistory.models.length).to.eql(0);

      fileModel2.off.reset();
      fileModel2.on.reset();
      fileModel2.once.reset();

      oi.reset([fileModel, fileModel2]);
      sinon.assert.calledWith(fileModel.on, 'update', oi.boundSaveState);
      sinon.assert.calledWith(fileModel.once, 'destroy', oi.boundRemove);
      sinon.assert.calledWith(fileModel2.on, 'update', oi.boundSaveState);
      sinon.assert.calledWith(fileModel2.once, 'destroy', oi.boundRemove);
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
