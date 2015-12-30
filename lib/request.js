var urllib = require('urllib');
var config = require('./../config');
var xml2json = require("./util").xml2json;
var debug = require('debug')('request');
function send(req, body, headers, cb) {
	var uri = req.uri;

	var headers = headers || {};
	var data = {
		headers: headers,
		method: req.method,
		timeout: 1000 * 60 * 60
	}

	/**/
	if (Buffer.isBuffer(body) || typeof body === 'string') {
		data.content = body;
	} else if (Object.prototype.toString.call(body) === '[object Object]') {
		data.data = body;
	} else if (body) {
		data.stream = body;
		//data.data = form;
	} else {
		data.headers['Content-Length'] = 0;
	};

	debug(data);
	urllib.request(uri, data, function(err, result, res) {
		var rerr = null;

		if (err || Math.floor(res.statusCode / 100) !== 2) {
			rerr = {
				code: res && res.statusCode || - 1,
				error: err || result.error || ''
			};
		}
		debug('err',err);
		debug('res',res);
		if (cb) {
			var data = '';
			if ( !!result) {
				var dataStr = result.toString();
				data = dataStr;
				if (config.dataType === 'json') {
					dataStr = dataStr.replace(/\s\w+\:\w+=\"\S+\"/g, '');
					var json = xml2json.parser(dataStr);
					data = json;
				}
			}
			debug('data',data);
			// 增加原始数据流,因为在写文件的时候
			// `buf.toString` 会有问题
			cb(rerr, data, res,result);
		}
	});

}

function request(req, body, token, cb) {
	var headers = {
		'Content-Type': (typeof req.type !== 'undefined') ? req.type: config.contentType,
		'User-Agent': req.ua || config.ua,
		// warning: 这个地方需要注意,因为后端的token产生需要`date`,所以需要在请求的时候,把用于计算授权的`date`再传给后端,
		// 不能自己生成,否则token就报错了
		date: req.date,
		Authorization: token,
		'Content-Length': ( !! req.body) ? req.body.length: 0
	};

	if (req.headers) {
		for (var it in req.headers) {
			headers[it] = req.headers[it];
		}
	}

	send(req, body, headers, cb);
}

module.exports = request;

