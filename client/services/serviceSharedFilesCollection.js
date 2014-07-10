var keypather = require('keypather')();

require('app')
  .factory('sharedFilesCollection', factory);
/**
 * @ngInject
 */
function factory () {

  function SharedFilesCollection (filesCollection) {
    this.collection = filesCollection;
  }

  SharedFilesCollection.prototype.add = function (model) {
    if (!(model instanceof this.collection.FileModel)) {
      throw new Error('model is not corrent type');
    }
    keypather.set(model, 'state.open', true);
    this.collection.add(model);
    this.setActiveFile(model);
  };

  ShareFilesCollection.prototype.setActiveFile = function (model) {
    if (!(model instanceof this.collection.FileModel)) {
      throw new Error('model is not corrent type');
    }
    if (!(model.id() in this.collection.modelsHash)) {
      throw new Error('file is not open');
    }
    try {
      keypather.set(
        this.collection.find({'state.active': true}),
        'state.active',
        false
      );
    } catch (e) {}
    try {
      keypather.set(
        model,
        'state.active',
        true
      );
    } catch (e) {}
  };

  return SharedFilesCollection;
}

