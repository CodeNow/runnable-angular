Runnable 2.0
=============

---

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
 - fork the `CodeNow/stage-api` server on runnable.io. For now, uncheck fork linked servers. Name your box `${YOUR_NAME}-api` (e.g. `anton-api`).
 - create your own GitHub App (https://github.com/settings/applications/new) and
    - set `Homepage URL` to `http://${YOUR_NAME}-api-codenow.runnableapp.com/`
    - set `Authorization callback URL` to `http://${YOUR_NAME}-api-codenow.runnableapp.com/auth/github/callback`
 - update environment variables for your API box (this is not in the Dockerfile, but a separate environment modal found in the dropdown from the gear icon in the top right)
    - set `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` to the values from your GitHub app
    - Verify the following are set, they should be automatically
       - set `FULL_API_DOMAIN` to `http://${YOUR_NAME}-api-codenow.runnableapp.com`
       - set `GITHUB_CALLBACK_URL` to `http://${YOUR_NAME}-api-codenow.runnableapp.com/auth/github/callback`
       - set `GITHUB_HOOK_URL` to `http://${YOUR_NAME}-api-codenow.runnableapp.com/actions/github`
 - run web app locally with `API_HOST=//${YOUR_NAME}-api-codenow.runnableapp.com grunt` (note the protocol-less URL)
 - go to `http://localhost:3001?password=local` and signin with your GitHub

Requirements
------------
- node ~0.10.30
- npm ~1.4.20
- ruby ~2.0.0 (for SASS)
- browserify@~5.9.1

Testing
-------
Unit Tests
```bash
grunt test
```

E2E tests
```bash
webdriver-manager start;
npm run e2e
```
You can also pass credentials to protractor like so:
```bash
protractor ./test/protractor.conf.js --params.user SomeKittens --params.password hunter2
```

Contributors
------------
<img src="https://avatars3.githubusercontent.com/u/7440805?s=64" width="64">&nbsp;
[Taylor Dolan (taylordolan)](https://github.com/taylordolan)
San Francisco, CA, USA  
<img src="https://avatars3.githubusercontent.com/u/495765?s=64">&nbsp;
[Ryan Kahn (Myztiq)](https://github.com/Myztiq)
San Francisco, CA, USA  
<img src="https://avatars1.githubusercontent.com/u/6379413?s=64">&nbsp;
[Nathan Meyers (Nathan219)](https://github.com/Nathan219)
San Francisco, CA, USA  
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
