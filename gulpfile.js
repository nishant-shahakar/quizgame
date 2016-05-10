var gulp = require('gulp');
var plumber = require('gulp-plumber');
var connect = require('gulp-connect');
var nodemon = require('gulp-nodemon');
var jshint = require('gulp-jshint');

gulp.task('watch', function() {
    gulp.watch('**/*.js')
    .pipe(connect.reload());
});

// Lint Task
gulp.task('lint', function() {
    return gulp.src(['./*.js','routes/*.js','events/*.js'])
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

gulp.task('develop', ['lint'], function () {
  nodemon({ script: 'app.js', ext: 'html js', ignore: ['ignored.js'] })
    .on('restart', ['lint'], function () {
      console.log('restarted!');
    });
});

gulp.task('default', ['watch','connect']);
