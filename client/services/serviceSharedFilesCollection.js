require('app')
  .factory('SharedFilesCollection', factory);
/**
 * @ngInject
 */
function factory(
  keypather,
  $timeout
) {

  function SharedFilesCollection(filesCollection, $scope) {
    this.$scope = $scope;
    this.collection = filesCollection;
    this.activeFile = null;
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
    this.collection.add(model);
    this.setActiveFile(model);
  };

  SharedFilesCollection.prototype.reset = function () {
    this.collection.models.forEach(function (model) {
      if (model.attrs.body) {
        model.attrs.body = model.attrs.originalBody;
      }
      if (model.state.dirty) {
        model.state.dirty = false;
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
    try {
      this.collection.models.filter(function (model) {
        return keypather.get(model, 'state.active');
      }).forEach(function (model) {
        keypather.set(model, 'state.active', false);
      });
    } catch (e) {}
    try {
      keypather.set(
        model,
        'state.active',
        true
      );
      this.activeFile = model;
      var _this = this;
      model.fetch(function () {
        model.originalBody = model.attrs.body;
        _this.activeFile = model;

        _this.$scope.safeApply();
      });
    } catch (e) {}
  };

  SharedFilesCollection.prototype.isClean = function () {
    var models = this.collection.models;
    for (var i = 0; i < models.length; i++) {
      if (models[i].attrs.body && models[i].state.dirty) {
        return false;
      }
    }
    return true;
  };

  return SharedFilesCollection;
}
