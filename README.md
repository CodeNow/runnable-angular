# [Runnable](http://runnable.com/)
The front-end for Runnable's environment management platform.
asasdadsadsads
[![
  CircleCI Status
 ](https://circleci.com/gh/CodeNow/runnable-angular.png?circle-token=979bf08a16049c22ca0f7f7e01cb523ce9dbfcac)
](https://circleci.com/gh/CodeNow/runnable-angular)

[![
  SauceLabs Status
 ](https://saucelabs.com/browser-matrix/runnable.svg?auth=9a8a382b89d804503547b9feda1eb36c)
](https://saucelabs.com/u/runnable)

###Instructions
- `grunt`: execute `grunt build` to start a server and serve app at http://localhost:3001
- `grunt build`: compile jade/sass, concat files, move compiled files into client/build/
- `grunt test:watch`: run tests on fs changes
- `grunt test`: run tests
- `npm start`: build & start production environment

###Requirements
- node ~0.10.30
- npm ~1.4.20
- browserify@~5.9.1

###Testing
Unit Tests
```bash
grunt test
```

E2E tests
```bash
webdriver-manager start;
npm run e2e
```
You can also pass credentials to protractor
```bash
protractor ./test/protractor.conf.js --params.user SomeKittens --params.password hunter2
```

## Tagging
1. `npm version [type]`
2. `git push origin --tags`

## Adding Static Assets

Currently, this repo depends on the built assets from [runnable.com](github.com/CodeNow/runnable.com). In order to update these assets, just copy them into this repo. This is a temporary solution.

1. On runnable.com, checkout master and run `gulp build`
2. On runnable-angular, checkout and pull master, then create a branch
3. Run `cp -R  ../runnable.com/dist/* runnable.com/`
4. Push and create a PR
5. After merging PR, deploy runnable-angular

###Contributors
<img src="https://avatars3.githubusercontent.com/u/7440805?s=64" width="64">&nbsp;
[Taylor Dolan (taylordolan)](https://github.com/taylordolan)

<img src="https://avatars3.githubusercontent.com/u/495765?s=64">&nbsp;
[Ryan Kahn (Myztiq)](https://github.com/Myztiq)

<img src="https://avatars1.githubusercontent.com/u/6379413?s=64">&nbsp;
[Nathan Meyers (Nathan219)](https://github.com/Nathan219)

<img src="https://avatars1.githubusercontent.com/u/429706?v=3&s=64">&nbsp;
[Anton Podviaznikov (podviaznikov)](https://github.com/podviaznikov)

<img src="https://s.gravatar.com/avatar/b613d7470bc5eb09b8c73223b4ee8a4e?s=64">&nbsp;
[Anandkumar Patel (anandkumarpatel)](https://github.com/anandkumarpatel)

<img src="http://www.gravatar.com/avatar/049d9ce7bb813b262d32f6ebe4bb6fe5?s=64">&nbsp;
[Tejesh Mehta (tjmehta)](https://github.com/tjmehta)

<img src="http://www.gravatar.com/avatar/452e4a4c93d2ffba9999b03cea258206?s=64">&nbsp;
[Tony Li (runnabro)](https://github.com/runnabro)

<img src="http://www.gravatar.com/avatar/fd3c806f94926cbe683f3ddc878ae4d3?s=64">&nbsp;
[Casey Flynn (cflynn07)](https://github.com/cflynn07)

<img src="http://www.gravatar.com/avatar/12d7b42352806d7d85ec8746ca018d97?s=64">&nbsp;
[Jorge R. Silva(thejsj)](https://github.com/thejsj)

<img src="http://www.gravatar.com/avatar/51bb06dc450d9f962f64891b840e43ab?s=64">&nbsp;
[Damien Hayeck(damienrunnable)](https://github.com/damienrunnable)
