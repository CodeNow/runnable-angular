Runnable 2.0
=============


[![
  CircleCI Status
 ](https://circleci.com/gh/CodeNow/runnable-angular.png?circle-token=979bf08a16049c22ca0f7f7e01cb523ce9dbfcac)
](https://circleci.com/gh/CodeNow/runnable-angular)

[![
  SauceLabs Status
 ](https://saucelabs.com/browser-matrix/runnable.svg?auth=9a8a382b89d804503547b9feda1eb36c)
](https://saucelabs.com/u/runnable)

The front-end for Runnable's sandbox management platform.

<img src="http://runnable.com/images/bear-alt.png" title="Runnable" alt="Runnable" align="right" height="300" style="position:relative;z-index:1;">

Instructions
-------------
- `grunt`: execute `grunt build` to start a server and serve app at http://localhost:3001
- `grunt build`: compile jade/sass, concat files, move compiled files into client/build/
- `grunt test:watch`: run tests on fs changes
- `grunt test`: run tests
- `npm start`: build & start production environment


First time instructions
------------------------
 - fork `CodeNow/stage-api` on runnable.io. Name your box `${YOUR_NAME}-api` e.x. `anton-api`. This would be your `${BOX_NAME}`
 - create your own GitHub App and
    - set `Homepage URL` to `http://${BOX_NAME}.codenow.runnable.io/`
    - set `Authorization callback URL` to `http://${BOX_NAME}.codenow.runnable.io/auth/github/callback`
 - update Dockerfile for your API box
    - set `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` to the values from your GitHub app
    - set `FULL_API_DOMAIN` to `http://${BOX_NAME}.codenow.runnable.io`
    - set `GITHUB_CALLBACK_URL` to `http://${BOX_NAME}.codenow.runnable.io/auth/github/callback`
    - set `GITHUB_HOOK_URL` to `http://${BOX_NAME}.codenow.runnable.io/actions/github`
 - run web app locally with `API_HOST=http://${BOX_NAME}.codenow.runnable.io grunt`
 - go to `http://localhost:3001?password=local` and signin with your GitHub

Requirements
------------
- node ~0.10.30
- npm ~1.4.20
- ruby ~2.0.0 (for SASS)
- browserify@~5.9.1

Testing
-------
```bash
# Unit Tests
karma start ./test/karma.conf.js

# E2E tests
webdriver-manager start;
karma start ./test/karma.conf.js [--single-run] (optional)
```

Contributors
-------------
<img src="https://avatars1.githubusercontent.com/u/429706?v=3&s=64">&nbsp;
[Anton Podviaznikov (podviaznikov)](https://github.com/podviaznikov)
San Francisco, CA, USA  
<img src="https://s.gravatar.com/avatar/b613d7470bc5eb09b8c73223b4ee8a4e?s=64">&nbsp;
[Anandkumar Patel (anandkumarpatel)](https://github.com/anandkumarpatel)
San Francisco, CA, USA  
<img src="http://www.gravatar.com/avatar/049d9ce7bb813b262d32f6ebe4bb6fe5?s=64">&nbsp;
[Tejesh Mehta (tjmehta)](https://github.com/tjmehta)
San Francisco, CA, USA  
<img src="http://www.gravatar.com/avatar/8f10852a80ca4794f50a304254cb123b?s=64">&nbsp;
[Randall Koutnik (SomeKittens)](https://github.com/SomeKittens)
San Francisco, CA, USA  
<img src="http://www.gravatar.com/avatar/452e4a4c93d2ffba9999b03cea258206?s=64">&nbsp;
[Tony Li (runnabro)](https://github.com/runnabro)
San Francisco, CA, USA  
<img src="http://www.gravatar.com/avatar/fd3c806f94926cbe683f3ddc878ae4d3?s=64">&nbsp;
[Casey Flynn (cflynn07)](https://github.com/cflynn07)
San Francisco, CA, USA  
