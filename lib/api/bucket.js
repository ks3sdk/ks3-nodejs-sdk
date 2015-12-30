var request = require('./../request');
var auth = require('./../auth');
var config = require('./../../config');
var util = require('./../util');

/**
 * 创建单个Bucket
 * @param {object} params
 * {
 *		Bucket: '' 必须传，要创建的bucketName	
 *		ACL: '', // bucket权限设置 ['private' || 'public-read' || 'public-read-write' || 'authenticated-read']	
 *	}
 */
function put(params, cb) {
	var bName = this.bucketName;

	var bucketName = (function(){
		var s = bName;
		if(!!params && params.Bucket){
			s = params.Bucket
		}
		
		return s;
	})();
	if(!bucketName) {
		throw new Error('require the bucketName');
	} else if(!util.verifyBucket(bucketName)) {
		throw new Error('the illegal bucketName');
	}

	var date = (new Date()).toUTCString();
	var resource = '/';
	
	var req = {
		method: 'PUT',
		date: date,
		uri: config.protocol + '://' + bucketName + '.' + config.baseUrl + resource,
		resource: '/' + bucketName + resource,
		type: ''
	}
	if(params && params.ACL) {
		var acl = params.ACL,
			attr_Acl = 'x-'+config.prefix+'-acl';
		if(util.verifyAcl(acl) == null) {
			throw new Error('the illegal acl');
		}
		req.headers = {
			attr_Acl: acl
		};
	}
	var curAuth = auth.generateAuth(this.ak, this.sk, req);
	var body = null;

	request(req, body, curAuth, cb);
}
/**
 * 获取bucket下的objects
 * params
 * {
 *	   Bucket: '', // 非必传
 *	   delimiter: '',
 *	   'encoding-type': '',
 *	   maker: '',
 *	   'max-keys': 0, // 默认为1000 
 *	   prefix: '',
 * }
 *
 */
function listObjects (params, cb) {
	var queryString = [];
	if(typeof params === 'function') {
		cb = params;
		params = {};
	} else {
		Object.keys(params).forEach(function(key) {
			if(key !== 'Bucket') {
				/**
				 * 在之前的逻辑中,可以传递值为空的 delimiter
				 * 但是现在后端修改逻辑了,禁止传递这样的delimiter
				 */
				if(!(key == 'delimiter' && params[key] =='')){
					queryString.push(key + '=' + encodeURIComponent(params[key]));
				}
			}
		});
	}
	var bucketName = params.Bucket || this.bucketName || '';
	if(!bucketName) {
		throw new Error('require the bucketName');
	}
	var date = (new Date()).toUTCString();

	var resource = '/';

	var req = {
		method: 'GET',
		date: date,
		uri: config.protocol + '://' + bucketName + '.' + config.baseUrl + resource,
		resource: '/' + bucketName + resource,
		type: ''
	}
	var curAuth = auth.generateAuth(this.ak, this.sk, req);
	var body = null;
	// 如果传入的params除了Bucket,还有其他的则，重新设置uri
	if(queryString.length > 0) {
		req.uri += (req.uri.indexOf('?') >= 0 ? '&' : '?');
		req.uri += queryString.join('&');
	}
	request(req, body, curAuth, cb);
}
/**
 * 获取bucket权限
 * params
 * {
 *	 Bucket: '' // 非必传	
 * }
 */
function getACL(params, cb) {
	if(typeof params === 'function') {
		cb = params;
		params = {};
	}
	var date = (new Date()).toUTCString();

	var resource = '/?acl';
	var bucketName = params.Bucket || this.bucketName || '';

	if(!bucketName) {
		throw new Error('require the bucketName');
	}
	var req = {
		method: 'GET',
		date: date,
		uri: config.protocol + '://' + bucketName + '.' + config.baseUrl + resource,
		resource: '/' + bucketName + resource,
		type: ''
	}
	var curAuth = auth.generateAuth(this.ak, this.sk, req);
	var body = null;

	request(req, body, curAuth, cb);
}

/**
 * 修改bucket权限
 * params
 * {
 * 	 Bucket: '' // 非必须
 *	 ACL: 'private || public-read || public-read-write || authenticated-read || bucket-owner-read || bucket-owner-full-control' // 必须
 * }
 */
function putACL(params, cb) {

	var date = (new Date()).toUTCString();
	var acl = params.ACL;
	if (!acl) {
		throw new Error('require the acl');
	}

	if(util.verifyAcl(acl)==null){
		throw new Error('the illegal acl');
	}
	var bucketName = params.Bucket || this.bucketName || '';
	if(!bucketName) {
		throw new Error('require the bucketName');
	}
	var resource = '/?acl';
	var attr_Acl = 'x-'+config.prefix+'-acl';
	var req = {
		method: 'PUT',
		date: date,
		uri: config.protocol + '://' + bucketName + '.' + config.baseUrl + resource,
		resource: '/' + bucketName + resource,
		type: '',
		headers:{}
	}
	req.headers[attr_Acl] = acl;
	var curAuth = auth.generateAuth(this.ak, this.sk, req);
	var body = null;
	request(req, body, curAuth, cb);
}
/**
 * 获取location
 * params
 * {
 *    Bucket: '' // 非必须
 * }
 */
function getLocation(params, cb) {
	if(typeof params === 'function') {
		cb = params;
		params = {};
	}
	var bucketName = params.Bucket || this.bucketName || '';
	if(!bucketName) {
		throw new Error('require the bucketName');
	}
	var date = (new Date()).toUTCString();

	var resource = '/?location'

	var req = {
		method: 'GET',
		date: date,
		uri: config.protocol + '://'+bucketName+'.' + config.baseUrl + resource,
		resource: '/' + bucketName + resource,
		type: ''
	}
	var curAuth = auth.generateAuth(this.ak, this.sk, req);
	var body = null;

	request(req, body, curAuth, cb);
}
/**
 * 获取日志信息
 * params
 * {
 *    Bucket: '' // 非必须
 * }
 */
function getLogging(params, cb) {
	if(typeof params === 'function') {
		cb = params;
		params = {};
	}
	var bucketName = params.Bucket || this.bucketName || '';
	if(!bucketName) {
		throw new Error('require the bucketName');
	}
	var date = (new Date()).toUTCString();

	var resource = '/?logging'

	var req = {
		method: 'GET',
		date: date,
		uri: config.protocol + '://'+bucketName+'.' + config.baseUrl + resource,
		resource: '/' + bucketName + resource,
		type: ''
	}
	var curAuth = auth.generateAuth(this.ak, this.sk, req);
	var body = null;

	request(req, body, curAuth, cb);
}
/**
 * 日志信息设置
 * @param {object} params，若为{BucketLoggingStatus:{}}，则是Disabling Log
 * {
 *	 Bucket: '' // 非必须	
 *	 BucketLoggingStatus:{	// 必须有，但可以为空为空的时候是只“禁用日志”
 *		LoggingEnabled： {}
 *	 }  
 * }
 */
function putLogging(params, cb) {
	var BucketLoggingStatus = params.BucketLoggingStatus || null;
	if(!BucketLoggingStatus) {
		throw new Error('require the BucketLoggingStatus');
	}
	var bucketName = params.Bucket || this.bucketName || '';

	if(!bucketName) {
		throw new Error('require the bucketName');
	}
	var date = (new Date()).toUTCString();
	var resource = '/?logging'
	var body = params;
	var req = {
		method: 'PUT',
		date: date,
		uri: config.protocol + '://'+bucketName+'.' + config.baseUrl + resource,
		resource: '/' + bucketName + resource,
		type: ''
	}

	var curAuth = auth.generateAuth(this.ak, this.sk, req);
	request(req, body, curAuth, cb);
}
/**
 * 删除Bucket(单个)
 * params 
 * {
 *	  Bucket: '' // 非必传
 * }
 */
function del(params, cb) {
	if(typeof params === 'function') {
		cb = params;
		params = {};
	}
	var date = (new Date()).toUTCString();
	var resource = '/'
	var bucketName = params.Bucket || this.bucketName || '';
	if(!bucketName) {
		throw new Error('require the bucketName');
	}
	var req = {
		method: 'DELETE',
		date: date,
		uri: config.protocol + '://'+bucketName+'.' + config.baseUrl + resource,
		resource: '/' + bucketName + resource,
		type: ''
	}
	var curAuth = auth.generateAuth(this.ak, this.sk, req);
	var body = null;

	request(req, body, curAuth, cb);
}
/**
 * 查看是否有权限操作bucket
 * params 
 * {
 *	  Bucket: '' // 非必传
 * }
 */
function headBucket(params, cb) {
	if(typeof params === 'function') {
		cb = params;
		params = {};
	}
	var bucketName = params.Bucket || this.bucketName || '';
	if(!bucketName) {
		throw new Error('require the bucketName');
	}
	var date = (new Date()).toUTCString();
	var resource = '/';

	var req = {
		method: 'HEAD',
		date: date,
		uri: config.protocol + '://'+bucketName+'.' + config.baseUrl + resource,
		resource: '/' + bucketName + resource,
		type: ''
	}
	var curAuth = auth.generateAuth(this.ak, this.sk, req);
	var body = null;
	request(req, body, curAuth, cb);
}

module.exports = {
	put: put,
	get: listObjects,
	getACL: getACL,
	putACL: putACL,
	getLocation: getLocation,
	getLogging: getLogging,
	putLogging: putLogging, // 403
	del: del,
	head: headBucket,
}

