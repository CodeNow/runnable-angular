# grunt-jade-plugin [!['Build status'][travis_image_url]][travis_page_url]

[![npm_image_url]][npm_page_url]

[travis_image_url]: https://secure.travis-ci.org/ivanvotti/grunt-jade-plugin.png?branch=master
[travis_page_url]: https://travis-ci.org/ivanvotti/grunt-jade-plugin

[npm_image_url]: https://nodei.co/npm/grunt-jade-plugin.png?downloads=true
[npm_page_url]: https://npmjs.org/package/grunt-jade-plugin/

Compile Jade templates to one JavaScript file (normal or AMD).

**Note:** This plugin requires [Grunt](http://gruntjs.com/) `~0.4.0`. If you're still using grunt v.0.3.x please use [0.3.x branch](https://github.com/ivanvotti/grunt-jade-plugin/tree/0.3.x) of this plugin.

## Installation

```shell
npm install grunt-jade-plugin --save-dev
```

If you're still using [Grunt][] v.0.3.x:

```shell
npm install grunt-jade-plugin@~0.3.0 --save-dev
```

Then it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-jade-plugin');
```

## Config Examples

### AMD compilation

``` javascript
jade2js: {
  compile: {
    options: {
      amd: true,

      amdDependences: {
        'jade': 'jade',
        'underscore': '_'
      },
    },

    files: {
      'templates.js': ['temlates/user.jade', 'templates/account.jade']
    }
  }
}
```

The result templates.js file will content:
``` javascript
define(["jade", "underscore"], function(jade, _) {
  // Compiled templates will be here.
}
```

You can use your compiled templates like this:
``` javascript
define(["templates"], function(templates) {
  var data = {name: 'John', age: 28};
  var htmlResult = templates.user(data);
  var htmlResult = templates.account(data);
}
```

### Normal JS file compilation

``` javascript
jade2js: {
  compile: {
    options: {
      namespace: 'MyApp.Templates'
    },
    files: {
      'templates.js': 'temlates/*.jade'
    }
  }
}
```

The result templates.js file will content:
``` javascript
this['MyApp'] = this['MyApp'] || {};
this['MyApp']['Templates'] = this['MyApp']['Templates'] || {};

// Template function
this['MyApp']['Templates']['user'] = function() {};
```

You can use your compiled templates like this:
``` javascript
var data = {name: 'John', age: 28};
var htmlResult = MyApp.Templates.user(data);
```

## Documentation

#### Files ```object```

Define what files this task will process. For more info about ```files object``` please read [Grunt docs](http://gruntjs.com/configuring-tasks#files).

Examples:
```javascript
files: {
  'templates1.js': 'source/*.jade', // includes files from source dir only
  'templates2.js': 'source/**/*.jade', // includes files from source dir and all its subdirs
  'templates3.js': ['path/to/sources/file.jade', 'path/to/more/other.jade']
}
```

#### Options ```object```

This controls how this task operates and should contain key:value pairs, see options below.

All options and defaults:

```javascript
options: {
  amd: false,
  amdDependences: {},
  includeRuntime: true,
  injectBefore: '',
  namespace: 'Templates',
  compileDebug: false,
  processName: function(filename) { return filename.split('/').pop().split('.')[0]; }
}
```

##### processName ```function```

This option accepts a function which takes the template filepath and returns a string which will be used as the key for the precompiled template object.

By default processName removes the template file path and an extension like this:

``` javascript
// Before:
Templates['templates/user.jade']

// After:
Templates['user']

// So you can access your template function like this:
Templates.user
```

You can change the default behaviour like this:
``` javascript
files: {
  'templates.js': ['temlates/user.jade', 'templates/account.jade']
},

options: {
  processName: function(filename) {
    return filename
  }
}
```

Resutl:
``` javascript
Templates['templates/user.jade']
Templates['templates/account.jade']

```

##### includeRuntime ```boolean```

Determine if Jade's [runtime.js](https://github.com/visionmedia/jade/blob/master/runtime.js) file will be included into the result JS file. By default it will be included.

Note that you have to use the runtime file anyway. So if you prefer to keep it separately, you can download it from the [official repository](runtime.js).

##### amd ```boolean```

Determine if preprocessed template functions will be wrapped in [Require.js][] define function (default is `false`).

``` javascript
define([], function() {
  // ...
});
```

##### amdDependences ```object```

``` javascript
amdDependences: {
  'helpers': 'helpers',
  'underscore': '_'
},
```

Result:
``` javascript
define(["helpers", "underscore"], function(helpers, _) {
  // Compiled templates will be here.
}
```

##### namespace ```string```

The namespace in which the precompiled templates will be assigned (default is `'Templates'`).  *Use dot notation (e.g. App.Templates) for nested namespaces.*

Example:
``` javascript
options: {
  namespace: 'MyApp.Templates'
}
```

Result:
``` javascript
this['MyApp'] = this['MyApp'] || {};
this['MyApp']['Templates'] = this['MyApp']['Templates'] || {};

// Template function
this['MyApp']['Templates']['user'] = function() {};
```

##### injectBefore ```string```

It should contain a string that will be injected before precompiled templates.

``` javascript
options: {
  injectBefore: '// string to enject'
}
```

## Release History
Check the [HISTORY.md][] file for change logs and release notes.

## License
Copyright (c) 2012 Ivan Votti
Licensed under the MIT license.  
<https://github.com/ivanvotti/grunt-jade-plugin/blob/master/LICENSE-MIT>

[history.md]: https://github.com/ivanvotti/grunt-jade-plugin/blob/master/HISTORY.md
[grunt]: https://github.com/gruntjs/grunt
[getting_started]: https://github.com/gruntjs/grunt/blob/master/docs/getting_started.md
[grunt.template]: https://github.com/gruntjs/grunt/blob/master/docs/api_template.md
[minimatch]: https://github.com/isaacs/minimatch
[require.js]: http://requirejs.org
[jade]: http://jade-lang.com
