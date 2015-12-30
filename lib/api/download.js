var config = require('../../config');
var async = require('async');
var crypto = require('crypto');
var path = require('path');
var util = require('../util');
var fs = require('fs');
var nconf = require('nconf');
var debug = require('debug')('download');
var ProgressBar = require('progress');
var bar, barDir;
var cachePath = config.cachePath;

/**
 * 获取加密后的文件名字
 */
var getFilename = function(filePath, len) {
	var len = len || 16;
	var hmac = crypto.createHmac('md5', 'KS3');
	hmac.update(filePath);
	var str = hmac.digest('base64');
	return (new Buffer(str).toString('base64')) + '.cache'
}

/**
 * Bin: ks3 download -b $BUCKET -k $KEY -p $path
 */

function download(params, cb) {
	var bucketName = params.Bucket || this.bucketName || '';
	// 这个地方不能进行encode
	var key = params.Key || null;
	var filePath = path.resolve(process.cwd(), params.filePath) || null;

	if (!bucketName) {
		throw new Error('require the bucketName');
	}

	if (!key) {
		throw new Error('require the object Key');
	}
	if (!filePath) {
		throw new Error('require the file path');
	}

	var self = this;
	var ak = self.ak;
	var sk = self.sk;

	// 缓存文件地址
	var fileName = getFilename(filePath);
	// 用户要下载生成的文件
	var downFileName = filePath + '.download';
	var configFile = path.join(cachePath, fileName);
	nconf.file({
		file: configFile
	});
	// 分块大小
	var chunk = params.chunk || 1 * 1024 * 10;
	var count = 0;
	var index = 0;

	async.auto({
		/**
		 * 初始化或者读取configFile
		 * 1. 获取文件大小
		 * 2. 并且根据分块大小计算出总共请求次数
		 */
		init: function(callback) {
			/**
			 * 设置或读取基本数据
			 */
			if (fs.existsSync(configFile)) { // 之前已经有配置信息了
				chunk = nconf.get('chunk');
				count = nconf.get('count');
				index = nconf.get('index');
			} else {
				nconf.set('BUCKET', bucketName);
				nconf.set('KEY', key);
				nconf.set('path', filePath);
				nconf.set('chunk',chunk);
				nconf.set('count', 0);
				nconf.set('index', 0);
				nconf.save();
				// 如果已经存在重名下载文件,先删除他
				if (fs.existsSync(downFileName)) {
					fs.unlinkSync(downFileName);
				}
			}
			/**
			 * 获取文件信息
			 */
			if (nconf.get('count') == 0) {
				debug('远程获取元数据')
				self.object.head(params, function(err, data, res) {
					if (err) {
						callback(err, data);
					} else {
						var length = res.headers['content-length'];
						count = parseInt(length / chunk) + (length % chunk== 0 ? 0: 1);
						// 后端返回 文件大小为0
						if (count == 0) {
							callback({
								msg: '文件大小为0'
							})
						} else {
							nconf.set('count', count);
							callback(null);
						}
					}
				});
			} else {
				debug('本地读取数据')
				count = nconf.get('count');
				index = nconf.get('index');
				callback(null);
			}
		},
		/**
		 * 下载分块数据,并追加到文件末尾
		 */
		down: ['init', function(callback, result) {
			// 下载逻辑
			var fileName = (function() {
				var s = filePath.split('/');
				return s[s.length - 1];
			})();
			bar = new ProgressBar('下载 ' + fileName + ' [:bar] :percent :current/:total ', {
				total: count,
				width:20
			});
			bar.curr = index;
			var downHandler = function() {
				if (index + 1 > count) { // 下载结束
					debug('下载结束')
					callback(null);
				} else { // 还没下载完,继续进行下载
					debug('进行下载:', index, '/', count);
					self.object.get({
						Key: key,
						range: 'bytes=' + index * chunk + '-' + ((index + 1) * chunk - 1)
					},
					function(err, data, res, originData) {
						if (err) {
							callback(err, data);
						} else {
							fs.appendFileSync(downFileName, originData);
							index = index + 1;
							bar.tick();
							nconf.set('index', index);
							nconf.save();
							downHandler();
						}
					});
				}
			};
			downHandler();
		}],
	},
	function(err, results) {
		if (err) {
			if (cb) {
				cb(err, results)
			} else {
				fs.unlinkSync(configFile);
				throw err;
			}
		} else {
			fs.unlinkSync(configFile);
			fs.renameSync(downFileName, filePath);
			if (cb) {
				cb(err, {msg:'success',path:filePath}, null);
			}
		}
	})

}

module.exports = {
	start: download
}
