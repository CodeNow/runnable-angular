var gulp      = require('gulp');
var source    = require('vinyl-source-stream');
var sass      = require('gulp-sass');
var watchify  = require('watchify');
var nodemon   = require('gulp-nodemon');
var stringify = require('stringify');
var browserifyShim = require('browserify-shim');

gulp.task('browserify', function () {
  var bundler = watchify('./client/main.js');
  bundler.transform(stringify());
  bundler.transform(browserifyShim());
  bundler.on('log', function (msg) {
    console.log('browserify bundle watch:', msg);
  });
  bundler.on('update', rebundle);
  function rebundle () {
    return bundler.bundle()
      .pipe(source('bundle.js'))
      .pipe(gulp.dest('./client/build/js/'));
  }
  return rebundle();
});

gulp.task('sass', function () {
  gulp.src('./client/scss/*.scss')
    .pipe(sass())
    .pipe(gulp.dest('./client/build/css/'));
});

gulp.task('develop', function () {
  nodemon({
    script: './server/main.js',
    ext:    'jade js scss',
    ignore: './client/build/*',
    env: {
      'NODE_ENV': 'development',
      'NODE_PATH': '.'
    }
  })//.on('change', ['browserify', 'sass'])
    .on('restart', function () {
      console.log('restarted');
    });
});