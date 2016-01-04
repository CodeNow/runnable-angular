'use strict';

require('array.prototype.find');
var config = require('./ghost.conf.js');
var Promise = require("bluebird");

var GhostInspector = require('ghost-inspector')(config.apiKey);
Promise.promisifyAll(GhostInspector);

var suitesPromise = GhostInspector.getSuitesAsync();

function getSuiteId(suiteName) {
  return suitesPromise
    .then(function (suites) {
      return suites.find(function (suite) {
        return suite.name === suiteName;
      });
    })
    .then(function (suite) {
      if (!suite) {
        throw 'Suite not found! ' + suiteName;
      }
      return suite._id;
    });
}


function getTestUser() {
  return Promise.resolve({
    username: 'RunnableTest20'
  });
}


function handleTestResults(testResults) {
  var testList = testResults[0];
  var testPassing = testResults[1];
  if (!testPassing) {
    var lastTest = testList[testList.length - 1];
    throw 'Failed test: ' + lastTest.testName + ' --> https://app.ghostinspector.com/tests/' + lastTest.test;
  }
  console.log(testList.length + ' Test(s) Passed!');
}


var userPromise = getTestUser();

userPromise.then(function (user) {
  console.log('Running tests with user:  ' + user.username);

  var testOptions = {
    githubUser: user.username,
    startUrl: 'https://runnable-angular-staging-codenow.runnableapp.com',
    customUserAgent: 'e2e-tests'
  };

  var testPromise = Promise.resolve();
  console.log('Setting up tests!');
  config.suites.forEach(function (suiteName) {
    testPromise = testPromise
      .then(function () {
        return getSuiteId(suiteName);
      })
      .then(function (suiteId) {
        console.log('Running suite: ' +  suiteName);
        return GhostInspector.executeSuiteAsync(suiteId, testOptions);
      })
      .then(handleTestResults);
  });


  function teardownTests() {
    console.log('Start Teardown');
    return getSuiteId(config.teardown)
      .then(function (suiteId) {
        return GhostInspector.executeSuiteAsync(suiteId, testOptions);
      })
      .then(handleTestResults)
      .catch(function (err) {
        console.error('Error tearing down tests!!!!');
        console.error(err);
        throw err;
      });
  }

  testPromise
    .then(function () {
      return teardownTests()
        .then(function () {
          console.log('All Tests Finished!');
        })
        .then(function () {
          process.exit(0);
        })
        .catch(function () {
          process.exit(1);
        });
    })
    .catch(function (e) {
      console.error(e);
      teardownTests()
        .finally(function () {
          process.exit(1);
        });
    });
});
