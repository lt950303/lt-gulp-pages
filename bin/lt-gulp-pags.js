#!/usr/bin/env node

// 自定义一些参数
process.argv.push("--cwd");
process.argv.push(process.cwd());
process.argv.push("--gulpfile");
process.argv.push(require.resolve(".."));

// 引入 gulp 的 cli
require('gulp/bin/gulp')
