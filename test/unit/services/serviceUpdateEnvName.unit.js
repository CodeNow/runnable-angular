'use strict';

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

var keypather;

function testModels() {
  var models = [
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
      changes: {
        morange: [2],
        'banana.mana': [0],
        orange: [1]
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
  models = models.map(createUrl);
  return models;
}

function createUrl (model, index) {
  var url = (index % 2) ? 'http://' : '';
  url += model.attrs.name + '.user.runnable.io';
  url += (index % 3) ? ':80' : '';
  model.containers = {
    models: [{
      urls: function () {
        return [url];
      }
    }]
  };
  return model;
}

function getModelNameArray(model) {
  return model.map(function(value) {
    return value.attrs.name;
  });
}

function createItems(rootInstance) {
  var temp = [rootInstance].concat(rootInstance.dependencies.models);
  return temp.map(function (instance) {
    return {
      instance: instance,
      attrs: {
        env: instance.attrs.env
      }
    };
  });
}

function testRoot(models) {
  var model =  {
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
    dependencies: {
      models: models || testModels()
    },
    changes: {
      morange: [0, 3],
      orange: [2],
      banana: [4],
      apple: [1],
      'banana.mana': [5],
      user: [7]
    }
  };
  model = createUrl(model, 0);
  return model;
}

describe('serviceUpdateEnvName'.bold.underline.blue, function () {
  var updateEnvName;
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
        ['empty everything', null],
        ['empty items array', [] ]
      ].forEach(function (testArray) {
          it('should handle ' + testArray[0], function () {
            var result = updateEnvName(testArray[1]);
            expect(result).to.be.false;
          });
        });
    });
  });
  describe('editing a single entry', function () {
    it('renaming apple should only affect root', function () {
      var root = testRoot();
      var items = createItems(root);
      keypather.set(items[1], 'opts.name', 'chicken');
      var result = updateEnvName(items);
      expect(result).to.be.true;
      expect(items[0].opts).to.exist;
      expect(items[0].opts.env).to.exist;
      expect(items[0].opts.env.length).to.eql(root.attrs.env.length);
      compareArrays(items[0].opts.env, root.attrs.env, [1]);
      expect(items[0].opts.env[1]).to.eql('b =http://chicken.user.runnable.io');

    });
    it('renaming root should only affect itself', function () {
      var root = testRoot();
      var items = createItems(root);
      keypather.set(items[0], 'opts.name', 'chicken');
      var result = updateEnvName(items);
      expect(result).to.be.true;
      expect(items[0].opts).to.exist;
      expect(items[0].opts.env).to.exist;
      expect(items[0].opts.env.length).to.eql(root.attrs.env.length);
      compareArrays(items[0].opts.env, root.attrs.env, [6]);
      expect(items[0].opts.env[6]).to.eql('f= chicken.user.runnable.io:2031/github/api');
    });
  });

  describe('editing 2 entries', function () {
    it('renaming apple and root will change 2 envs on root', function () {
      var root = testRoot();
      var items = createItems(root);
      keypather.set(items[1], 'opts.name', 'chicken');
      keypather.set(items[0], 'opts.name', 'beef');
      var result = updateEnvName(items);
      expect(result).to.be.true;
      expect(items[0].opts).to.exist;
      expect(items[0].opts.env).to.exist;
      expect(items[0].opts.env.length).to.eql(root.attrs.env.length);
      compareArrays(items[0].opts.env, root.attrs.env, [1, 6]);
      expect(items[0].opts.env[1]).to.eql('b =http://chicken.user.runnable.io');
      expect(items[0].opts.env[6]).to.eql('f= beef.user.runnable.io:2031/github/api');
    });
  });
  it('should work with renaming everything', function () {
    var root = testRoot();
    var items = createItems(root);
    items.forEach(function (item, INSTANCE_INDEX) {

      var testItems = createItems(testRoot());
      keypather.set(testItems[INSTANCE_INDEX], 'opts.name', 'chicken');
      var result = updateEnvName(testItems);
      expect(result).to.be.true;

      testItems.forEach(function (testItem) {
        var expectedChanges = keypather.get(testItem.instance, 'changes.' + item.instance.attrs.name);
        if (expectedChanges) {
          compareArrays(testItem.opts.env, testItem.instance.attrs.env, expectedChanges);
          expect(keypather.get(testItem, 'opts.env.length')).to.eql(testItem.instance.attrs.env.length);
        }
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
