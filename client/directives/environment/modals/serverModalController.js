'use strict';

require('app')
  .controller('ServerModalController', ServerModalController);

function ServerModalController (
  $scope,
  promisify,
  loadingPromises,
  keypather,
  eventTracking
) {

  this.openDockerfile = function () {
    var SMC = this;
    return promisify(SMC.state.contextVersion, 'fetchFile')('/Dockerfile')
      .then(function (dockerfile) {
        if (SMC.state.dockerfile) {
         SMC.openItems.remove(SMC.state.dockerfile);
        }
        if (dockerfile) {
          SMC.openItems.add(dockerfile);
        }
        SMC.state.dockerfile = dockerfile;
      });
  };

  this.isDirty = function  () {
    /*!
     *  Loading promises are clear when the modal is saved or cancelled.
     */
    var SMC = this;
    return loadingPromises.count(SMC.name) > 0 ||
      !angular.equals(
        keypather.get(SMC, 'instance.attrs.env'),
        keypather.get(SMC, 'state.opts.env')
      ) ||
      !SMC.openItems.isClean();
  };

  this.rebuildAndOrRedeploy = function () {
    var SMC = this;
    var toRebuild;
    var toRedeploy;
    // So we should do this watchPromise step first so that any tab that relies on losing focus
    // to change something will have enough time to add its promises to LoadingPromises
    return SMC.state.promises.contextVersion
      .then(function () {
        return loadingPromises.finished(SMC.name);
      })
      .then(function (promiseArrayLength) {
        // Since the initial deepCopy should be in here, we only care about > 1
        toRebuild = promiseArrayLength > 1 || SMC.openItems.getAllFileModels(true).length;

        toRedeploy = !toRebuild &&
          keypather.get(SMC, 'instance.attrs.env') !== keypather.get(SMC, 'state.opts.env');

        // If we are redeploying and the build is not finished we need to rebuild or suffer errors from API.
        if (toRedeploy && ['building', 'buildFailed', 'neverStarted'].includes(keypather.get(SMC, 'instance.status()'))) {
          toRedeploy = false;
          toRebuild = true;
        }

        if (!SMC.openItems.isClean()) {
          return SMC.openItems.updateAllFiles();
        }
      })
      .then(function () {
        if (toRebuild) {
          return buildBuild(SMC.state);
        }
        return SMC.state;
      })
      .then(function (state) {
        if (toRebuild || toRedeploy) {
          return promisify(SMC.instance, 'update')(state.opts);
        }
      })
      .then(function () {
        if (toRedeploy) {
          return promisify(SMC.instance, 'redeploy')();
        }
      });
  };

  function buildBuild(state) {
    eventTracking.triggeredBuild(false);
    return promisify(state.build, 'build')({ message: 'manual' })
      .then(function (build) {
        state.opts.build = build.id();
        return state;
      });
  }

}

