require('app')
  .filter('triggeredAction', repoTriggeredAction);
/**
 * @ngInject
 */
function repoTriggeredAction() {
  return function (triggeredAction) {
    if (!triggeredAction) { return; }
    if (triggeredAction.manual) {
      return 'Manual';
    }
    else if (triggeredAction.rebuild) {
      return 'Rebuild';
    }
    else { // assume github
      var appCodeVersion = triggeredAction.appCodeVersion;
      return appCodeVersion.repo+'#'+appCodeVersion.repo;
    }
  };
}