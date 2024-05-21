const { src, dest, series, watch } = require('gulp');
const concat = require('gulp-concat');
const htmlMin = require('gulp-htmlmin');
const autoprefixer = require('gulp-autoprefixer');
const cleanCSS = require('gulp-clean-css');
const svgSprite = require('gulp-svg-sprite');
const image = require('gulp-image');
const babel = require('gulp-babel');
const uglify = require('gulp-uglify-es').default;
const notify = require('gulp-notify');
const sourcemaps = require('gulp-sourcemaps');
const del = require('del');
const browserSync = require('browser-sync').create();
const sass = require('gulp-sass')(require('sass'));

const gulpif = require('gulp-if');
let prod = false;

const isProd = (done) => {
    prod = true;
    done();
}

const clean = () => {
    return del(['dist']);
}

const resources = () => {
    return src('src/resources/**/*')
        .pipe(dest('dist'));
}

const styles = () => {
    return src('src/SCSS/**/*.scss')
        .pipe(gulpif(!prod, sourcemaps.init()))
        .pipe(sass().on('error', sass.logError))
        .pipe(concat('main.css'))
        .pipe(autoprefixer({
            cascade: false
        }))
        .pipe(gulpif(prod, cleanCSS({
            level: 2
        })))
        .pipe(gulpif(!prod, sourcemaps.write()))
        .pipe(dest('dist/css'))
        .pipe(browserSync.stream())
        .on('end', () => console.log('Styles task completed'));
}

const htmlMinify = () => {
    return src('src/**/*.html')
        .pipe(gulpif(prod, htmlMin({
            collapseWhitespace: true
        })))
        .pipe(dest('dist'))
        .pipe(browserSync.stream())
        .on('end', () => console.log('HTML Minify task completed'));
}

const svgSprites = () => {
    return src('src/images/svg/**/*.svg')
        .pipe(svgSprite({
            mode: {
                stack: {
                    sprite: '../sprite.svg'
                }
            }
        }))
        .pipe(dest('dist/images'))
        .on('end', () => console.log('SVG Sprites task completed'));
}

const scripts = () => {
    return src([
        'src/js/components/**/*.js',
        'src/js/main.js'
    ])
    .pipe(gulpif(!prod, sourcemaps.init()))
    .pipe(babel({
        presets: ['@babel/env']
    }))
    .pipe(concat('app.js'))
    .pipe(gulpif(prod, uglify().on('error', notify.onError())))
    .pipe(gulpif(!prod, sourcemaps.write()))
    .pipe(dest('dist/js'))
    .pipe(browserSync.stream())
    .on('end', () => console.log('Scripts task completed'));
}

const watchFiles = () => {
    browserSync.init({
        server: {
            baseDir: 'dist'
        }
    });
    watch('src/**/*.html', htmlMinify);
    watch('src/SCSS/**/*.scss', styles);
    watch('src/images/svg/**/*.svg', svgSprites);
    watch('src/js/**/*.js', scripts);
    watch('src/resources/**', resources);
}

const images = () => {
    return src([
        'src/images/**/*.jpg',
        'src/images/**/*.png',
        'src/images/*.svg',
        'src/images/**/*.jpeg',
    ])
    .pipe(image())
    .pipe(dest('dist/images'))
    .on('end', () => console.log('Images task completed'));
}

exports.styles = styles;
exports.scripts = scripts;
exports.htmlMinify = htmlMinify;
exports.dev = series(clean, resources, htmlMinify, scripts, styles, images, svgSprites, watchFiles);
exports.build = series(isProd, clean, resources, htmlMinify, scripts, styles, images, svgSprites);

exports.default = series(exports.dev);
