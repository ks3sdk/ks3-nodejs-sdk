var KS3 = require('..');
var should = require('should');
require('should-http');
var ak = process.env.AK || 'WRHLHOZQD3OY3VTROMGQ';
var sk = process.env.SK || 'dWSmyMmVcpahaZphUdyVz11myMIoCAsOKeZ6wi4T';
var bucketName = process.env.BUCKET || 'ks3-sdk-test';

describe('API bucket', function() {

	describe('create bucket', function() {
		var bucketName = 'test-sdk' + (+new Date());
		var client = new KS3(ak, sk, bucketName);
		it('create bucket && delete bucket', function(done) {
			client.bucket.put({
				Bucket: bucketName
			}, function(err, data, res) {
				should.not.exist(err);
				res.should.have.status(200);
				client.bucket.del(function(err, data, res) {
					should.not.exist(err);
					res.should.have.status(204); // 删除bucket，成功的状态码为204
					done();
				})
			});
		});
		it('require Bucket not pass verify', function() {
			(function() {
				client.bucket.put({Bucket: 'test_tes'}, function() {});
			}).should.throw('the illegal bucketName');
		});
		it('require ACL not pass verify', function() {
			(function() {
				client.bucket.put({Bucket: bucketName, ACL: 'testacl'}, function() {});
			}).should.throw('the illegal acl');
		})
	});
	describe('other handle for bucket', function() {
		var client = new KS3(ak, sk, bucketName);
		beforeEach(function(){
			client.bucket.put(function(err, data, res){});
		});
		describe('bucket ACL', function(done) {
			it('Put ACL && get ACL', function(done) {
				client.bucket.putACL({ACL: 'private'}, function(err, data, res) {
					should.not.exist(err);
					res.should.have.status(200);
					client.bucket.getACL(function(err, data, res) {
						should.not.exist(err);
						res.should.have.status(200);
						done();
					});
					
				});
			});
			it('Put ACL without params', function() {
				(function() {
					client.bucket.putACL(function(err, data, res) {});
				}).should.throw('require the acl')
			});
			it('Put ACL params verify fail', function() {
				(function() {
					client.bucket.putACL({ACL: 'testacl'}, function(err, data, res) {});
				}).should.throw('the illegal acl')
			});

		});

		describe('bucket location', function() {
			it('get location should get a 2XX statuscode', function(done) {
				client.bucket.getLocation(function(err, data, res) {
					should.not.exist(err);
					res.should.have.status(200);
					done();
				});
			});
		});
		describe('bucket logging', function() {
			it('get logging should get a 2XX statuscode', function(done) {
				client.bucket.getLogging(function(err, data, res) {
					should.not.exist(err);
					res.should.have.status(200);
					done();
				});
			});	
		});
		
		describe('list objects', function() {
			it('get objects without params', function(done) {
				client.bucket.get(function(err, data, res) {
					should.not.exist(err);
					res.should.have.status(200);
					done();
				});
			});
			it('get objects with params', function(done) {
				client.bucket.get({
				    'max-keys': 30,
				    marker: '',
				    prefix: ''
				}, function(err, data, res) {
					should.not.exist(err);
					res.should.have.status(200);
					done();
				});
			});

			/**
			 * 禁止传递空值 delimiter,
			 * sdk会做处理
			 */
			it('get objects with empty delimiter', function(done) {
				client.bucket.get({
				    'max-keys': 30,
				    delimiter:'',
				    marker: '',
				    prefix: ''
				}, function(err, data, res) {
					should.not.exist(err);
					res.should.have.status(200);
					done();
				});
			});
		});
		describe('head bucket', function() {
			it('should get a 2XX statuscode for head bucket', function(done) {
				client.bucket.head({Bucket: bucketName}, function(err, data, res) {
					should.not.exist(err);
					res.should.have.status(200);
					done();
				});
			});
		});
		describe('bucket name is null', function() {
			var client = new KS3(ak, sk);
			it('return a error', function() {
				(function(){
					client.bucket.getACL(function(err, data, res){})
				}).should.throw('require the bucketName');
			})
		});
	});
		
});
