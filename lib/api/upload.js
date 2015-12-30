var config = require('../../config');
var async = require('async');
var crypto = require('crypto');
var path = require('path');
var util = require('../util');
var fs = require('fs');
var nconf = require('nconf');
var debug = require('debug')('upload');
var ProgressBar = require('progress');
var mime = require('mime');
var bar, barDir;
var cachePath = config.cachePath;
var chunkSize = config.chunkSize;

var uploadMaxSize = config.uploadMaxSize;

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
 * 获取指定的文件内容
 */
var getFileContent = function(filePath, chunkSize, start, cb) {
	var start = start;
	fs.open(filePath, 'r', function(err, fd) {
		fs.fstat(fd, function(err, stat) {
			debug('正在读取文件内容');
			var bufferSize = stat.size;

			var index = start / chunkSize;

			if (start + chunkSize > bufferSize) {
				chunkSize = bufferSize - start;
			}
			var buffer = new Buffer(chunkSize)
			debug('分块大小:', chunkSize);

			fs.read(fd, buffer, 0, chunkSize, start, function(err, byteRead, buf) {
				cb(buf)
			})
		})
	})
}

/**
 * 把配置信息写到配置文件里,作为缓存
 */
var configInit = function(filePath, configFile, cb) {

	fs.open(filePath, 'r+', function(err, fd) {
		if (err) throw err;
		fs.fstat(fd, function(err, stat) {
			if (err) throw err;
			var fileSize = stat.size;
			var count = parseInt(fileSize / chunkSize) + ((fileSize % chunkSize == 0 ? 0: 1));

			if (count == 0) {
				cb({
					msg: 'The file is empty.'
				})
			} else {
				nconf.set('name', filePath);
				nconf.set('size', fileSize);
				nconf.set('chunkSize', chunkSize);
				nconf.set('count', count);
				nconf.set('index', 1);
				nconf.set('etags', {});
				nconf.set('retries', 0);
				nconf.save(function(err) {
					if (cb) cb(err);
				})
			}
		})
	})
}

/**
 * 生成合并分块上传使用的xml
 */
var generateCompleteXML = function(configFile) {
	var content = JSON.parse(fs.readFileSync(configFile).toString());
	var index = content.index;
	var str = '';
	if (index > 0) {
		str = '<CompleteMultipartUpload>';
		for (var i = 1; i <= index; i++) {
			str += '<Part><PartNumber>' + i + '</PartNumber><ETag>' + content.etags[i] + '</ETag></Part>'
		}
		str += '</CompleteMultipartUpload>';
	}
	return str;
}

/**
 * 上传接口
 * 
 * params:
 * . Bucket
 * . Key
 * . filePath
 * . fileSetting 上传文件夹的时候使用 {是否遍历子文件夹,isDeep:BOOLEAN,忽略的类型文件或者文件夹 ignore:RegExp}
 */
function upload(params, cb) {
	var bucketName = params.Bucket || this.bucketName || '';;
	var key = util.encodeKey(params.Key) || null;
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

	var fileName = getFilename(filePath);
	var configFile = path.join(cachePath, fileName);

	// 在重新开始一个进程的时候,清空重试次数
	nconf.set('retries', 0);
	nconf.save();

	// 如果是文件,直接进行上传
	// 还会根据文件大小,进行简单上传和分块上传
	if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
		console.log('  ')
		//debug('  开始上传文件: ' + filePath);
		self.config({
			dataType: 'json'
		});
		nconf.file({
			file: configFile
		});
		var contentType = require('mime').lookup(filePath) || '';
		// 分块上传
		async.auto({
			/**
			 * 初始化配置文件,如果没有就新建一个
			 */
			init: function(callback) {
				if (!fs.existsSync(configFile)) {
					configInit(filePath, configFile, function(err) {
						callback(err);
					})
				} else {
					callback(null);
				}

			},
			show: ['init', function(callback) {
				console.log('  开始上传文件: ' + filePath)
				bar = new ProgressBar(' [:bar] :percent', {
					total: nconf.get('count')
				});
				bar.curr = nconf.get('index');
				bar.render();
				callback(null)
			}],
			/**
			 * 获取uploadId,如果有就直接读取,没有就从服务器获取一个
			 */
			getUploadId: ['init', function(callback) {
				var uploadId = nconf.get('uploadId');

				if ( !! uploadId) {
					callback(null, uploadId)
				} else {
					self.object.multitpart_upload_init(params, function(err, data, res) {
						uploadId = data.InitiateMultipartUploadResult.UploadId;
						nconf.set('uploadId', uploadId);
						nconf.save();
						callback(null, uploadId)
					});
				}
			}],
			/**
			 * 对文件进行上传
			 * 上传后要把信息写到本地缓存配置文件中
			 * 如果都上传完了,就把配置文件删除
			 * 并通知服务器,合并分块文件
			 */
			upload: ['getUploadId', function(callback, result) {
				var uploadId = result.getUploadId;
				var count = nconf.get('count');
				var index = nconf.get('index');
				var chunkSize = nconf.get('chunkSize');
				var currentRetries = nconf.get('retries');

				// 在报错的时候重试
				function retry(err) {
					debug('upload ERROR:', err);
					if (currentRetries > config.retries) {
						throw err
					} else {
						currentRetries = currentRetries + 1;
						nconf.set('retries', currentRetries)
						nconf.save();
						console.log('第 ' + currentRetries + ' 次重试');
						up();
					}
				}
				// 真正往服务端传递数据
				function up() {
					debug('上传用时', 'index: ' + index)
					var start = (index - 1) * chunkSize;
					// 判断是否已经全部都传完了
					if (index <= count) {
						getFileContent(filePath, chunkSize, start, function(body) {
							delete params.filePath;
							params.UploadId = uploadId;
							params.PartNumber = index;
							params.body = body;
							params.type = contentType;
							debug('正在上传第 ', index, ' 块,总共: ', + count + ' 块');

							try {
								self.object.upload_part(params, function(err, data, res) {
									if (err) {
										retry(err);
									} else {
										bar.tick();
										var etag = res.headers.etag;
										nconf.set('index', index);
										nconf.set('etags:' + index, etag);
										nconf.save(function(err) {
											if (err) throw err;
											index = index + 1;
											up();
										});
									}
								});
							} catch(e) {
								retry(e);
							}
						})
					} else {
						debug('发送合并请求')
						delete params.filePath;
						params.UploadId = uploadId;
						params.body = generateCompleteXML(configFile);
						self.object.upload_complete(params, function(err, data, res) {
							if (err) throw err;
							callback(err, data, res);
						})
					}

				};
				up();
			}]
		},
		function(err, results) {
			if (err) throw err;
			fs.unlinkSync(configFile);
			if (cb) {
				cb(err, results.upload[0], results.upload[1]);
			}
		});
	} else if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) { // 文件夹上传
		var fileList = util.walkFile(filePath, params.fileSetting);
		nconf.file({
			file: configFile
		});
		var count = fileList.length;
		console.log('  开始上传文件夹:' + filePath);
		barDir = new ProgressBar('  ' + ' [:bar] :percent ', {
			total: count,
			width: 100
		});
		barDir.tick();
		var index = 1;
		if (count > 0) {
			// 先初始化缓存文件
			if (!fs.existsSync(configFile)) {
				nconf.set('name', filePath);
				/**
				 * 缓存中不记录文件个数和完成数
				 * 是因为如果中间有文件改动,会增加复杂度
				 * 现在只需要判断用户上传的这个文件之前有没有山穿过就好了
				nconf.set('count',count);
				nconf.set('index',index);
				/**/
				nconf.save();
			}

			async.eachSeries(fileList, function(file, callback) {
				// 需要去掉路径,取得真正文件名
				var key2 = key + file.replace(filePath, '');

				if (!nconf.get('list:' + key2)) { // 之前没有上传过这个文件
					if (fs.statSync(file).isFile()) { // 碰到文件
						if (fs.statSync(file).size > config.chunkSize) { // 大文件,复杂上传
							debug('使用`分块上传`,正在上传第 ' + index + '/' + count + ' 个文件:' + file);
							self.upload.start({
								filePath: file,
								Key: key2
							},
							function(err, data, res) {
								index = index + 1;
								barDir.tick();
								if (index > count) {
									// 删除缓存文件
									fs.unlinkSync(configFile);
									if (cb) cb(err, data, res);
								} else {
									nconf.set('list:' + key2, true);
									nconf.save()
									callback();
								}
							})
						} else { // 小文件 简单上传
							//debug('\n正在上传文件: ', file);
							debug('使用`简单上传` 文件:' + file);
							self.object.put({
								filePath: file,
								Key: key2
							},
							function(err, data, res) {
								debug('index:', index, 'count:', count)
								if (index >= count) {
									fs.unlinkSync(configFile);
									if (cb) cb(err, data, res);
								} else {
									index = index + 1;
									barDir.tick();
									nconf.set('list:' + key2, true);
									nconf.save()
									callback();
								}
							})
						}
					} else { // 文件夹
						if (index >= count) {
							// 统一回调,所以模拟一个返回状态
							fs.unlinkSync(configFile);
							if (cb) cb(null, null, {
								statusCode: 200
							});
						} else {
							index = index + 1;
							nconf.set('list:' + key2, true);
							nconf.save()
							barDir.tick();
							callback();
						}
					}
				} else { // 之前已经上传成功这个文件了
					if (index >= count) {
						// 统一回调,所以模拟一个返回状态
						fs.unlinkSync(configFile);
						if (cb) cb(null, null, {
							statusCode: 200
						});
					} else {
						index = index + 1;
						nconf.set('list:' + key2, true);
						nconf.save()
						barDir.tick();
						callback();
					}
				}
			})
		} else {
			if (cb) {
				cb({
					msg: '本文件夹下没有要上传的文件'
				},
				null, null);
			}
		}
	} else {
		throw new Error('the file is illegal');
	}

}

module.exports = {
	start: upload
}

