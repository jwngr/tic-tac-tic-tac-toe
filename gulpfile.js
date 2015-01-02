/**************/
/*  REQUIRES  */
/**************/
var gulp = require("gulp");

// CSS
var sass = require("gulp-sass");
var autoprefixer = require("gulp-autoprefixer");

// JavaScript
var jshint = require("gulp-jshint");
var uglify = require("gulp-uglify");

// File IO
var extReplace = require("gulp-ext-replace");


/****************/
/*  FILE PATHS  */
/****************/
var paths = {
  html: {
    src: "src/client/*.html",
    dest: {
      dir: "dist"
    }
  },

  css: {
    src: "src/client/sass/*.scss",
    dest: {
      dir: "dist/css",
      minified: "ticTacTicTacToe.min.css"
    }
  },

  js: {
    src: "src/client/js/client.js",
    dest: {
      dir: "dist/js",
      minified: "client.min.js"
    }
  },

  images: {
    src: "src/client/images/*.png",
    dest: {
      dir: "dist/images"
    }
  },

  fonts: {
    src: "src/client/fonts/*.woff",
    dest: {
      dir: "dist/fonts"
    }
  }
};


/***********/
/*  TASKS  */
/***********/
/* Copies the HTML files to distrubition directory */
gulp.task("html", function() {
  return gulp.src(paths.html.src)
    .pipe(gulp.dest(paths.html.dest.dir));
});

/* Lints and minifies the JavaScript files */
gulp.task("scripts", function() {
  return gulp.src(paths.js.src)
    // Lint
    .pipe(jshint())
    .pipe(jshint.reporter("jshint-stylish"))
    .pipe(jshint.reporter("fail"))
    .on("error", function(error) {
      throw error;
    })

    // Write un-minified version
    .pipe(gulp.dest(paths.js.dest.dir))

    // Minify
    .pipe(uglify({
      preserveComments: "some"
    }))

    // Change file extension
    .pipe(extReplace(".min.js"))

    // Write minified version
    .pipe(gulp.dest(paths.js.dest.dir));
});

/* Converts and minifies the CSS files */
gulp.task("styles", function() {
  return gulp.src(paths.css.src)
    // Convert from SASS to CSS and minify
    .pipe(sass({
      outputStyle: "compressed"
    }))

    // Add CSS browser prefixes
    .pipe(autoprefixer())

    // Change file extension
    .pipe(extReplace(".min.css"))

    // Write minified version
    .pipe(gulp.dest(paths.css.dest.dir));
});

/* Copies images to distrubition directory */
gulp.task("images", function() {
  return gulp.src(paths.images.src)
    .pipe(gulp.dest(paths.images.dest.dir));
});

/* Copies fonts to distrubition directory */
gulp.task("fonts", function() {
  return gulp.src(paths.fonts.src)
    .pipe(gulp.dest(paths.fonts.dest.dir));
});

/* Re-runs tasks every time files changes */
gulp.task("watch", function() {
  gulp.watch([paths.js.src], ["scripts"]);
  gulp.watch([paths.css.src], ["styles"]);
});

/* Runs the "scripts" and "styles" tasks by default */
gulp.task("default", ["html", "scripts", "styles", "images", "fonts"]);
