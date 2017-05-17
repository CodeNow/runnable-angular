'use strict';

var BaseModel = require('@runnable/api-client/lib/models/base');
var VersionFileModel = require('@runnable/api-client/lib/models/context/version/file');
var ContainerFileModel = require('@runnable/api-client/lib/models/instance/container/file');
var DebugFileModel = require('@runnable/api-client/lib/models/debug-container/file');
var util = require('util');

require('app')
  .factory('OpenItems', openItemsFactory);
/**
 * @ngInject
 */
function openItemsFactory(
  $localStorage,
  $q,
  keypather,
  promisify
) {

  function instanceOfModel(model) {
    return (model instanceof VersionFileModel ||
      model instanceof ContainerFileModel ||
      model instanceof Terminal ||
      model instanceof LogView ||
      model instanceof EnvVars ||
      model instanceof DebugFileModel ||
      model instanceof BackupStream ||
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

  function BuildStream(data) {
    this.collections = [];
    this.attrs = data || {};
    this.attrs._id = i++;
    this.hideClose = true;
    return this;
  }

  function BackupStream(data) {
    this.collections = [];
    this.attrs = data || {};
    this.attrs._id = i++;
    return this;
  }

  function LogView(data) {
    this.collections = [];
    this.attrs = data || {};
    this.attrs._id = i++;
    this.hideClose = true;
    return this;
  }

  function EnvVars(data) {
    this.collections = [];
    this.attrs = data || {};
    this.attrs._id = i++;
    return this;
  }

  util.inherits(Terminal, BaseModel);
  util.inherits(BuildStream, BaseModel);
  util.inherits(BackupStream, BaseModel);
  util.inherits(LogView, BaseModel);
  util.inherits(EnvVars, BaseModel);

  var tabTypes = {
    Terminal: Terminal,
    BuildStream: BuildStream,
    BackupStream: BackupStream,
    LogView: LogView,
    EnvVars: EnvVars,
    File: ContainerFileModel
  };

  function ActiveHistory(models) {
    this.models = models || [];
  }

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
    if (!this.models.includes(model)) {
      this.models.push(model);
    } else {
      this.remove(model);
      this.add(model);
    }
    return this;
  };

  ActiveHistory.prototype.remove = function (model) {
    var index = this.models.indexOf(model);
    if (index >= 0) {
      this.models.splice(index, 1);
      if (model.state.active) {
        model.state.active = false;
        if (this.last()) {
          this.last().state.active = true;
        }
      }
    }
  };

  ActiveHistory.prototype.last = function () {
    if (this.models.length) {
      return this.models[this.models.length - 1];
    }
  };

  ActiveHistory.prototype.reset = function () {
    this.models.splice(0, this.models.length);
  };
  function OpenItems() {
    this.keys = {};
    this.models = [];
    this.activeHistory = new ActiveHistory();
    this.previouslyActiveTab = null;

    // Use these for the event emitters, so it's easily to remove them
    this.boundRemove = this.remove.bind(this);
    this.boundSaveState = this.saveState.bind(this);
  }

  var defaultTabs = {
    'BuildStream': 'Build Logs',
    'LogView': 'CMD Logs',
    'Terminal': 'Terminal'
  };
  OpenItems.prototype.retrieveTabs = function(container) {
    var models = keypather.get($localStorage, this.keys.instanceId) || [];
    var missingTabs = Object.keys(defaultTabs).slice(); // clone
    if (models.length) {
      this.previouslyActiveTab = models.find(function (m) {
        return keypather.get(m, 'state.active');
      });
      this.fromCache = true;

      models = models.map(function (model) {
        var from = keypather.get(model, 'state.from');
        if (tabTypes[from]) {
          if (from === 'File') {
            // safe to assume ContainerFileModel,
            // caching not present on instance.instanceEdit
            model = container.newFile(model);
          } else {
            if (missingTabs.includes(from)) {
              missingTabs.splice(missingTabs.indexOf(from), 1);
            }
            model = new tabTypes[from](model, {
              noStore: true
            });
          }
        }
        return model;
      });
    }
    var missingModels = missingTabs.map(function (type) {
      return new tabTypes[type]({
        name: defaultTabs[type]
      }, {
        noStore: true
      });
    });
    models = models.concat(missingModels);
    this.reset(models);
  };

  // Set item in localStorage serialized cache to active
  // after other tabs have been added
  OpenItems.prototype.restoreActiveTab = function () {
    if (this.previouslyActiveTab) {
      var model = this.models.find(function (model) {
        return (model.id() === keypather.get(this, 'previouslyActiveTab._id'));
      }.bind(this));
      if (model) {
        this.activeHistory.add(model);
      }
    }
  };

  OpenItems.prototype.restoreTabs = function(keys, container) {
    this.keys = keys;
    this.retrieveTabs(container);
  };

  OpenItems.prototype.reset = function (models) {
    this.models.forEach(this.unbindFileModel.bind(this));
    this.models.splice(0, this.models.length);
    this.activeHistory.reset();
    this.add(models);
    // if we have the 3 default tabs open
    if (Object.keys(defaultTabs).length === 3 && !this.hasOpen('ContainerFileModel')) {
      // select the log tab
      this.addLogs();
    }
  };

  OpenItems.prototype.addTerminal = function (data) {
    if (!data) {
      data = {};
    }
    if (!data.name) {
      data.name = defaultTabs.Terminal;
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
      data.name = defaultTabs.BuildStream;
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

  OpenItems.prototype.addBackupStream = function (data) {
    if (!data) {
      data = {};
    }
    if (!data.name) {
      data.name = 'Backup';
    }
    if (this.hasOpen('BackupStream')) {
      var currStream = this.getFirst('BackupStream');
      this.activeHistory.add(currStream);
      return currStream;
    }
    var backupStream = new BackupStream(data);
    this.add(backupStream);
    return backupStream;
  };

  OpenItems.prototype.addLogs = function (data) {
    if (!data) {
      data = {};
    }
    if (!data.name) {
      data.name = defaultTabs.LogView;
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
      model instanceof ContainerFileModel ||
      model instanceof DebugFileModel);
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
    var self = this;
    if (!this.instanceOfModel(model)) {
      throw new Error('Trying to add a non-model');
    }
    model.state = model.state || {
        reset: function () {
          model.state.body = model.attrs.body;
        },
        saveState: function () {
          self.saveState();
        }
    };
    if (model instanceof Terminal) {
      model.state.type = 'Terminal';
    } else if (model instanceof BuildStream) {
      model.state.type = 'BuildStream';
    } else if (model instanceof LogView) {
      model.state.type = 'LogView';
    } else if (model instanceof EnvVars) {
      model.state.type = 'EnvVars';
    } else if (model instanceof BackupStream) {
      model.state.type = 'BackupStream';
    } else {
      keypather.set(model, 'state.type', 'File');
      model.state.reset = function () {
        model.state.body = model.attrs.body;
      };
      this.bindFileModel(model);
    }
    if (!model.state.open) {
      model.state.open = true;
      model.state.reset();
    }
    this.activeHistory.add(model);
    if (!this.models.includes(model)) {
      this.models.push(model);
    }
    return this;
  };

  OpenItems.prototype.isClean = function () {
    var models = this.models;
    for (var i = 0; i < models.length; i++) {
      if (models[i].state.type === 'File' && (models[i].state.isDirty ||
            models[i].state.body !== undefined && (models[i].state.body !== models[i].attrs.body))) {
        return false;
      }
    }
    return true;
  };

  OpenItems.prototype.getAllFileModels = function (isDirty) {
    var self = this;
    var shouldCheckIsDirty = !!arguments.length;
    return this.models.filter(function (model) {
      return self.isFile(model) && (!shouldCheckIsDirty || model.state.isDirty && isDirty);
    });
  };

  OpenItems.prototype.updateAllFiles = function () {
    var self = this;
    var shouldCheckIsDirty = !!arguments.length;
    return $q.all(this.getAllFileModels(true).map(function (model) {
      return promisify(model, 'update')({
        json: {
          body: model.state.body
        }
      });
    }));
  };

  OpenItems.prototype.unbindFileModel = function (model) {
    var self = this;
    model.off('update', self.boundSaveState);
    model.off('destroy', self.boundRemove);
  };

  OpenItems.prototype.bindFileModel = function (model) {
    var self = this;
    model.once('destroy', self.boundRemove);
    model.on('update', self.boundSaveState);
  };

  OpenItems.prototype.remove = function (model, ignoreState) {
    var index = this.models.indexOf(model);
    if (index >= 0) {
      keypather.set(model, 'state.open', false);
      this.unbindFileModel(model);
      this.models.splice(index, 1);
      this.activeHistory.remove(model);
      if (!ignoreState) {
        this.saveState();
      }
      return this;
    }
  };

  OpenItems.prototype.removeAllButBuildLogs = function () {
    var models = this.models.slice();
    for (var i = 0; i < models.length; i++) {
      if (!(models[i] instanceof BuildStream)) {
        this.remove(models[i], true);
      }
    }
    this.addBuildStream();
  };

  /**
   * Removes everything from openItems except for the BuildStream and the Box Logs
   */
  OpenItems.prototype.removeAllButLogs = function () {
    var models = this.models.slice();
    for (var i = 0; i < models.length; i++) {
      if (!(models[i] instanceof LogView || models[i] instanceof BuildStream)) {
        this.remove(models[i], true);
      } else if (models[i] instanceof LogView) {
        this.activeHistory.add(models[i]);
      }
    }
    this.addBuildStream();
    this.addLogs();
  };

  OpenItems.prototype.removeAndReopen = function (fileModel) {
    var models = this.models.slice();
    for (var i = 0; i < models.length; i++) {
      if (!(models[i] instanceof BuildStream)) {
        this.remove(models[i]);
        if (this.isFile(models[i])) {
          var id = models[i].id();
          this.add(fileModel.newFile(id));
        }
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
    if (!keypather.get(this, 'keys.instanceId')){
      return;
    }
    var state = this.toJSON();
    $localStorage[this.keys.instanceId] = state;
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
