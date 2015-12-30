var request = require('./../request');
var auth = require('./../auth');
var config = require('./../../config');

/**
 * 获取bucket列表
 */
function get(cb) {
	var date = (new Date()).toUTCString();

	var req = {
		method: 'GET',
		date: date,
		uri: config.protocol + '://' + config.baseUrl,
		resource: '/'
	}
	var authStr = auth.generateAuth(this.ak, this.sk, req);
	var body = null;

	request(req, body, authStr, cb);
}
module.exports = {
	get: get,
	listBucket:get
}

