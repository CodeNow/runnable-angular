var BaseCollection = require('runnable/lib/collections/base');
var VersionFileModel = require('runnable/lib/models/context/version/file');
var ContainerFileModel = require('runnable/lib/models/instance/container/file');
var util = require('util');

require('app')
  .factory('OpenItems', openItemsFactory);
/**
 * @ngInject
 */
function openItemsFactory(
  $timeout,
  keypather,
  pluck,
  equals,
  async
) {

  var i = 0;

  // TODO split out
  function Terminal(data) {
    this.attrs = data;
    this.state = {};
    this.attrs._id = i++;
    return this;
  }

  function WebView(data) {
    this.attr = data;
    this.state = {};
    this.attrs._id = i++;
    return;
  }

  function OpenItems (models) {
    var opts = {};
    opts.client = true;
    BaseCollection.call(this, models, opts);
    this.activeHistory = new BaseCollection([], {
      noStore: true,
      Model: true,
      newModel: this.newModel,
      instanceOfModel: this.instanceOfModel
    });
  }

  util.inherits(OpenItems, BaseCollection);

  OpenItems.prototype.Model = true;

  OpenItems.prototype.instanceOfModel = function (model) {
    return (model instanceof VersionFileModel ||
            model instanceof ContainerFileModel ||
            model instanceof TerminalModel ||
            model instanceof WebViewModel);
  };

  OpenItems.prototype.isFile = function () {
    return (model instanceof this.VersionFileModel ||
            model instanceof this.ContainerFileModel);
  };

  OpenItems.prototype.newModel = function (modelOrAttrs, opts) {
    throw new Error('you are doing it wrong');
  };

  OpenItems.prototype.addFiles = function (files, cb) {
    if (files.models) {
      files = files.models;
    }
    async.forEach(files, this.addFile.bind(this), cb);
  };

  OpenItems.prototype.addFile = function (file, cb) {
    this.add(file);
    file.fetch(cb);
  };

  OpenItems.prototype.add = function (model) {
    var self = this;
    if (Array.isArray(model)) {
      model.forEach(function (model) {
        self.addOne(model);
      });
      return;
    }
    this.addOne(model);
  };

  OpenItems.prototype.addOne = function (model) {
    model.state = model.state || {};
    model.state.open = true;
    BaseCollection.prototype.add.apply(this, arguments);
    this.setActive(model);
    return this;
  };

  OpenItems.prototype.setActive = function (model) {
    model.state.active = true;
    if (this.activeHistory.last()) {
      this.activeHistory.last().state.active = false;
    }
    if (!this.activeHistory.contains(model)) {
      this.activeHistory.add(model);
    }
    else {
      this.activeHistory.remove(model);
      this.activeHistory.add(model);
    }
    return this;
  };

  OpenItems.prototype.remove = function (model) {
    model.state.open = false;
    BaseCollection.prototype.remove(model);
    if (this.activeHistory.contains(model)) {
      this.activeHistory.remove(model);
      if (model.state.active && this.activeHistory.last()) {
        model.state.active = false;
        this.activeHistory.last().state.active = true;
      }
    }
    return this;
  };

  return OpenItems;

}
