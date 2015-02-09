var gulp = require('gulp');
var connect = require('gulp-connect');
var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');
var browserify = require('browserify');
var transform = require('vinyl-transform');

var paths = {
  js: ['index.js', 'js/*.js', 'views/**/*.js'],
  html: ['./*.html', 'views/**/*.html'],
  sass: 'css/*.scss'
};


gulp.task('connect', function () {
  connect.server({
    port: 4000,
    livereload: true
  });
});

gulp.task('html', function () {
  gulp.src(paths.html)
    .pipe(connect.reload());
});

gulp.task('js', function () {
  gulp.src(paths.js)
    .pipe(connect.reload());
});

//gulp.task('sass', function () {
//  gulp.src(paths.sass)
//    .pipe(sass())
//    .pipe(gulp.dest('css'))
//    .pipe(connect.reload());
//});

gulp.task('watch', function () {
  gulp.watch(paths.html, ['html']);
  gulp.watch(paths.js, ['js', 'browserify']);
  //gulp.watch(paths.sass, ['sass']);
});

gulp.task('browserify', function () {
  var browserified = transform(function (filename) {
    var b = browserify(filename);
    return b.bundle();
  });

  return gulp.src(['index.js'])
    .pipe(browserified)
    .pipe(sourcemaps.init())
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('./dist'));
});

gulp.task('default', ['browserify', 'connect', 'watch']);
