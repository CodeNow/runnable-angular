require('app')
  .filter('triggeredAction', filterTriggeredAction);
/**
 * @ngInject
 */
function filterTriggeredAction() {
  return function (triggeredAction) {
    if (!triggeredAction) { return; }
    if (triggeredAction.manual) {
      return 'Manual';
    }
    if (triggeredAction.rebuild) {
      return 'Rebuild';
    }
    // assume github
    var appCodeVersion = triggeredAction.appCodeVersion;
    return appCodeVersion.repo+'#'+appCodeVersion.repo;
  };
}
