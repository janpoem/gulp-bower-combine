# gulp-bower-combine

这个项目主要为了解决bower的源和整合进项目中与requirejs（AMD）之间的关系问题，将JS打包整合的工具使用的是gulp。

首先你得确保你的环境里正确安装了bower和gulp。

在你的项目目录中，下面的指令都能被正确执行。

```bash
bower init
bower install jquery jquery-address --save
gulp
```

```bash
npm install https://github.com/janpoem/gulp-bower-combine.git
```

编辑你的`gulpfile.js`

```js
var combine = require('gulp-bower-combine');

combine
	// 指定输出的根目录
	.setDistDir('./public')
	// 添加一个renameHandle
	.addRenameHandle([
		function (path) {
			// jquery plugins
			var match = path.basename.match(/^jquery[\.\-_](.*)$/i);
			if (match !== null)
				path.basename = 'jquery-' + match[1];
		}
	])
	// 注册过滤器，dist是基于./public目录。
	.addFilter({
		'**/*.js': {
			dist: 'js/base' // ./public/js/base
		},
		'**/*.css': {
			dist: 'css'     // ./public/css
		}
	})
;

gulp.task('dist-clean', function(callback) {
	combine.distClean(callback);
});

gulp.task('dist', ['dist-clean'], function(callback) {
	// 将bower类库的输出文件打扁路径捞出来
	combine.distBower(null, {
		"overrides": {
			"semantic": {
				"ignore": true
			},
			"datetimepicker": {
				"main": [
					"jquery.datetimepicker.js",
					"jquery.datetimepicker.css"
				]
			}
		}
	}, function() {
		// 特殊的构建
		// semanti的构建比较特殊，也不方便直接使用less进行编译处理，因为需要修改theme.config文件
		if (combine.hasDep('semantic')) {
			combine.dist('css/themes', gulp.src(combine.makeBowerPatterns('semantic', [
				"dist/semantic.css",
				"dist/semantic.js",
				"dist/themes/**/*.*"
			])), callback);
		}
		else {
			callback && callback();
		}
	});
});


gulp.task('rjs', ['dist'], function () {
	// requirejs的优化，并合并出最终文件，这个环节执行时间很长，不建议用watch
	combine.rjs({
		baseUrl: combine.makeDistPath('js/base'),
		out: combine.makeDistPath('js/base.js'),
		optimize: 'none',
		// wrap: true,
		include: [
			'require',
			'lodash',
			'jquery',
			'jquery-address',
			'jquery-browser',
			'jquery-mousewheel',
			'jquery-datetimepicker',
			'semantic'
		],
		shim: {
			'jquery': [],
			'lodash': [],
			'jquery-browser': ['jquery'],
			'jquery-mousewheel': ['jquery'],
			'jquery-datetimepicker': ['jquery', 'jquery-mousewheel', 'php-date-formatter'],
			'semantic-ui': ['jquery']
		}
	});
});

```

取出bower的类库输出文件，使用的是`main-bower-files`，具体传参数可以参考：[main-bower-files](https://github.com/ck86/main-bower-files)。

rjs部分，则是requirejs的优化参数，可参考：[r.js](https://github.com/jrburke/r.js/blob/master/build/example.build.js)。

源代码的test目录放的是一个演示。





