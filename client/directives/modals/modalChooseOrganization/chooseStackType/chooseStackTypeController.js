'use strict';

require('app')
  .controller('ChooseStackTypeController', ChooseStackTypeController);
function ChooseStackTypeController(
  errs,
  github,
  loading,
  keypather,

  // Bound to controller
  targetOrg
) {
  var CSTC = this;
  CSTC.pickStack = function (stackId, repoName) {
    var orgName = keypather.get(targetOrg, 'attrs.login');
    if (orgName) {
      loading('stack' + stackId, true);
      loading('demoStack', true);
      github.forkRepo('RunnableDemo', repoName, orgName)
        .catch(errs.handler)
        .finally(function () {
          loading('stack' + stackId, false);
          loading('demoStack', false);
        });
    }
  };
}
