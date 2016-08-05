var url = require('url');
var debug = require('debug')('auth');
var crypto = require('crypto');
var config = require('./../config');

var encodeWithBase64 = function(s) {
	var encodedStr = new Buffer(s).toString('base64');
	return encodedStr;
};

var hmacSha1 = function(encodedStr, sk) {
	var hmac = crypto.createHmac('sha1', sk);
	debug('over')
	hmac.update(encodedStr);
	return hmac.digest('base64');
};


var hmacMd5=function(encodedStr,sk){
	var hmac = crypto.createHmac('md5', sk);
	hmac.update(encodedStr);
	return hmac.digest('base64');
};
/**
 *  产生headers
 *  CanonicalizedKssHeaders
 */
function generateHeaders(header) {
	var str = '';
	var arr = [];

	if(header){
		var prefix = 'x-'+config.prefix;
		for(var it in header){
			// step1 : 所有`x-kss`的属性的键都转换为小写，值不变
			if(it.indexOf(prefix) == 0){
				arr.push((it.toLowerCase() +':'+header[it]));
			}
		}
		// step2 : 根据属性名排序
		arr.sort();
		// step3 : 拼接起来
		str = arr.join('\n');
	}
	return str;
}

/**
 *
 * 计算通过 HTTP 请求 Header 发送的签名
 */
var generateToken = function(sk, req, body) {
	var urlObj = url.parse(req.uri);
	var pathObj = urlObj.path;
	debug('req:', req);

	var http_verb = req.method || 'GET';
	// Content-MD5, Content-Type, CanonicalizedKssHeaders可为空
	// Content-MD5 表示请求内容数据的MD5值, 使用Base64编码
	//var content_md5 = req.content_md5||'';
	var content_md5 = (!!req.body)?hmacMd5(req.body,sk):'';
	var content_type = (typeof req.type!== 'undefined')?req.type : config.contentType;
	var canonicalized_Kss_Headers = generateHeaders(req.headers);
	var canonicalized_Resource = req.resource || '/';
	if (canonicalized_Kss_Headers !== '') {
		var string2Sign = http_verb + '\n' + content_md5 + '\n' + content_type + '\n' + (req.date) + '\n' + canonicalized_Kss_Headers + '\n' + canonicalized_Resource;
	} else {
		var string2Sign = http_verb + '\n' + content_md5 + '\n' + content_type + '\n' + (req.date) + '\n' + canonicalized_Resource;
	}

	debug('string2Sign:', string2Sign);
	//console.log('string2Sign:', string2Sign);
	var digest = hmacSha1(string2Sign, sk);  //已经经过了base64编码
	debug('digest:',digest);
	return digest;
};

/**
 * 基于StringToSign生成Signature
 * @param sk
 * @param stringToSign 经过Base64编码的policy
 * @returns {*}
 */
var getSignature = function(sk, stringToSign) {
	var signature = hmacSha1(stringToSign, sk);
	return signature;
};


/**
 * 获取Authorization请求头的值
 * 计算通过 HTTP 请求 Header 发送的签名
 * @param ak
 * @param sk
 * @param req
 * @param body
 * @returns {string}
 */
var generateAuth = function(ak,sk,req, body) {
	var token = generateToken(sk,req,body);
	return 'KSS '+ak+':'+ token;
};

/**
 *
 * 通过 POST请求的表单实体发送的签名
 * @param sk    {string}
 * @param policy {Object}  ex.
 * {
		"expiration": "2016-02-02T12:12:00.000Z",
		"conditions": [
			["eq", "$bucket", 'bucket4jssdk'],
			["starts-with", "$key", ""],
			["starts-with", "$acl", "public-read"],
			["starts-with", "$name", ""]   //post表单中默认会传name字段，故也需要加到policy中
		]
	};
 */
var getFormSignature = function(sk, policy) {
	var stringToSign = new Buffer(JSON.stringify(policy)).toString('base64');
	var signature = getSignature(sk, stringToSign);
	return signature;
};

/**
 * 计算通过URL QueryString发送的签名
 * @param sk
 * @param expires {number} 链接的过期时间，使用Unix_Time表示(s为单位）
 * @param bucket bucket name
 * @param object  object key
 */
var getQueryStringSignature = function(sk, expires, bucket, object) {
	var string2Sign = 'GET' + '\n\n\n' + expires + '\n' + '/' + bucket + '/' + object;
	var signature = getSignature(sk, string2Sign);
	return signature;
};


function isKS3Callback(){}

module.exports = {
	generateHeaders : generateHeaders,
	generateToken : generateToken,
	generateAuth : generateAuth,
	getSignature : getSignature,
	getFormSignature : getFormSignature,
	getQueryStringSignature : getQueryStringSignature
};

