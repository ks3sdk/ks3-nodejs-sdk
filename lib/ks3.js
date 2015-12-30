var debug = require('debug')('app');
var _service = require('./api/service');
var _bucket = require('./api/bucket');
var _object = require('./api/object');
var config = require('./../config');

/**
 * KS3
 */
function KS3(ak, sk, bucket) {
	if ( !! ak && !! sk) {
		var core = this;
		this.ak = ak;
		this.sk = sk;
		this.bucketName = bucket || null;

		['service', 'bucket', 'object', 'upload','download'].forEach(function(name) {
			var api = require('./api/' + name)
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

