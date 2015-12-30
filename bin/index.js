#!/usr/bin/env node

var KS3 = require('../');
var path = require('path');
var async = require('async');
var util = require('../lib/util');
var nconf = require('nconf');

require('colorful').colorful();
var uploadignore = require('./uploadignore');

/**
 * 配置文件
 */
var configFile = path.join(__dirname, 'developer.json');
nconf.file({
	file: configFile
});

/**
 * 工具
 */

var check = {
	ak: function(akStr) {
		if ( !! akStr && akStr.length == 20) {
			return akStr;
		} else {
			throw new Error('    输入的AK是非法的')
		}
	},
	sk: function(skStr) {
		if ( !! skStr && skStr.length == 40) {
			return skStr;
		} else {
			throw new Error('    输入的SK是非法的')
		}
	},
	bucketName: function(bucketName) {
		if ( !! bucketName && util.verifyBucket(bucketName)) {
			return bucketName;
		} else {
			throw new Error('    bucket名称不符合规范,http://ks3.ksyun.com/doc/api/index.html#bucket')
		}
	},
	key: function(keyStr) {
		if ( !! keyStr && keyStr.length > 0) {
			return util.encodeKey(keyStr);
		} else {
			throw new Error('    key不符合规范,http://ks3.ksyun.com/doc/api/index.html#bucket')
		}
	}
}

var program = require('commander');
var promptly = require('promptly');

program.on('--help', function() {
	console.log('  金山云存储:http://ks3.ksyun.com/');
	console.log('');
});

/**
 * 初始化操作:
 */
program.command('init').description('命令初始化,设置个人信息').option("-a --ak [ak]", "上传文件要存储到的Bucket").option("-s --sk [sk]", "上传文件要存储到的Bucket").option("-b --bucket [bucket]", "上传文件要存储到的Bucket").action(function(options) {
	init(options);
});
/**
 * 重置操作
 */
program.command('reset').description('重置当前配置').action(function() {
	reset();
});
/**
 * 上传操作
 */
program.command('upload').description('上传文件或者文件夹').option("-p --path [path]", "选择要上传的文件的地址").option("-b --bucket [bucket]", "上传文件要存储到的Bucket").option("-k --key [key]", "文件(文件夹)存储名称").option("--withsubdir", "是否上传子文件夹").action(function(options) {
	upload(options);
});

/**
 * 下载文件,还不支持下载文件夹
 */
program.command('download').description('下载文件').option("-p --path [path]", "选择下载文件的存放地址").option("-b --bucket [bucket]", "下载文件所在的Bucket").option("-k --key [key]", "下载文件的名称").action(function(options) {
	download(options);
});


program.version(KS3.version).usage('<command> [options]').parse(process.argv);
if (!program.args.length) program.help();

/**
 * 具体操作
 */

/**
 * 存储ak,sk
 */
function init(options) {
	var akStr = options.ak || '';
	var skStr = options.sk || '';
	var bucketStr = options.bucket || '';

	console.log('    请按照指示完成配置信息:');
	console.log('    关于AK和SK,相关文档请访问:http://ks3.ksyun.com/doc/console/index.html');
	console.log('');
	var stepAK = 'AK(AccessKey)*:  ';
	var stepSK = 'SK(Access Key Secret)*:   ';
	var stepBucket = 'Bucket:   ';

	async.series([function(callback) {
		if (!akStr) {
			promptly.prompt(stepAK, {
				validator: check.ak,
			default:
				akStr
			},
			function(err, akStr) {
				if (err) {
					console.error(err);
					return err.retry()
				} else {
					callback(null, akStr);
				}
			});
			if ( !! nconf.get('AK')) {
				try{
					process.stdin.emit('data', nconf.get('AK'));
				} catch(e){}
			}
		} else {
			callback(null, akStr)
		}
	},
	function(callback) {
		if (!skStr) {
			promptly.prompt(stepSK, {
				validator: check.sk,
			default:
				skStr
			},
			function(err, skStr) {
				if (err) {
					console.error(err);
					return err.retry()
				} else {
					callback(null, skStr);
				}
			});
			if ( !! nconf.get('SK')) {
				try{
					process.stdin.emit('data', nconf.get('SK'));
				} catch (e){}
			}
		} else {
			callback(null, skStr)
		}
	},
	function(callback) {
		if (!bucketStr) {
			promptly.prompt(stepBucket, {
				validator: check.bucketName,
			default:
				bucketStr
			},
			function(err, bucketStr) {
				if (err) {
					console.error(err);
					return err.retry()
				} else {
					callback(null, bucketStr);
				}
			});
			if ( !! nconf.get('BUCKET')) {
				try{
					process.stdin.emit('data', nconf.get('BUCKET'));
				} catch (e){}
			}
		} else {
			callback(null, bucketStr)
		}
	}], function(err, results) {
		if (err) {
			console.log(err);
			throw err;
		} else {
			var ak = results[0];
			var sk = results[1];
			var bucket = results[2];
			nconf.set('AK', ak);
			nconf.set('SK', sk);
			if (bucket !== '') {
				nconf.set('BUCKET', bucket);
			}
			nconf.save();
		}
	})
};

/**
 * 重置
 */
function reset() {
	promptly.choose('    Do you want to reset the config?(yes or no) ', ['yes', 'no'], function(err, value) {
		if (value === 'yes') {
			nconf.set('AK', '');
			nconf.set('SK', '');
			nconf.set('BUCKET', '');
			nconf.save();
			console.log('   已经清空配置和上次历史记录');
		}
	});
}

/**
 * 上传
 */

function upload(options) {
	var stepPath = '    PATH: ';
	var stepBucket = '    Bucket: ';
	var stepKey = '    Key: ';
	var akStr = nconf.get('AK') || '';
	var skStr = nconf.get('SK') || '';
	var filePath = options.path || '';
	var bucketStr = options.bucket || '';
	var keyStr = options.key || '';
	var withsubdir = options.withsubdir ? options.withsubdir: false;

	if (akStr === '' || skStr === '') {
		console.error('  还没有进行初始化设置,请先使用命令 `ks3 init` 进行初始化');
		process.exit(0);
	}

	if (!filePath) {
		console.log('    请输入要上传的文件(或文件夹)的地址')
		promptly.prompt(stepPath, function(err, filePath) {
			if (err) {
				console.error(err);
				return err.retry()
			} else {
				nconf.set('PATH', filePath);
				nconf.save();
				upload({
					path: filePath
				});
			}
		});
		if ( !! nconf.get('PATH')) {
			try{
				process.stdin.emit('data', nconf.get('PATH'));
			} catch(e){}
		}
	} else {
		async.series([function(callback) {
			if (!bucketStr) {
				console.log('    请输入上传文件(文件夹)到指定的Bucket:  ')
				promptly.prompt(stepBucket, {
					validator: check.bucketName
				},
				function(err, bucket) {
					if (err) {
						console.error(err);
						return err.retry()
					} else {
						nconf.set('BUCKET', bucket);
						nconf.save();
						callback(null, bucket);
					}
				});
				if ( !! nconf.get('BUCKET')) {
					try{
						process.stdin.emit('data', nconf.get('BUCKET'));
					} catch(e){}
				}
			} else {
				callback(null, bucketStr);
			}
		},
		function(callback) {
			if (!keyStr) {
				console.log('    请输入上传文件(文件夹)的名称:  ')
				promptly.prompt(stepKey, {
					validator: check.key
				},
				function(err, key) {
					if (err) {
						console.error(err);
						return err.retry()
					} else {
						nconf.set('KEY', key);
						nconf.save();
						callback(null, key);
					}
				});

				if ( !! nconf.get('KEY')) {
					try{
						process.stdin.emit('data', nconf.get('KEY'));
					} catch(e){}
				}
			} else {
				callback(null, keyStr);
			}
		}], function(err, results) {
			if (err) {
				console.log(err);
				throw err;
			} else {
				var flag = "----------------------------";
				var bucket = results[0];
				var key = results[1];
				nconf.set('BUCKET', bucket);
				nconf.save();

				console.log('    开始上传');
				console.log(flag);
				var client = new KS3(akStr, skStr, bucket);
				filePath = filePath.replace(/(\\\s)/ig, ' ');

				client.upload.start({
					Bucket: bucket,
					filePath: filePath,
					Key: key,
					fileSetting: {
						isDeep: withsubdir,
						ignore: uploadignore
					}
				},
				function(err, data, res) {
					if (err) {
						console.log(err);
						throw err;
					}

					console.log(flag + '\n  上传完毕');
				});
			}
		})
	}

}


/**
 * 下载
 */
function download(options) {
	var stepPath = '    PATH: ';
	var stepBucket = '    Bucket: ';
	var stepKey = '    Key: ';
	var akStr = nconf.get('AK') || '';
	var skStr = nconf.get('SK') || '';
	var filePath = options.path || '';
	var bucketStr = options.bucket || '';
	var keyStr = options.key || '';

	if (akStr === '' || skStr === '') {
		console.error('  还没有进行初始化设置,请先使用命令 `ks3 init` 进行初始化');
		process.exit(0);
	}

	if (!filePath) {
		console.log('    请输入下载文件存放的地址')
		promptly.prompt(stepPath, function(err, filePath) {
			if (err) {
				console.error(err);
				return err.retry()
			} else {
				nconf.set('PATH', filePath);
				nconf.save();
				download({
					path: filePath
				});
			}
		});
		if ( !! nconf.get('PATH')) {
			process.stdin.emit('data', nconf.get('PATH'));
		}
	} else {
		async.series([function(callback) {
			if (!bucketStr) {
				console.log('    请输入要下载文件所在的Bucket:  ')
				promptly.prompt(stepBucket, {
					validator: check.bucketName
				},
				function(err, bucket) {
					if (err) {
						console.error(err);
						return err.retry()
					} else {
						nconf.set('BUCKET', bucket);
						nconf.save();
						callback(null, bucket);
					}
				});
				if ( !! nconf.get('BUCKET')) {
					process.stdin.emit('data', nconf.get('BUCKET'));
				}
			} else {
				callback(null, bucketStr);
			}
		},
		function(callback) {
			if (!keyStr) {
				console.log('    请输入要下载文件的名称:  ')
				promptly.prompt(stepKey, {
					validator: check.key
				},
				function(err, key) {
					if (err) {
						console.error(err);
						return err.retry()
					} else {
						nconf.set('KEY', key);
						nconf.save();
						callback(null, key);
					}
				});

				if ( !! nconf.get('KEY')) {
					process.stdin.emit('data', nconf.get('KEY'));
				}
			} else {
				callback(null, keyStr);
			}
		}], function(err, results) {
			if (err) {
				throw err;
			} else {
				var flag = "----------------------------";
				var bucket = results[0];
				var key = results[1];
				nconf.set('BUCKET', bucket);
				nconf.save();

				console.log('    开始下载');
				console.log(flag);
				var client = new KS3(akStr, skStr, bucket);
				filePath = filePath.replace(/(\\\s)/ig, ' ');

				client.download.start({
					Bucket: bucket,
					filePath: filePath,
					Key: key
				},
				function(err, data, res) {
					if (err){
						console.log(err)
						throw err;
					}

					console.log(flag + '\n  下载完毕');
				});
			}
		})
	}

}

