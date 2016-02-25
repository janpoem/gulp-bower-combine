
var gulp = require('gulp');
var combine = require('../combine');

combine
	.setDistDir('./public')
	.addRenameHandle([
		function (path) {
			// jquery plugins
			var match = path.basename.match(/^jquery[\.\-_](.*)$/i);
			if (match !== null)
				path.basename = 'jquery-' + match[1];
		}
	])
	.addFilter({
		'**/*.js': {
			dist: 'js/base'
		},
		'**/*.css': {
			dist: 'css'
		}
	});

gulp.task('dist-clean', function(callback) {
	combine.distClean(callback);
});

gulp.task('dist', ['dist-clean'], function(callback) {

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
