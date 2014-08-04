var BaseCollection = require('runnable/lib/collections/base');
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
  equals
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
    this.activeHistory = new BaseCollection([], { noStore: true });
  }

  util.inherits(OpenItems, BaseCollection);

  OpenItems.prototype.Model = true;

  OpenItems.prototype.instanceOfModel = function (model) {
    return (model instanceof this.DirModel ||
            model instanceof this.FileModel ||
            model instanceof Terminal ||
            model instanceof WebView);
  };

  OpenItems.prototype.newModel = function (modelOrAttrs, opts) {
    throw new Error('you are doing it wrong');
  };

  OpenItems.prototype.add = function (model) {
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
    var isActive = model.state.active;
    BaseCollection.prototype.remove(model);
    if (isActive) {
      this.activeHistory.remove(model);
      if (this.activeHistory.last()) {
        this.activeHistory.last().state.active = true;
      }
    }
    return this;
  };

  return OpenItems;

}
