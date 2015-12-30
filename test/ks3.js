var KS3 = require('..');
var should = require('should');

var ak = process.env.AK || 'WRHLHOZQD3OY3VTROMGQ';
var sk = process.env.SK || 'dWSmyMmVcpahaZphUdyVz11myMIoCAsOKeZ6wi4T';
var bucketName = process.env.TEST_BUCKET || 'ks3-sdk-test';

describe('KS3 instantiation', function() {
	it('require ak and sk', function() {
		true && (function() {
			var client = new KS3();
		}).should.throw ('require ak and sk. visit: http://ks3.ksyun.com/doc/api/index.html. ak=AccessKeyID,sk=AccessKeySecret')
	});

	it('shoule not require bucketName',function(){
		true && (function() {
			var client = new KS3(ak,sk);
		}).should.not.throw ()
	})
});

describe('KS3 init', function() {
	var client = new KS3(ak,sk,bucketName);
	it('should have these api: service,bucket,object,upload', function() {
		client.should.have.property('service');
		client.should.have.property('bucket');
		client.should.have.property('object');
		client.should.have.property('upload');
		client.should.have.property('download');
	});
});

describe('KS3 config', function() {
	var client = new KS3(ak,sk,bucketName);
	it('should change the default config in config.js', function() {
		var testCfg = {
			dataType : 'json',
			ua : 'TEST_KS3_NodeJS'
		};
		var defaultCfg = {
			dataType : 'xml',
			ua : 'KS3_NodeJS'
		}
		client.config(testCfg);
		var config = require('./../config');
		config.dataType.should.equal('json');
		config.ua.should.equal('TEST_KS3_NodeJS');
		client.config(defaultCfg);

	});
});



