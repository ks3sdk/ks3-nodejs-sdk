var url = require('url');
var debug = require('debug')('auth');
var crypto = require('crypto');
var config = require('./../config');

var encodeWithBase64 = function(s) {
	var encodedStr = new Buffer(s).toString('base64');
	return encodedStr;
}

var hmacSha1 = function(encodedStr, sk) {
	var hmac = crypto.createHmac('sha1', sk);
	debug('over')
	hmac.update(encodedStr);
	return hmac.digest('base64');
}


var hmacMd5=function(encodedStr,sk){
	var hmac = crypto.createHmac('md5', sk);
	hmac.update(encodedStr);
	return hmac.digest('base64');
}
/**
 *  产生headers
 */
function generateHeaders(header) {
	var str = '';
	var arr = [];

	if(header){
		var prefix = 'x-'+config.prefix;
		for(var it in header){
			// step1 : 所有`x-kss`的属性都转换为小写
			if(it.indexOf(prefix) == 0){
				arr.push((it+':'+header[it]).toLowerCase());
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
 * 生成token
 *
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
	var digest = hmacSha1(string2Sign, sk);
	//var safeDigest = encodeWithBase64(digest);
	var safeDigest = digest;
	debug('safeDigest:',safeDigest);
	return safeDigest;
}

var generateAuth = function(ak,sk,req, body) {
	var token = generateToken(sk,req,body);
	return 'KSS '+ak+':'+token;
}



function isKS3Callback(){}

exports.generateHeaders = generateHeaders;
exports.generateToken = generateToken;
exports.generateAuth = generateAuth;
