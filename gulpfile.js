var gulp     = require('gulp');
var source   = require('vinyl-source-stream');
var sass     = require('gulp-sass');
var watchify = require('watchify');

gulp.task('browserify', function () {
  var bundler = watchify('./client/main.js');
  bundler.on('log', function (msg) {
    console.log('browserify bundle watch:', msg);
  });
  bundler.on('update', rebundle);
  function rebundle () {
    return bundler.bundle()
      .pipe(source('bundle.js'))
      .pipe(gulp.dest('./client/build/'));
  }
  return rebundle();
});

gulp.task('sass', function () {
  gulp.src('./client/scss/*.scss')
    .pipe(sass())
    .pipe(gulp.dest('./client/build/'));
});