const debug = require('debug')('app');
const service = require('./api/service');
const bucket = require('./api/bucket');
const object = require('./api/object');
const upload = require('./api/upload');
const download = require('./api/download');
const auth = require('./auth');
const config = require('./../config');

const attrs = {
	service,
	bucket,
	object,
	upload,
	download,
	auth
}

/**
 * KS3
 */
function KS3(ak, sk, bucket, region) {
	if ( !! ak && !! sk) {
		var core = this;
		this.ak = ak;
		this.sk = sk;
		this.bucketName = bucket || null;
		if( region ) {
			config.setRegion(region);
		}

		Object.keys(attrs).forEach(name => {
			const api = attrs[name]
			core[name] = {};
			// 绑定this到各自函数身上
			for (var attr in api) {
				core[name][attr] = (function(attr) {
					return function() {
						var args = Array.prototype.slice.call(arguments);
						return api[attr].apply(core, args);
					}
				})(attr)
			}
		});
	} else {
		throw new Error('require ak and sk. visit: http://ks3.ksyun.com/doc/api/index.html. ak=AccessKeyID,sk=AccessKeySecret');
	}
}

/**
 * 填充信息
 */
KS3.version = require('../package.json').version;


KS3.prototype = {
	// 进行配置
	config: function(cfg) {
		for (var it in cfg) {
			config[it] = cfg[it];
		}
	}
};

module.exports = KS3;

