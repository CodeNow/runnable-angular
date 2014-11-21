/**
 * Things to test
 *
 * Root instance, no dependencies
 * Root instance, some deps, change name (shouldn't modify anything)
 *
 * depInstance name the same as the username in url
 * depInstance name same as 2 others, except minor change
 *
 * Have 5+ deps
 *  change at the top
 *  change at the bottom
 *  change with one envs having multiple matches
 *
 *
 */

function testModels() {
  return [
    {
      attrs: {
        name: 'apple',
        env: [
          'a=morange.user.runnable.io',
          'b =http://orange.user.runnable.io',
          'c = orange.user.runnable.io',
          'e = banana.user.runnable.io:2031/github/api',
          'f= banana.manana.user.runnable.io:2031/github/api',
          'c = user.user.runnable.io'
        ]
      },
      changes: {
        morange: [0],
        orange: [1, 2],
        banana: [3],
        'banana.mana': [4],
        user: [5]
      }
    }, {
      attrs: {
        name: 'morange',
        env: [
          'a= banana.manana.user.runnable.io:2031/github/api',
          'c = orange.user.runnable.io',
          'e = http://morange.user.runnable.io:1231'
        ]
      },
      state: {
        env: [
          'a= banana.user.runnable.io:2031/github/api',
          'c = user.user.runnable.io',
          'e = http://morange.user.runnable.io:1231'
        ]
      },
      changes: {
        morange: [2],
        banana: [0],
        user: [1]
      }
    }, {
      attrs: {
        name: 'user',
        env: [
          'a= banana.manana.user.runnable.io:2031/github/api',
          'c = orange.user.runnable.io'
        ]
      },
      changes: {
        orange: [1],
        'banana.mana': [0]
      }
    }, {
      attrs: {
        name: 'banana.manana',
        env: [
          'a = banana.user.runnable.io:2031/github/api'
        ]
      },
      changes: {
        banana: [0]
      }
    }, {
      attrs: {
        name: 'banana'
      }
    },
    {
      attrs: {
        name: 'orange'
      }
    }
  ];
}

function getModelNameArray(model) {
  return model.map(function(value) {
    return value.attrs.name;
  });
}

function testRoot(models) {
  return {
    attrs: {
      name: 'pineapple',
      env: [
        'a=morange.user.runnable.io',
        'b =http://apple.user.runnable.io',
        'c = orange.user.runnable.io',
        'd = https://morange.user.runnable.io:3232',
        'e = banana.user.runnable.io:2031/github/api',
        'f= banana.manana.user.runnable.io:2031/github/api',
        'f= pineapple.user.runnable.io:2031/github/api',
        'c = user.user.runnable.io'
      ]
    },
    state: {
      name: 'shmapple'
    },
    dependencies: {
      models: models || testModels()
    },
    changes: {
      morange: [0, 3],
      orange: [2],
      banana: [4],
      pineapple: [6],
      apple: [1],
      'banana.mana': [5],
      user: [7]
    }
  };
}

describe('serviceUpdateEnvName'.bold.underline.blue, function () {
  var updateEnvName, keypather;
  beforeEach(function () {
    angular.mock.module('app', function ($provide) {});
    angular.mock.inject(function (_updateEnvName_, _keypather_) {
      updateEnvName = _updateEnvName_;
      keypather = _keypather_;
    });
  });
  describe('basic operations'.blue, function () {
    describe('testing invalid input', function () {
      [
        ['empty everything', null, null, null, null],
        ['empty instance', null, 'a', 'b', testRoot()],
        ['empty rootInstance', testModels()[0], 'a', 'b', null],
        ['empty dependencies', testModels()[0], 'a', 'b', testModels()[1]],
        ['no name change', testModels()[1], 'a', 'b', testRoot()]
      ].forEach(function (testArray) {
          it('should handle ' + testArray[0], function () {
            var result = updateEnvName(testArray[1], testArray[2]);
            expect(result).to.be.false;
          });
        });
    });
  });
  describe('editing a single entry', function () {
    it('renaming apple should only affect root', function () {
      var instance = testModels()[0];
      var root = testRoot();
      var result = updateEnvName(instance, 'chicken', 'apple', root);
      expect(result).to.be.true;
      expect(root.state).to.exist;
      expect(root.state.env).to.exist;
      expect(root.state.env.length).to.eql(root.attrs.env.length);
      compareArrays(root.state.env, root.attrs.env, [1]);
      expect(root.state.env[1]).to.eql('b =http://chicken.user.runnable.io');

    });
    it('renaming root should only affect itself', function () {
      var root = testRoot();
      var result = updateEnvName(root, 'chicken', 'pineapple', root);
      expect(result).to.be.true;
      expect(root.state).to.exist;
      expect(root.state.env).to.exist;
      expect(root.state.env.length).to.eql(root.attrs.env.length);
      compareArrays(root.state.env, root.attrs.env, [6]);
      expect(root.state.env[6]).to.eql('f= chicken.user.runnable.io:2031/github/api');

    });
    it('renaming morange should update itself', function () {
      var originalInstance = testModels()[1];
      // This instance already has an state change
      expect(originalInstance.state.env).to.exist;
      var root = testRoot();
      var result = updateEnvName(originalInstance, 'chicken', 'morange', root);
      expect(result).to.be.true;
      var changedInstance = root.dependencies.models[1];
      expect(changedInstance.state).to.exist;
      expect(changedInstance.state.env).to.exist;
      // NOTE: comparing originalInstance, since it is the unchanged version
      expect(changedInstance.state.env.length).to.eql(originalInstance.state.env.length);
      compareArrays(changedInstance.state.env, originalInstance.state.env, [2]);
      expect(changedInstance.state.env[2]).to.eql('e = http://chicken.user.runnable.io:1231');
    });
  });
  describe('advanced editing', function () {
    it('renaming banana should change a lot', function () {
      var INSTANCE_NAME = 'banana';
      var INSTANCE_INDEX = 4;

      var originalDependencies = testModels();
      var instance = originalDependencies[INSTANCE_INDEX];
      expect(instance.attrs.name).to.eql(INSTANCE_NAME);
      var root = testRoot();
      var result = updateEnvName(instance, 'chicken', 'banana', root);
      expect(result).to.be.true;
      originalDependencies.forEach(function (ogDeps, index) {
        var ogEnvs = keypather.get(ogDeps, 'state.env') || ogDeps.attrs.env;
        var changedInstance = root.dependencies.models[index];
        var expectedChanges = keypather.get(changedInstance, 'changes.' + INSTANCE_NAME);
        if (expectedChanges) {
          compareArrays(changedInstance.state.env, ogEnvs, expectedChanges);
          expect(keypather.get(changedInstance, 'state.env.length')).to.eql(ogEnvs.length);
        }
      });
    });
    it('should work with renaming everything', function () {
      var originalDependencies = testModels();
      getModelNameArray(originalDependencies).forEach(function (INSTANCE_NAME, INSTANCE_INDEX) {
        var instance = originalDependencies[INSTANCE_INDEX];
        expect(instance.attrs.name).to.eql(INSTANCE_NAME);
        var root = testRoot();
        var result = updateEnvName(instance, 'chicken', INSTANCE_NAME, root);
        expect(result).to.be.true;
        originalDependencies.forEach(function (ogDeps, index) {
          var ogEnvs = keypather.get(ogDeps, 'state.env') || ogDeps.attrs.env;
          var changedInstance = root.dependencies.models[index];
          var expectedChanges = keypather.get(changedInstance, 'changes.' + INSTANCE_NAME);
          if (expectedChanges) {
            compareArrays(changedInstance.state.env, ogEnvs, expectedChanges);
            expect(keypather.get(changedInstance, 'state.env.length')).to.eql(ogEnvs.length);
          }
        });
      });
    });
  });
});

function compareArrays(array1, array2, notThese) {
  array1.forEach(function (item, index) {
    if (notThese.indexOf(index) < 0) {
      expect(item).to.eql(array2[index]);
    } else {
      expect(item).to.not.eql(array2[index]);
    }
  });
}