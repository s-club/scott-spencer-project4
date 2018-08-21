const gulp = require('gulp');
const sass = require('gulp-sass');
const concat = require('gulp-concat');
const browserify = require('browserify');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const notify = require('gulp-notify');
const browserSync = require('browser-sync');
const reload = browserSync.reload;
const autoprefixer = require('gulp-autoprefixer');

// take scss files in my dev folder, convert it to css and concat them to one file called style.css in the public/styles folder
gulp.task('styles', () => {
    return gulp.src('./dev/styles/**/*.scss')
    .pipe(sass().on('error', sass.logError))
        .pipe(autoprefixer('last 2 versions', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1'))
    .pipe(concat('style.css'))
    .pipe(gulp.dest('./public/styles'))
    .pipe(reload({stream: true}));
});

gulp.task('js', () => {
    browserify('./dev/scripts/main.js', {debug: true})
        .transform('babelify', {
            sourceMaps: true,
            presets: ['env']
        })
        .bundle()
        .on('error',notify.onError({
            message: "Error: <%= error.message %>",
            title: 'Error in JS 💀'
        }))
        .pipe(source('main.js'))
        .pipe(buffer())
        .pipe(gulp.dest('./public/scripts'))
        .pipe(reload({ stream: true }));
});

gulp.task('bs', () => {
    browserSync.init({
        server: {
            baseDir: './'
        }
    });
});

gulp.task('watch', () => {
    gulp.watch('./dev/styles/**/*.scss', ['styles']);
    gulp.watch('./dev/scripts/**/*.js', ['js']);
});

gulp.task('default', ['bs', 'styles', 'js', 'watch'])
