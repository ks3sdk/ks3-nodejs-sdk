var KS3 = require('..');
var should = require('should');
require('should-http');
var path = require('path');
var _dataType = require('./../config').dataType;
var fs = require('fs');

var ak = process.env.AK || 'WRHLHOZQD3OY3VTROMGQ';
var sk = process.env.SK || 'dWSmyMmVcpahaZphUdyVz11myMIoCAsOKeZ6wi4T';
var bucketName = process.env.BUCKET || 'ks3-sdk-test';
describe('API Object', function() {
	var client = new KS3(ak, sk, bucketName);
	beforeEach(function() {
		client.bucket.put(function(err, data, res) {});
	});
	describe('bucket name is empty', function() {
		it('return a error', function() {
			var client = new KS3(ak, sk);
			(function() {
				client.object.get({
					Key: 'test/'
				},
				function() {});
			}).should.
			throw ('require the bucket name');

		})
	});
	describe('Key is empty', function() {
		it('return a error', function() { (function() {
				client.object.get(function() {});
			}).should.
			throw ('require the Key');

		})
	});
	describe('put ', function() {
		describe('upload a file', function() {
			it('upload a object with string content', function(done) {
				var client = new KS3(ak, sk, bucketName);
				var content = 'Hello world';
				var key = 'test_upload.txt';
				client.object.put({
					Bucket: bucketName,
					Key: key,
					Body: content
				},
				function(err, data, res) {
					should.not.exist(err);
					res.should.have.status(200);
					done();
				});
			});
			it('put object and set acl', function(done) {
				var client = new KS3(ak, sk, bucketName);
				var content = 'Hello world';
				var key = 'test_upload_acl.txt';
				var acl = 'public-read-write';
				client.object.put({
					Bucket: bucketName,
					Key: key,
					Body: content,
					ACL: acl
				},
				function(err, data, res) {
					should.not.exist(err);
					res.should.have.status(200);
					done();
				});
			});
			it('upload a object with buffer content && get a object', function(done) {
				var client = new KS3(ak, sk, bucketName);
				var buf = new Buffer('Hello world');
				var key = 'test_upload_buffer.txt';
				client.object.put({
					Bucket: bucketName,
					Key: key,
					Body: buf
				},
				function(err, data, res) {
					client.object.get({
						Bucket:bucketName,
						Key:key
					},function(err,data,res){
						var fileName = path.join(__dirname,'assets/test_download_file.txt');
						data.should.have.length(11);
						fs.writeFileSync(fileName,data);
						done();
					});
				});
			});
			it('upload a object with file content && get a object', function(done) {
				var client = new KS3(ak, sk, bucketName);
				var fileName = 'photo.jpg';
				var filePath = path.join(__dirname,'./assets/'+fileName);
				var key = 'test_upload_'+fileName;
				var upFileStat = fs.statSync(filePath);

				client.object.put({
					Bucket: bucketName,
					Key: key,
					filePath:filePath
				},
				function(err, data, res) {
					should.not.exist(err);
					client.object.get({
						Bucket:bucketName,
						Key:key
					},function(err,data,res,originData){
						should.not.exist(err);
						var newFileName = path.join(__dirname,'assets/test_object_get_download_'+fileName);
						fs.writeFileSync(newFileName,originData);
						var downFileStat = fs.statSync(filePath);
						(downFileStat.size).should.equal(upFileStat.size);
						done();
					});
				});
			});
			it('get a not exists file', function(done) {
				var client = new KS3(ak, sk, bucketName);
				var key = 'file_no_exist.jpg';
				client.object.get({
					Bucket:bucketName,
					Key:key
				},function(err,data,res){
					should.exist(err);
					err.code.should.equal(404);
					res.statusCode.should.equal(404);
					done();
				});
			});
			it('upload a object with file content', function(done) {
				var client = new KS3(ak, sk, bucketName);
				var filePath = path.join(__dirname, './assets/test_upload_file.txt');
				var key = 'test_upload_file.txt';

				client.object.put({
					Bucket: bucketName,
					filePath: filePath,
					Key: key
				},
				function(err, data, res) {
					should.not.exist(err);
					res.should.have.status(200);
					done();
				});

			});

			it('upload a photo file', function(done) {
				var client = new KS3(ak, sk, bucketName);
				var filePath = path.join(__dirname, './assets/test_upload_photo.jpg');
				var key = 'test_upload_photo.jpg';

				client.object.put({
					ACL: 'public-read',
					filePath: filePath,
					Key: key
				},
				function(err, data, res) {
					should.not.exist(err);
					res.should.have.status(200);
					done();

				});
			});
		});
	});
	describe('upload a big size file by multitpart ', function() {
		it('initiates a multipart upload and returns an upload ID', function(done) {
			var client = new KS3(ak, sk, bucketName);
			client.config({
				dataType: 'json'
			});
			var key = 'bigFile.mov';

			client.object.multitpart_upload_init({
				Key: key
			},
			function(err, data, res) {
				should.not.exist(err);
				res.should.have.status(200);
				should.exist(data.InitiateMultipartUploadResult.UploadId);
				(data.InitiateMultipartUploadResult.UploadId).should.have.length(32);
				client.object
				done();
			});
		});
		it('uploads a part in a multipart upload', function(done) {
			var client = new KS3(ak, sk, bucketName);
			client.config({
				dataType: 'json'
			});
			var key = 'bigFile.mov';

			client.object.multitpart_upload_init({
				Key: key
			},
			function(err, data, res) {
				var uploadId = data.InitiateMultipartUploadResult.UploadId
				client.config({
					dataType: 'xml'
				});
				client.object.upload_part({
					Key: key,
					PartNumber: 1,
					body: 'API Object put test : uploads a part in a multipart upload',
					UploadId: uploadId
				},
				function(err, data, res) {
					// 这个地方比较特殊,返回的结果是放在header里的,而不是data里面
					// 而且返回的etag还是带着双引号的,形如:etag: '"d41d8cd98f00b204e9800998ecf8427e"
					should.not.exist(err);
					res.should.have.status(200);
					should.exist(res.headers.etag);
					done();
				});
			});
		});

		it('completes a multipart upload by assembling previously uploaded parts', function(done) {
			var client = new KS3(ak, sk, bucketName);
			client.config({
				dataType: 'json'
			});
			var key = 'bigFile.mov';

			client.object.multitpart_upload_init({
				Key: key
			},
			function(err, data, res) {
				if (err) throw err;
				var uploadId = data.InitiateMultipartUploadResult.UploadId;
				client.config({
					dataType: 'xml'
				});
				client.object.upload_part({
					Key: key,
					PartNumber: 1,
					body: 'API Object put test : uploads a part in a multipart upload',
					UploadId: uploadId
				},
				function(err, data, res) {
					if (err) throw err;
					var etag = res.headers.etag;

					client.object.upload_complete({
						Key: key,
						UploadId: uploadId,
						body: (function() {
							var sample = ['<CompleteMultipartUpload>', '<Part>', '<PartNumber>' + 1 + '</PartNumber>', '<ETag>' + etag + '</ETag>', '</Part>', '</CompleteMultipartUpload>'];
							return sample.join('');
						})()
					},
					function(err, data, res) {
						should.not.exist(err);
						res.should.have.status(200);
						done();
					})
				});
			});
		});

		it('aborts a multipart upload', function(done) {
			var client = new KS3(ak, sk, bucketName);
			client.config({
				dataType: 'json'
			});
			var key = 'bigFile1.mov';

			client.object.multitpart_upload_init({
				Key: key
			},
			function(err, data, res) {
				if (err) throw err;
				var uploadId = data.InitiateMultipartUploadResult.UploadId
				client.object.upload_abort({
					Key: key,
					UploadId: uploadId
				},
				function(err, data, res) {
					should.not.exist(err);
					res.should.have.status(204);
					done();
				});
			});
		});

		it('lists the parts that have been uploaded for a specific multipart upload', function(done) {
			var client = new KS3(ak, sk, bucketName);
			client.config({
				dataType: 'json'
			});
			var key = 'bigFile.mov';

			client.object.multitpart_upload_init({
				Key: key
			},
			function(err, data, res) {
				var uploadId = data.InitiateMultipartUploadResult.UploadId
				client.config({
					dataType: 'xml'
				});
				client.object.upload_part({
					Key: key,
					PartNumber: 1,
					body: 'API Object put test : uploads a part in a multipart upload',
					UploadId: uploadId
				},
				function(err, data, res) {
					if (err) throw err;
					client.object.upload_list_part({
						Key: key,
						UploadId: uploadId
					},
					function(err, data, res) {
						should.not.exist(err);
						res.should.have.status(200);
						done();
					})

				});
			});

		});
	});

	describe('all of object process', function() {
		var content = 'Hello world';
		var key = 'test_upload.txt';
		before(function() {
			client.object.put({
				Bucket: bucketName,
				Key: key,
				Body: content
			},
			function() {})
		});
		it('should be return string width get object', function(done) {
			client.config({
				dataType: 'xml'
			});
			client.object.get({
				Bucket: bucketName,
				Key: key
			},
			function(err, data, res) {
				should.not.exist(err);
				res.should.have.status(200);
				(data === content).should.be.ok;
				done();
			})
		});
		// HEAD object
		it('should be return a 200 statuscode width head object', function(done) {
			client.object.head({
				Key: key
			},
			function(err, data, res) {
				should.not.exist(err);
				res.should.have.status(200);
				done()
			})
		});
		it('should be return a 200 statuscode with put object ACL', function(done) {
			// putAcl 测试
			client.object.putAcl({
				Key: key,
				ACL: 'public-read'
			},
			function(err, data, res) {
				should.not.exist(err);
				res.should.have.status(200);
				done();
			})
		});
		it('should be return a json object with get object ACL', function(done) {
			client.config({
				dataType: 'json'
			});
			// getAcl测试
			client.object.getAcl({
				Key: key
			},
			function(err, data, res) {
				var d = data.AccessControlPolicy.AccessControlList.Grant;
				(d[0]['Permission'] === 'FULL_CONTROL' && d[1]['Permission'] === 'READ').should.be.ok;
				should.not.exist(err);
				res.should.have.status(200);
				done();
			})
		});
		it('should be return 204 statuscode with delete object', function(done) {
			// 都跑过之后 删除object
			client.object.del({
				Bucket: bucketName,
				Key: key
			},
			function(err, data, res) {
				should.not.exist(err);
				res.should.have.status(204); // 删除成功返回的是204
				done();
			})
		});
	});
	after(function() {
		client.config({
			dataType: _dataType
		});
	});
});

