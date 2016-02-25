/**
 * gulp-bower-combine
 *
 * make everything more easy
 */
var _ = require('lodash')
	, gulp = require('gulp')
	, concat = require('gulp-concat')
	, mainBowerFiles = require('main-bower-files')
	, filter = require('gulp-filter')
	, rename = require('gulp-rename')
	, less = require('gulp-less')
	, rimraf = require('rimraf')
	, pathUtils = require('path')
	, rjs = require('requirejs')
	, fs = require('fs')
	;

var Combine = function (workdir) {

	if (typeof workdir === 'undefined')
		workdir = process.cwd();

	this.distDir = './dist';

	this.renameHandles = [];

	this.filters = [];

	this.getWorkDir = function () {
		return workdir;
	};

	this.bowerData = false;
	this.bowerRC = false;

	return this;
};

Combine.prototype.setDistDir = function (dir) {
	if (!_.isString(dir) || _.trim(dir).length <= 0)
		dir = this.getWorkDir();
	this.distDir = dir;
	return this;
};

Combine.prototype.getDistDir = function () {
	return this.distDir;
};

Combine.prototype.addRenameHandle = function (callback) {
	var me = this;
	if (_.isFunction(callback) && _.indexOf(me.renameHandles, callback) < 0)
		me.renameHandles.push(callback);
	else if (_.isArray(callback) && callback.length > 0)
		_.each(callback, function (item) {
			me.addRenameHandle(item);
		});
	return this;
};

Combine.prototype.seekFilter = function (filter) {
	var len = this.filters.length;
	if (len > 0) {
		for (var i = 0; i < len; i++) {
			var row = this.filters[i];
			if (row.pattern === filter)
				return i;
		}
	}
	return -1;
};

Combine.prototype.addFilter = function (filter, options) {
	var me = this;
	options = options || {};
	options.restore = true;
	if (_.isString(filter) && filter.length > 0 && this.seekFilter(filter) < 0) {
		this.filters.push({
			pattern: filter,
			options: options
		});
	}
	else if (_.isArray(filter) && filter.length > 0) {
		_.each(callback, function (item) {
			me.addFilter(item, options);
		});
	}
	else if (_.isObject(filter)) {
		_.forOwn(filter, function (value, key) {
			me.addFilter(key, value);
		});
	}
	return this;
};

Combine.prototype.makeDistPath = function (path) {
	return pathUtils.join(this.distDir, path);
};

Combine.prototype.makeWorkDirPath = function (path) {
	return pathUtils.join(this.getWorkDir(), path);
};

Combine.prototype.filter = function (index) {

};

Combine.prototype.distClean = function (callback) {
	rimraf(this.getDistDir(), callback);
	return this;
};

Combine.prototype.distBower = function (dist, options, callback) {
	return this.dist(dist, gulp.src(mainBowerFiles(options || {})), callback);
};

Combine.prototype.dist = function (dist, stream, callback) {
	if (!_.isString(dist))
		dist = '';
	if (!_.isObject(stream) || !_.isFunction(stream.pipe))
		throw new Error('Invalid gulp stream input!');
	//var mainFiles = mainBowerFiles(this.options.bowerFiles);
	var me = this, filters = me.filters;
	var renameHandle = function (path) {
		_.each(me.renameHandles, function (handle) {
			handle.call(me, path);
		});
	};
	if (this.filters.length > 0) {
		var index = -1;
		var lasts = [stream];

		var onFilter = function () {
			index += 1;
			if (filters[index]) {
				var data = filters[index];
				var ft = filter(data.pattern, data.options);
				var options = data.options || {};
				lasts[index]
					.pipe(ft)
					.pipe(rename(renameHandle))
					.pipe(gulp.dest(me.makeDistPath(options.dist || dist)))
					.on('finish', function() {
						onFilter();
					})
					.on('end', function () {
						onFilter();
						if (index === filters.length) {
							_.isFunction(callback) && callback();
						}
					})
				;
				lasts.push(ft.restore);
			}
			else {
				lasts[index]
					.pipe(rename(renameHandle))
					.pipe(gulp.dest(me.makeDistPath(dist)))
				;
			}
		};

		onFilter();

		return last;
	}
	else {
		var last = stream
			.pipe(rename(renameHandle))
			.pipe(gulp.dest(me.makeDistPath(dist)))
			.on('end', function () {
				_.isFunction(callback) && callback();
			})
			;

		return last;
	}
};

Combine.prototype.loadBowerJson = function () {
	if (this.bowerData === false) {
		try {
			this.bowerData = JSON.parse(fs.readFileSync(this.makeWorkDirPath('bower.json'), 'utf8'));
		}
		catch (err) {
			this.bowerData = {};
		}
	}
	return this;
};

Combine.prototype.getBowerData = function () {
	this.loadBowerJson();
	return this.bowerData;
};

Combine.prototype.hasDep = function (name) {
	this.loadBowerJson();
	var dep = this.bowerData['dependencies'] || {};
	return dep[name] ? true : false;
};

Combine.prototype.loadBowerRC = function () {
	if (this.bowerRC === false) {
		try {
			this.bowerRC = JSON.parse(fs.readFileSync(this.makeWorkDirPath('.bowerrc'), 'utf8'));
		}
		catch (err) {
			this.bowerRC = {};
		}
	}
	return this;
};

Combine.prototype.getBowerDir = function () {
	this.loadBowerRC();
	var dir;
	if (_.isString(this.bowerRC['directory']) && this.bowerRC['directory'].length > 0) {
		dir = this.bowerRC['directory'];
	}
	else {
		dir = 'bower_components';
	}
	return this.makeWorkDirPath(dir);
};

Combine.prototype.makeBowerPath = function (path) {
	return pathUtils.join(this.getBowerDir(), path);
};

Combine.prototype.makeBowerPatterns = function (base, patterns) {
	return this.makePatterns(this.makeBowerPath(base), patterns);
};

Combine.prototype.makePatterns = function (base, patterns) {
	return _.map(patterns, function (pattern) {
		return pathUtils.join(base, pattern);
	});
};

Combine.prototype.rjs = function (options, callback) {
	options = options || {};
	if (!options.baseUrl)
		options.baseUrl = this.makeDistPath('js');
	rjs.optimize(options, function (buildResponse) {
		// console.log('build response', buildResponse);
		_.isFunction(callback) && callback();
	}, callback);
	return this;
};

module.exports = new Combine(process.cwd());