var request = require('./../request');
var auth = require('./../auth');
var config = require('./../../config');
var util = require('../util');
var mime = require('mime');
var fs = require('fs');
var uploadMaxSize = config.uploadMaxSize;
var CHUNK_MIN_SIZE = 5 * 1024 * 1024;
/**
 * 删除单个Object
 * params: {
 *	  Bucket: '', // 非必传
 *    Key: '' // Object Key  必须传
 *    VersionId: ''
 * }
 */
function del(params, cb) {
	if (params.Key === null || params.Key === undefined) {
		throw new Error('require the Key');
	}
	var key = util.encodeKey(params.Key);
	var resource = params.VersionId ? '/' + key + '?versionId=' + params.VersionId: '/' + key;
	var bucketName = params.Bucket || this.bucketName || '';
	if(!bucketName) {
		throw new Error('require the bucket name');
	}
	var req = {
		method: 'DELETE',
		date: util.getDate(),
		uri: config.protocol + '://' + bucketName + '.' + config.baseUrl + resource,
		resource: '/' + bucketName + resource,
		type: ''
	}

	var authStr = auth.generateAuth(this.ak, this.sk, req);
	var body = null;
	request(req, body, authStr, cb);

}

/**
 * 获取object
 * params: {
 *	  Bucket: '', //非必传
 *    Key: '' // Object Key  必须传
 * }
 */
function get(params, cb) {
	if (params.Key === null || params.Key === undefined) {
		throw new Error('require the Key');
	}
	var resource = '/' + util.encodeKey(params.Key);
	var bucketName = params.Bucket || this.bucketName || '';
	var range = params.range || '';
	if(!bucketName) {
		throw new Error('require the bucket name');
	}
	var req = {
		method: 'GET',
		date: util.getDate(),
		uri: config.protocol + '://' + bucketName + '.' + config.baseUrl + resource,
		resource: '/' + bucketName + resource,
		headers: {}
	};
	var reRange = /^bytes=(\d+)-(\d+)$/i;

	if(range!==''&& reRange.test(range)){
		req.headers['Range'] = range;
	}
	var authStr = auth.generateAuth(this.ak, this.sk, req);
	var body = null;
	request(req, body, authStr, cb);

}
/**
 * 获取Object ACL
 * params: {
 *    Key: '' // Object Key  必须传
 * }
 */
function getAcl(params, cb) {
	if (params.Key === null || params.Key === undefined) {
		throw new Error('require the Key');
	}
	var key = util.encodeKey(params.Key);
	var resource = params.VersionId ? '/' + key + '?ACL&versionId=' + params.VersionId: '/' + key + '?acl';
	var bucketName = params.Bucket || this.bucketName || '';
	if(!bucketName) {
		throw new Error('require the bucket name');
	}
	var req = {
		method: 'GET',
		date: util.getDate(),
		uri: config.protocol + '://' + bucketName + '.' + config.baseUrl + resource,
		resource: '/' + bucketName + resource,
		type: ''
	}

	var authStr = auth.generateAuth(this.ak, this.sk, req);
	var body = null;
	request(req, body, authStr, cb);
}
/**
 * 设置 Object ACL
 * params {
 *    Key: '', // Object Key  必须传
 *    VersionId: '',
 *    ACL: ''  // Object ACL 必须
 * }
 */
function putAcl(params, cb) {
	var ACL = params.ACL;
	if (params.Key === null || params.Key === undefined) {
		throw new Error('require the Key');
	}
	if (!ACL) {
		throw new Error('require the permission');
	}
	if (util.verifyAcl(ACL) == null) {
		throw new Error('the illegal ACL');
	}
	var key = util.encodeKey(params.Key);
	var resource = params.VersionId ? '/' + key + '?ACL&versionId=' + params.VersionId: '/' + key + '?acl';

	var bucketName = params.Bucket || this.bucketName || '';
	if(!bucketName) {
		throw new Error('require the bucket name');
	}
	var req = {
		method: 'PUT',
		date: util.getDate(),
		uri: config.protocol + '://' + bucketName + '.' + config.baseUrl + resource,
		resource: '/' + bucketName + resource,
		headers: {}
	}
	var attr_Acl = 'x-' + config.prefix + '-acl';
	req.headers[attr_Acl] = ACL;
	var authStr = auth.generateAuth(this.ak, this.sk, req);
	var body = null;
	request(req, body, authStr, cb);
}
/**
 * 获取指定object的元数据
 * params {
 *    Key: '' // 必须
 *    VersionId: ''
 * }
 */
function headObject(params, cb) {
	if (params.Key === null || params.Key === undefined) {
		throw new Error('require the Key');
	}
	var key = util.encodeKey(params.Key);
	var resource = params.VersionId ? '/' + key + '?versionId=' + params.VersionId: '/' + key;
	var bucketName = params.Bucket || this.bucketName || '';
	if(!bucketName) {
		throw new Error('require the bucket name');
	}
	var req = {
		method: 'HEAD',
		date: util.getDate(),
		uri: config.protocol + '://' + bucketName + '.' + config.baseUrl + resource,
		resource: '/' + bucketName + resource,
		type: ''
	}

	var authStr = auth.generateAuth(this.ak, this.sk, req);
	var body = null;
	request(req, body, authStr, cb);
}

function put(params, cb) {
	var bucketName = params.Bucket || this.bucketName || '';;
	var Key = util.encodeKey(params.Key) || null;
	var filePath = params.filePath || null;

	if (!bucketName) {
		throw new Error('require the bucketName');
	}

	if (!Key) {
		throw new Error('require the object Key');
	}

	var ak = this.ak;
	var sk = this.sk;
	var body = '';

	// 传递的是 STRING 或者BUFFER
	if (!filePath) {
		body = params.Body || '';

	} else { // 传递的是文件路径
		if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
			if (fs.statSync(filePath).size >= uploadMaxSize) {
				throw new Error('The file size should be less than 5G.Plase use `Multipart upload`, visit http://ks3.ksyun.com/doc/api/multipart_upload.html');
			} else {
				body = fs.readFileSync(filePath);
			}
		} else {
			throw new Error('the file is illegal');
		}
	}

	var resource = '/' + Key;
	var req = {
		method: 'PUT',
		// 在上传文件的时候默认一个content-type 
		type:require('mime').lookup(Key),
		date: util.getDate(),
		uri: config.protocol + '://' + bucketName + '.' + config.baseUrl + resource,
		resource: '/' + bucketName + resource,
		headers: {}
	}

	var acl = params.ACL;
	if (acl && util.verifyAcl(acl)) {
		var attr_Acl = 'x-' + config.prefix + '-acl';
		req.headers[attr_Acl] = params.ACL;
	}

	var authStr = auth.generateAuth(ak, sk, req, body);
	request(req, body, authStr, cb);
}

/**
 * 下面这些部分都是关于分块上传的
 */
/**
 * 初始化
 */
var multitpart_upload_init = function(params, cb) {
	var ak = this.ak || '';
	var sk = this.sk || '';
	var bucketName = params.Bucket || this.bucketName || '';;
	var Key = util.encodeKey(params.Key) || null;

	if (!bucketName) {
		throw new Error('require the bucketName');
	}

	if (!Key) {
		throw new Error('require the object Key');
	}

	var body = null;
	var resource = '/' + Key + '?uploads';
	var req = {
		method: 'POST',
		// TODO: type:require('mime').lookup(key),
		date: util.getDate(),
		uri: config.protocol + '://' + bucketName + '.' + config.baseUrl + resource,
		resource: '/' + bucketName + resource,
		headers: {}
	}

	var acl = params.ACL;
	if (acl && util.verifyAcl(acl)) {
		var attr_Acl = 'x-' + config.prefix + '-acl';
		req.headers[attr_Acl] = params.ACL;
	}

	// TODO: x-kss-meta
	var authStr = auth.generateAuth(ak, sk, req, body);
	request(req, body, authStr, cb);
}

function upload_part(params, cb){
	var ak = this.ak || '';
	var sk = this.sk || '';
	var bucketName = params.Bucket || this.bucketName || '';;
	var key = util.encodeKey(params.Key)|| null;
	var contentType = params.type || '';

	var partNumber = (typeof params.PartNumber!=='undefined') ?params.PartNumber: '';
	var uploadId = params.UploadId || '';


	if (!bucketName || !key) {
		throw new Error('require the bucketName and object key');
	}

	if (partNumber==='' || !uploadId) {
		throw new Error('require the partNumber and uploadId');
	}


	var body = params.body || '';
	var resource = '/' + key + '?partNumber='+partNumber+'&uploadId='+uploadId;
	var req = {
		method: 'PUT',
		type:contentType,
		date: util.getDate(),
		uri: config.protocol + '://' + bucketName + '.' + config.baseUrl + resource,
		resource: '/' + bucketName + resource,
		headers: {}
	}

	/**
	 * TODO: encryption
	/**/

	var authStr = auth.generateAuth(ak, sk, req, body);
	request(req, body, authStr, cb);
}

function upload_complete(params,cb){
	var ak = this.ak || '';
	var sk = this.sk || '';
	var bucketName = params.Bucket || this.bucketName || '';;
	var key = util.encodeKey(params.Key)|| null;

	var uploadId = params.UploadId || '';

	if (!bucketName || !key) {
		throw new Error('require the bucketName and object key');
	}

	if (!uploadId) {
		throw new Error('require the uploadId');
	}
	/**
	 * http://docs.aws.amazon.com/AmazonS3/latest/API/mpUploadComplete.html
	 * <CompleteMultipartUpload>
		<Part>
		<PartNumber>PartNumber</PartNumber>
		<ETag>ETag</ETag>
		</Part>
		...
	</CompleteMultipartUpload>
	*/
	var body = params.body || '';
	var resource = '/' + key + '?uploadId='+uploadId;
	var req = {
		method: 'POST',
		date: util.getDate(),
		type:'text/plain',
		uri: config.protocol + '://' + bucketName + '.' + config.baseUrl + resource,
		resource: '/' + bucketName + resource,
		headers: {}
	};

	var acl = params.ACL;
	if (acl && util.verifyAcl(acl)) {
		var attr_Acl = 'x-' + config.prefix + '-acl';
		req.headers[attr_Acl] = params.ACL;
	}
	var authStr = auth.generateAuth(ak, sk, req, body);
	request(req, body, authStr, cb);
}

function upload_abort(params,cb){
	var ak = this.ak || '';
	var sk = this.sk || '';
	var bucketName = params.Bucket || this.bucketName || '';;
	var key = util.encodeKey(params.Key)|| null;

	var uploadId = params.UploadId || '';

	if (!bucketName || !key) {
		throw new Error('require the bucketName and object key');
	}

	if (!uploadId) {
		throw new Error('require the uploadId');
	}

	var body = params.body || '';
	var resource = '/' + key + '?uploadId='+uploadId;
	var req = {
		method: 'DELETE',
		date: util.getDate(),
		uri: config.protocol + '://' + bucketName + '.' + config.baseUrl + resource,
		resource: '/' + bucketName + resource,
		headers: {}
	};

	var authStr = auth.generateAuth(ak, sk, req, body);
	request(req, body, authStr, cb);
}

function upload_list_part(params,cb){
	var ak = this.ak || '';
	var sk = this.sk || '';
	var bucketName = params.Bucket || this.bucketName || '';;
	var key = util.encodeKey(params.Key)|| null;

	var uploadId = params.UploadId || '';

	if (!bucketName || !key) {
		throw new Error('require the bucketName and object key');
	}

	if (!uploadId) {
		throw new Error('require the uploadId');
	}

	var body = params.body || '';
	var resource = '/' + key + '?uploadId='+uploadId;
	var req = {
		method: 'GET',
		date: util.getDate(),
		uri: config.protocol + '://' + bucketName + '.' + config.baseUrl + resource,
		resource: '/' + bucketName + resource,
		headers: {}
	};

	var authStr = auth.generateAuth(ak, sk, req, body);
	request(req, body, authStr, cb);
}



module.exports = {
	del: del,
	get: get,
	put: put,
	getAcl: getAcl,
	putAcl: putAcl,
	head: headObject,
	multitpart_upload_init: multitpart_upload_init,
	upload_part:upload_part,
	upload_complete:upload_complete,
	upload_abort:upload_abort,
	upload_list_part:upload_list_part
}

