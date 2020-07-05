#!/usr/bin/env node

// node Cli 引用入口文件必须要有这样的文件头
// 如果是 linux 或者 macOS 系统还要修改此文件读写为 755
// 具体就是 通过 chmod 755 cli.js 实现

const inquirer = require("inquirer");
const fs = require("fs");
const path = require("path");

inquirer
	.prompt([
		{
			type: "input",
			name: "name",
			message: "your project name: ",
			default: "ting",
		},
	])
	.then((answers) => {
		// Use user feedback for... whatever!!
		// 将模板文件复制过去
		const fileArray = [];

		travel(
			path.join(__dirname, "templates"),
			// callback
			(pathname, next) => {
				fileArray.push(pathname);
				next(); // 一定要调用这个才可以持续递归
			},
			// finish 函数
			() => {
				const newfileArray = clipAbsolutePathToRelative(fileArray, __dirname);
				const cwd = process.cwd();

				console.log(newfileArray, "==fileArray");
				newfileArray.forEach((file, index) => {
                    const targetPath = path.join(cwd ,file);
                    fs.stat(targetPath, (error, stats)=>{
                        if (error) return error
                        console.log('文件：'+stats.isFile());
                        console.log('目录：'+stats.isDirectory());
                    })

					var readerStream = fs.createReadStream(fileArray[index]);
                    var writerStream = fs.createWriteStream(targetPath);
                    
                    readerStream.pipe(writerStream);
				});
			}
		);
	})
	.catch((error) => {
		if (error.isTtyError) {
			// Prompt couldn't be rendered in the current environment
		} else {
			// Something else when wrong
		}
	});

function travel(dir, callback, finish) {
	fs.readdir(dir, function (err, files) {
		(function next(i) {
			if (i < files.length) {
				var pathname = path.join(dir, files[i]);

				fs.stat(pathname, function (err, stats) {
					if (stats.isDirectory()) {
						travel(pathname, callback, function () {
							next(i + 1);
						});
					} else {
						callback(pathname, function () {
							next(i + 1);
						});
					}
				});
			} else {
				finish && finish();
			}
		})(0);
	});
}

// 把绝对路径裁切成相对路径
function clipAbsolutePathToRelative(pathArray, dirPath) {
	return pathArray.map((pathItem) =>
		pathItem.replace(`${dirPath}\\templates\\`, "")
	);
}
