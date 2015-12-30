var KS3 = require('..');
var should = require('should');
require('should-http');
var path = require('path');
var fs = require('fs');

var ak = process.env.AK || 'WRHLHOZQD3OY3VTROMGQ';
var sk = process.env.SK || 'dWSmyMmVcpahaZphUdyVz11myMIoCAsOKeZ6wi4T';
var bucketName = process.env.BUCKET || 'ks3-sdk-test';
var bigFile = process.env.BIGFILE || path.join(__dirname, './assets/风之万里,黎明之空.txt');
var updir = process.env.UPDIR || path.join(__dirname, './assets/updir/');



describe('upload a file', function() {
	it('upload a object with file content', function(done) {
		var client = new KS3(ak, sk, bucketName);
		var filePath = bigFile;
		var fileName = (function(){
			var s = filePath.split('/');
			return s[s.length-1];
		})();
		var key = 'test_upload_file_from_upload_'+fileName;

		client.upload.start({
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

	it('upload a file and set content-type', function(done) {
		var client = new KS3(ak, sk, bucketName);
		var filePath = path.join(__dirname, './assets/test_content_type.html');
		var fileName = (function(){
			var s = filePath.split('/');
			return s[s.length-1];
		})();
		var key = 'test_upload_file_from_upload_and_set_content_type_'+fileName;

		client.upload.start({
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
});



describe('upload a directory', function() {
	it('upload a directory without subdirectory', function(done) {
		var client = new KS3(ak, sk, bucketName);
		var filePath = updir;
		
		var key = 'test_upload_directory_without_subdir';

		client.upload.start({
			Bucket: bucketName,
			filePath: filePath,
			Key: key,
			fileSetting:{
				isDeep:false,
				ignore:/(.(swp|ds_store)$)/ig
			}
		},
		function(err, data, res) {
			should.not.exist(err);
			res.should.have.status(200);
			done();
		});
	});

	it('upload a directory with subdirectory', function(done) {
		var client = new KS3(ak, sk, bucketName);
		var filePath = updir;
		
		var key = 'test_upload_directory_with_subdir';

		client.upload.start({
			Bucket: bucketName,
			filePath: filePath,
			Key: key,
			fileSetting:{
				isDeep:true,
				ignore:/(.(swp|ds_store)$)/ig
			}
		},
		function(err, data, res) {
			should.not.exist(err);
			res.should.have.status(200);
			done();
		});
	});
});

