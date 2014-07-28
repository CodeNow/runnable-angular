require('app')
  .factory('SharedFilesCollection', factory);
/**
 * @ngInject
 */
function factory(
  keypather,
  $timeout,
  pluck,
  equals
) {

  function SharedFilesCollection(filesCollection, $scope) {
    this.$scope = $scope;
    this.collection = filesCollection;
    this.activeFile = null;
    this.fileStates = {};
  }

  SharedFilesCollection.prototype.remove = function (model) {
    var i = this.collection.models.indexOf(model);
    if (i === -1) return;
    keypather.set(model, 'state.active', false);
    keypather.set(model, 'state.open', false);
    this.collection.models.splice(i, 1);
    delete this.collection.modelsHash[model.id()];
  };

  SharedFilesCollection.prototype.add = function (model) {
    if (!(model instanceof this.collection.FileModel)) {
      throw new Error('model is not correct type');
    }
    keypather.set(model, 'state.open', true);
    if (!(model.id() in this.collection.modelsHash)) {
      model.state = null; // reset state
    }
    this.collection.add(model);
    this.setActiveFile(model);
  };

  SharedFilesCollection.prototype.reset = function () {
    this.collection.models.forEach(function (model) {
      if (model.state) {
        model.state.reset();
      }
    });
    this.$scope.safeApply();
  };

  SharedFilesCollection.prototype.checkActiveDirty = function (fileCloneBody) {
    var dirty = fileCloneBody !== this.activeFile.originalBody;
    keypather.set(this.activeFile, 'state.dirty', dirty);
    this.$scope.safeApply();
    return dirty;
  };

  SharedFilesCollection.prototype.setActiveFile = function (model) {
    if (!(model instanceof this.collection.FileModel)) {
      throw new Error('model is not correct type');
    }
    if (!(model.id() in this.collection.modelsHash)) {
      throw new Error('file is not open');
    }
    if (this.activeFile) {
      delete this.activeFile.state.active;
    }
    this.activeFile = model;
    if (!this.activeFile.state) {
      this.activeFile.state = model.json();
      this.activeFile.state.active = true;
      this.activeFile.state.isDirty = function () {
        return model.state.body !== model.attrs.body;
      };
      this.activeFile.state.reset = function () {
        model.state.body = model.attrs.body;
      };
    }
    this.$scope.safeApply();
  };

  SharedFilesCollection.prototype.isClean = function () {
    return this.collection.models
      .every(composeAll(pluck('state.isDirty()'), Boolean, equals(false)));
  };

  return SharedFilesCollection;
}

function (g, f) {
  return function (x) {
    return f(g(x));
  }
}

function composeAll () {
  var fns = Array.prototype.slice.call(arguments);
  return function (x) {
    return fns.reduce(compose, x);
  };
}
