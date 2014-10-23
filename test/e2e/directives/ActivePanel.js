var util = require('../helpers/util');

function ActivePanel () {
  this.activePanel = util.createGetter(by.css('#wrapper > main > section.views.with-add-tab.ng-scope > div.active-panel.ng-scope.loaded.ace-runnable-dark'));



}

module.exports = ActivePanel;