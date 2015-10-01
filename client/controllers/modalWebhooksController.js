'use strict';

require('app')
  .controller('ConfirmationModalController', ConfirmationModalController);

function ConfirmationModalController(
  $scope,
  close
) {
  var MWC = this;
  $scope.$on('changed-animated-panel',function(evt, panelName){
    MWC.currentPanel = panelName;
  });
  MWC.actions = {
    confirm: function () {
      close(true);
    },
    cancel: function () {
      close(false);
    }
  };
}
