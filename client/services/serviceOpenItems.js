'use strict';

var BaseCollection = require('runnable/lib/collections/base');
var BaseModel = require('runnable/lib/models/base');
var VersionFileModel = require('runnable/lib/models/context/version/file');
var ContainerFileModel = require('runnable/lib/models/instance/container/file');
var util = require('util');

require('app')
  .factory('OpenItems', openItemsFactory);
/**
 * @ngInject
 */
function openItemsFactory(
  $localStorage,
  keypather,
  pluck,
  equals,
  async,
  user
) {

  function instanceOfModel(model) {
    return (model instanceof VersionFileModel ||
      model instanceof ContainerFileModel ||
      model instanceof Terminal ||
      model instanceof WebView ||
      model instanceof LogView ||
      model instanceof EnvVars ||
      model instanceof BuildStream);
  }

  function newModel(modelOrAttrs, opts) {
    throw new Error('you are doing it wrong');
  }

  var i = 1;

  // TODO split out
  function Terminal(data) {
    this.collections = [];
    this.attrs = data || {};
    this.attrs._id = i++;
    return this;
  }

  function WebView(data) {
    this.collections = [];
    this.attrs = data || {};
    this.attrs._id = i++;
    return this;
  }

  function BuildStream(data) {
    this.collections = [];
    this.attrs = data || {};
    this.attrs._id = i++;
    return this;
  }

  function LogView(data) {
    this.collections = [];
    this.attrs = data || {};
    this.attrs._id = i++;
    return this;
  }

  function EnvVars(data) {
    this.collections = [];
    this.attrs = data || {};
    this.attrs._id = i++;
    return this;
  }

  util.inherits(Terminal, BaseModel);
  util.inherits(WebView, BaseModel);
  util.inherits(BuildStream, BaseModel);
  util.inherits(LogView, BaseModel);
  util.inherits(EnvVars, BaseModel);

  var tabTypes = {
    Terminal: Terminal,
    WebView: WebView,
    BuildStream: BuildStream,
    LogView: LogView,
    EnvVars: EnvVars,
    File: ContainerFileModel
  };

  function ActiveHistory(models) {
    BaseCollection.call(this, models, {
      noStore: true
    });
  }

  util.inherits(ActiveHistory, BaseCollection);

  ActiveHistory.prototype.instanceOfModel = instanceOfModel;

  ActiveHistory.prototype.newModel = newModel;

  ActiveHistory.prototype.add = function (model) {
    if (Array.isArray(model)) {
      model.forEach(this.add.bind(this));
      return;
    }
    if (this.last()) {
      this.last().state.active = false;
    }
    model.state.active = true;
    if (!this.contains(model)) {
      BaseCollection.prototype.add.call(this, model);
    } else {
      this.remove(model);
      this.add(model);
    }
    return this;
  };

  ActiveHistory.prototype.remove = function (model) {
    if (this.contains(model)) {
      BaseCollection.prototype.remove.apply(this, arguments);
      if (model.state.active) {
        model.state.active = false;
        if (this.last()) {
          this.last().state.active = true;
        }
      }
    }
  };

  function OpenItems() {
    this.shortHash = null;
    this.activeHistory = new ActiveHistory();
    this.previouslyActiveTab = null;

    var models;
    this.retrieveTabs = function(container) {
      models = $localStorage[this.shortHash];
      if (Array.isArray(models)) {
        this.previouslyActiveTab = models.find(function (m) {
          return keypather.get(m, 'state.active');
        });
      }
      if (models && models.length) {
        this.fromCache = true;
        models = models.map(function (model) {
          var from = keypather.get(model, 'state.from');
          if (tabTypes[from]) {
            if (from === 'File') {
              // safe to assume ContainerFileModel,
              // caching not present on instance.instanceEdit
              model = container.newFile(model);
            } else {
              model = new tabTypes[from](model, {
                noStore: true
              });
            }
          }
          return model;
        });
        this.reset([]);
        this.add(models);
      }
    };

    BaseCollection.call(this, models, {
      noStore: true
    });
  }

  util.inherits(OpenItems, BaseCollection);

  // Set item in localStorage serialized cache to active
  // after other tabs have been added
  OpenItems.prototype.restoreActiveTab = function () {
    if (this.previouslyActiveTab) {
      var model = this.models.find(function (m) {
        return (m.id() === keypather.get(this, 'previouslyActiveTab._id'));
      }.bind(this));
      if (model) {
        this.activeHistory.add(model);
      }
    }
  };

  OpenItems.prototype.restoreTabs = function(shortHash, container) {
    this.shortHash = shortHash;
    this.retrieveTabs(container);
  };

  OpenItems.prototype.reset = function () {
    BaseCollection.prototype.reset.apply(this.activeHistory, arguments);
    BaseCollection.prototype.reset.apply(this, arguments);
  };

  OpenItems.prototype.addWebView = function (data) {
    if (!data) {
      data = {};
    }
    if (!data.name) {
      data.name = 'Web View';
    }
    var webView = new WebView(data);
    this.add(webView);
    return webView;
  };

  OpenItems.prototype.addTerminal = function (data) {
    if (!data) {
      data = {};
    }
    if (!data.name) {
      data.name = 'Terminal';
    }
    var terminal = new Terminal(data);
    this.add(terminal);
    return terminal;
  };

  OpenItems.prototype.addBuildStream = function (data) {
    if (!data) {
      data = {};
    }
    if (!data.name) {
      data.name = 'Build Logs';
    }
    if (this.hasOpen('BuildStream')) {
      var currStream = this.getFirst('BuildStream');
      this.activeHistory.add(currStream);
      return currStream;
    }
    var buildStream = new BuildStream(data);
    this.add(buildStream);
    return buildStream;
  };

  OpenItems.prototype.addLogs = function (data) {
    if (!data) {
      data = {};
    }
    if (!data.name) {
      data.name = 'Box Logs';
    }
    if (this.hasOpen('LogView')) {
      var currStream = this.getFirst('LogView');
      this.activeHistory.add(currStream);
      return currStream;
    }
    var logView = new LogView(data);
    this.add(logView);
    return logView;
  };

  OpenItems.prototype.addEnvVars = function (data) {
    if (!data) {
      data = {};
    }
    if (!data.name) {
      data.name = 'Env Vars';
    }
    if (this.hasOpen('EnvVars')) {
      var currentEnvVars = this.getFirst('EnvVars');
      this.activeHistory.add(currentEnvVars);
      return currentEnvVars;
    }
    var envVars = new EnvVars(data);
    this.add(envVars);
    return envVars;
  };

  OpenItems.prototype.Model = true;

  OpenItems.prototype.instanceOfModel = instanceOfModel;

  OpenItems.prototype.isFile = function (model) {
    return (model instanceof VersionFileModel ||
      model instanceof ContainerFileModel);
  };

  OpenItems.prototype.newModel = newModel;

  OpenItems.prototype.add = function (model) {
    var self = this;
    if (Array.isArray(model)) {
      model.forEach(function (model) {
        self.addOne(model);
      });
      return;
    }
    this.addOne(model);
    this.saveState();
  };

  OpenItems.prototype.addOne = function (model) {
    if (!this.instanceOfModel(model)) {
      throw new Error('Trying to add a non-model');
    }
    model.state = model.state || {
      reset: function () {
        model.state.body = model.attrs.body;
      }
    };
    if (model instanceof Terminal) {
      model.state.type = 'Terminal';
    } else if (model instanceof WebView) {
      model.state.type = 'WebView';
    } else if (model instanceof BuildStream) {
      model.state.type = 'BuildStream';
    } else if (model instanceof LogView) {
      model.state.type = 'LogView';
    } else if (model instanceof EnvVars) {
      model.state.type = 'EnvVars';
    } else {
      keypather.set(model, 'state.type', 'File');
      model.state.reset = function () {
        model.state.body = model.attrs.body;
      };
    }
    model.state.open = true;
    model.state.reset();
    this.activeHistory.add(model);
    BaseCollection.prototype.add.apply(this, arguments);
    return this;
  };

  OpenItems.prototype.isClean = function () {
    var models = this.models;
    for (var i = 0; i < models.length; i++) {
      if (models[i].state.type === 'File' &&
        (models[i].state.isDirty || models[i].state.body !== models[i].attrs.body)) {
        return false;
      }
    }
    return true;
  };

  OpenItems.prototype.remove = function (model) {
    model.state.open = false;
    if (this.contains(model)) {
      BaseCollection.prototype.remove.call(this, model);
    }
    this.activeHistory.remove(model);
    this.saveState();
    return this;
  };

  OpenItems.prototype.removeAllButLogs = function () {
    var models = this.models.slice();
    for (var i = 0; i < models.length; i++) {
      if (!(models[i] instanceof BuildStream)) {
        this.remove(models[i]);
      }
    }
  };

  OpenItems.prototype.toJSON = function () {
    var json = [];
    this.models.forEach(function (model) {
      var modelJSON = model.toJSON();
      // The following brought to you by IE not supporting Function.prototype.name
      var modelConstructor = model.constructor.toString().match(/function\s(\w*)/)[1];
      modelJSON.state = model.state;
      keypather.set(modelJSON, 'state.from', modelConstructor);
      if (modelConstructor === 'File') {
        keypather.set(modelJSON, 'state.parentPath', model.urlPath.replace('/files', ''));
      }
      json.push(modelJSON);
    });
    return json;
  };

  OpenItems.prototype.saveState = function () {
    if (!this.shortHash) {
      return;
    }
    $localStorage[this.shortHash] = this.toJSON();
  };

  OpenItems.prototype.hasOpen = function (type) {
    for (var i = this.models.length - 1; i >= 0; i--) {
      if (this.models[i].constructor.toString().match(/function\s(\w*)/)[1] === type) {
        return true;
      }
    }
    return false;
  };

  OpenItems.prototype.getFirst = function (type) {
    for (var i = this.models.length - 1; i >= 0; i--) {
      if (this.models[i].constructor.toString().match(/function\s(\w*)/)[1] === type) {
        return this.models[i];
      }
    }
    return false;
  };

  return OpenItems;

}
