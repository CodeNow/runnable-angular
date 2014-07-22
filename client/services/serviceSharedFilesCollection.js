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
    this.setActiveFile(filesCollection.models[0]);
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
      model = model.fetch(function () {
        $timeout(function () {
          _this.$scope.$apply();
        });
      });
    } catch (e) {}
  };
  return SharedFilesCollection;
}
