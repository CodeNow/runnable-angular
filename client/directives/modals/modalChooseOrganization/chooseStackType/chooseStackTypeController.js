'use strict';

require('app')
  .controller('ChooseStackTypeController', ChooseStackTypeController);
function ChooseStackTypeController(
  errs,
  github,
  loading
) {
  var CSTC = this;
  CSTC.pickStack = function (stackId, repoName) {
    var targetOrg = prompt('Org Name', 'P4L-kahn-1');
    if (targetOrg) {
      loading('stack' + stackId, true);
      loading('demoStack', true);
      github.forkRepo('RunnableDemo', repoName, targetOrg)
        .catch(errs.handler)
        .finally(function () {
          loading('stack' + stackId, false);
          loading('demoStack', false);
        });
    }
  };
}
