'use strict';

describe('findLinkedServerVariables'.bold.underline.blue, function () {
  var findLinkedServerVariables;
  function initState () {

    angular.mock.module('app', function ($provide) {
      $provide.value('configUserContentDomain', 'runnableapp.com');
      $provide.value('$state', {
        params: {
          userName: 'SomeKittens'
        }
      });
    });

    angular.mock.inject(function (_findLinkedServerVariables_) {
      findLinkedServerVariables = _findLinkedServerVariables_;
    });
  }
  beforeEach(initState);

  it('should not have an identity crisis', function () {
    expect(findLinkedServerVariables).to.be.a('function');
  });

  it('should find results in a reasonably-complex env', function () {
    var env = [
      'blar=http://PostgreSQL-staging-SomeKittens.runnable2.net:123',
      'a=PostgreSQL-staging-SomeKittens.runnableapp.com',
      'a=http://PostgreSQL-staging-SomeKittens.runnableapp.com',
      'c=e.mail.google.com',
      'd=a-random-server-SomeKittens.runnable2.net'
    ].join('\n');

    var results = findLinkedServerVariables(env);

    expect(results).to.deep.equal([
      'PostgreSQL-staging-SomeKittens.runnableapp.com',
      'http://PostgreSQL-staging-SomeKittens.runnableapp.com'
    ]);
  });

  it('does the same as above in array form', function () {
    var env = [
      'blar=http://PostgreSQL-staging-SomeKittens.runnable2.net:123',
      'a=PostgreSQL-staging-SomeKittens.runnableapp.com',
      'a=http://PostgreSQL-staging-SomeKittens.runnableapp.com',
      'c=e.mail.google.com',
      'd=a-random-server-SomeKittens.runnable2.net'
    ];

    var results = findLinkedServerVariables(env);

    expect(results).to.deep.equal([
      'PostgreSQL-staging-SomeKittens.runnableapp.com',
      'http://PostgreSQL-staging-SomeKittens.runnableapp.com'
    ]);
  });
});
