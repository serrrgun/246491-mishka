"use strict";

var gulp = require("gulp");
var sass = require("gulp-sass");
var plumber = require("gulp-plumber");
var postcss = require("gulp-postcss");
var autoprefixer = require("autoprefixer");
var server = require("browser-sync").create();
var htmlmin = require("gulp-htmlmin"); /* минификация html */
var minify = require("gulp-csso"); /* минификация css */
var uglify = require("gulp-uglify"); /* минификация js */
var rename = require("gulp-rename"); /* плагин для переименования файла */
var imagemin = require("gulp-imagemin"); /* оптимизация изображений */
var webp = require("gulp-webp"); /* конвертация изображений в webp */
var svgstore = require("gulp-svgstore"); /* сборка svg-спрайтов */
var posthtml = require("gulp-posthtml"); /* posthtml */
var include = require("posthtml-include"); /* вставлять одни файлы в другие */
var run = require("run-sequence"); /* последовательнфй запуск задач */
var del = require("del"); /* модуль для удаления */

/* минификация html */
gulp.task("html", function() {
  return gulp.src("*.html")
    .pipe(posthtml([
      include()
    ]))
    .pipe(htmlmin({collapseWhitespace: true}))
    .pipe(gulp.dest("build"))
    .pipe(server.stream());
});

/* минифицирует стили */
gulp.task("style", function () {
  gulp.src("sass/style.scss")
    .pipe(plumber())
    .pipe(sass())
    .pipe(postcss([
      autoprefixer({browsers: [         /* прогоняет через компилятор Sass */
        "last 2 versions"
      ]})
    ]))
    .pipe(gulp.dest("build/css"))  /* исходник в css/ */
    .pipe(minify())                /* минифицирует style.css */
    .pipe(rename("style.min.css")) /* переименование */
    .pipe(gulp.dest("build/css"))  /* еще раз кидает в css/ */
    .pipe(server.stream());        /* перезагружает сервер в браузере */
});

/* минифицирует скрипты */
gulp.task("scripts", function () {
  return gulp.src("js/*.js")
  .pipe(uglify())
  .pipe(gulp.dest("build/js"))
  .pipe(server.stream());
});

/* оптимизация изображений */
gulp.task("images", function() {
  return gulp.src("build/img/**/*.{png,jpg,svg}")
    .pipe(imagemin([
      imagemin.optipng({optimizationLevel: 3}), /* безопасное сжатие */
      imagemin.jpegtran({progressive: true}),   /* прогресивная загрузка jpg */
      imagemin.svgo()
      ]))
    .pipe(gulp.dest("build/img"))               /* складываем в папку img */
});

/* конвертация в webp */
gulp.task("webp", function() {
  return gulp.src("img/**/*.{png,jpg}")
    .pipe(webp({quality: 90}))                  /* Конвертируем png/jpg в webp */
    .pipe(gulp.dest("build/img"));
});

/* Сборка спрайта */
gulp.task("sprite", function() {
  return gulp.src("build/img/sprite-icon/*.svg")
    .pipe(svgstore({                            /* вырезает из SVG-файлов лишнюю инф-цию */
      inLineSvg: true
    }))
    .pipe(rename("sprite.svg"))                 /* нужно переименовать, так как мы не знаем имя спрайта */
    .pipe(gulp.dest("build/img"))
});

/* Перед тем как таск serve стартует должен быть запущен style */
gulp.task("serve", function () {
  server.init({
    server: "build/",
  });
  /* Ватчеры следящие за изменениями наших файлов */
  gulp.watch("sass/**/*.{scss,sass}", ["style"]);
  gulp.watch("*.html", ["html"]);               /* Слежение за HTML файлами в корне проекта */
  gulp.watch("js/*.js", ["scripts"]);           /* Слежение за JS файлами */
});

/* Таск для копирования */
gulp.task("copy", function() {
  return gulp.src([
    "fonts/**/*.{woff,woff2}",
    "img/**"
  ], {
    base: "."                                   /* Говорим что базовый путь начинается из корня */
  })
  .pipe(gulp.dest("build"));
});

/* Таск для удаления */
gulp.task("clean", function() {
  return del("build");
});

/* Таск запуска */
gulp.task("build", function(done) {
  run(
    "clean",
    "copy",
    "style",
    "scripts",
    "images",
    "sprite",
    "html",
    "webp",
    "serve",
    done  /* Самым последним вызовом функции run должна быть функция, которая была передана как аргумент */
  );
});
