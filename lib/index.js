const path = require(page);
const { src, dest, parallel, series, watch } = require("gulp");
const del = require("del");
const bs = require("browser-sync");
const loadPlugins = require("gulp-load-plugins");
const plugins = loadPlugins(); // 各种 gulp 插件都在这

let config = {
  // 可以有些 默认值
  build: {
    src: "src",
    dist: "dist",
    temp: "temp",
    public: "public",
    paths: {
      styles: "assets/styles/*.scss",
      scripts: "assets/scripts/*.js",
      pages: "*.html",
      images: "assets/images/**",
      fonts: 'assets/fonts/**"',
    },
  },
};

try {
  // 约定大于配置的思想： 将数据存储在 本地项目的根目录下，文件名为pages.config.js
  let cwd = process.cwd();
  let loadConfig = require(path.join(cwd, "pages.config.js")); // 合并默认值和配置
  config = Object.assign(config, loadConfig);
} catch (error) {
  console.log("pages.config.js: ", error);
}

// 清除文件
const clean = () => {
  // del 返回的是个 promise
  return del([config.build.temp]);
};

// scss 转 css
const style = () => {
  // 指定从 src 下保留路径
  return (
    src(config.build.paths.styles, {
      base: config.build.src,
      cwd: config.build.src,
    })
      //  scss 处理 并保留花括号换行
      .pipe(plugins.sass({ outputStyle: "expanded" }))
      .pipe(dest(config.build.temp))
      .pipe(bs.reload({ stream: true }))
  );
};

// 编译脚本文件
const script = () => {
  // 指定从 src 下保留路径
  return (
    src(config.build.paths.scripts, {
      base: config.build.src,
      cwd: config.build.src,
    })
      //  ES6+ 处理 注意这里要提供 babel 预设， 不然就不转换
      //   require("@babel/preset-env")利用 common.js 一层层向上找包的原理
      .pipe(plugins.babel({ presets: [require("@babel/preset-env")] }))
      .pipe(dest(config.build.temp))
      .pipe(bs.reload({ stream: true }))
  );
};

// 编译模板文件
const page = () => {
  // src/**/*.html 匹配任意子目录
  return src(config.build.paths.pages, {
    base: config.build.src,
    cwd: config.build.src,
  })
    .pipe(plugins.swig({ config, defaults: { cache: false } })) // 防止模板缓存导致页面不能及时更新
    .pipe(dest(dest(config.build.temp)))
    .pipe(bs.reload({ stream: true }));
};

// 转换图片文件
const image = () => {
  // 匹配文件下的所有文件
  return src(config.build.paths.images, {
    base: config.build.src,
    cwd: config.build.src,
  })
    .pipe(plugins.imagemin())
    .pipe(dest(dest(config.build.dist)));
};

// 转换字体文件， 一般的字体文件不需要压缩等处理， 但是有些svg格式的文件，还是可以稍微处理一下
const font = () => {
  // 匹配文件下的所有文件
  return src(config.build.paths.fonts, {
    base: config.build.src,
    cwd: config.build.src,
  })
    .pipe(plugins.imagemin())
    .pipe(config.build.dist);
};

const serve = () => {
  watch(config.build.paths.styles, { cwd: config.build.src}, style);
  watch(onfig.build.paths.scripts, { cwd: config.build.src}, script);
  watch(onfig.build.paths.pages, { cwd: config.build.src}, page);
  // 这几个静态资源， 开发过程中没必要构建
  // watch('src/assets/images/**', image)
  // watch('src/assets/fonts/**', font)
  // watch('public/**', public)
  watch(
	[config.build.paths.images, config.build.paths.fonts],
	{ cwd: config.build.src}, 
    bs.reload
  );

  watch(
	[config.build.public],
	{ cwd: config.build.public}, 
    bs.reload
  );

  bs.init({
    notify: false, // browser-sync 连接提示
    port: 2080,
    open: true, // 自动打开浏览器窗口
    // files: "dist/**", // 监听dist文件变化
    server: {
      baseDir: [config.build.tmp, config.build.src, config.build.public],
      routes: {
        "/node_modules": "node_modules",
      },
    },
  });
};

// 将public 原样输出到 dist
const public = () => {
  return src("**", { base: config.build.public }).pipe(config.build.dist);
};

const useref = () => {
  return src(config.build.paths.pages, { base: config.build.tmp })
    .pipe(plugins.useref({ searchPath: [ config.build.tmp, "."] }))
    .pipe(plugins.if(/\.js$/, plugins.uglify()))
    .pipe(plugins.if(/\.css$/, plugins.cleanCss()))
    .pipe(plugins.if(/\.css$/, plugins.cleanCss()))
    .pipe(
      plugins.if(
        /\.html$/,
        plugins.htmlmin({
          collapseWhitespace: true,
          minifyCss: true,
          minifyJs: true,
        })
      )
    )
    .pipe(dest( config.build.dist));
};

// 并行执行 样式-脚本-页面 编译
const compile = parallel(style, script, page);
// 先清空文件夹， 再编译+复制public文件夹  正式打开再处理 静态资源文件
const build = series(
  clean,
  parallel(series(compile, useref), public, image, font)
);

const develop = series(compile, serve);

module.exports = {
  clean,
  build, // 正式打包
  develop, // 开发环境
};
