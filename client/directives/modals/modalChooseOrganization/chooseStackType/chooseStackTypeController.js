'use strict';

require('app')
  .controller('ChooseStackTypeController', ChooseStackTypeController);
function ChooseStackTypeController(
  errs,
  github,
  keypather,
  loading
) {
  var CSTC = this;
  CSTC.pickStack = function (stackId, repoName) {
    var orgName = keypather.get(CSTC.targetOrg, 'attrs.login');
    if (orgName) {
      loading('stack' + stackId, true);
      loading('demoStack', true);
      github.forkRepo('RunnableDemo', repoName, orgName)
        .then(function () {
          return CSTC.createDock(orgName);
        })
        .catch(errs.handler)
        .finally(function () {
          loading('stack' + stackId, false);
          loading('demoStack', false);
        });
    }
  };
}
