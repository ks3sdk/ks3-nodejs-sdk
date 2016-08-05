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
var debug = require('debug')('test-upload');


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
			done(); //对于回调链来说done实际上意味着告诉mocha从此处开始测试，一层层回调回去。
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

describe('test multipart upload', function() {
	var tmpFilePath = path.join(__dirname, './assets/bigFileOver100M.tmp')
	before(function() {
		/**
		 * 创建一个大于100M的文件
		 */
		var mock_data = '金山云CDN服务将用户内容分发到全球700余个边缘节点，提高用户访问网站的响应速度与网站的可用性，通过智能监控实时调度异常节点资源，保证全局性能和可用性, 控制台可以帮助用户完成新增CDN加速域名、刷新/预加载缓存目录、URL等配置任务，并提供数据分析等统计图表。本文档主要介绍CDN控制台操作手册。';
		mock_data = new Buffer(new Array(20).join(mock_data));
		var unit_size = mock_data.length;
		var total = 101* 1024* 1024; //101 MB
		var sumSize = 0;
		while(sumSize < total) {
			fs.appendFileSync(tmpFilePath, mock_data);
			sumSize += unit_size;
			debug('sumSize: ' + sumSize);
		}
	});
	it('upload a big file by multipart upload', function(done) {
		this.timeout(900000);
		var client = new KS3(ak, sk, bucketName,'HANGZHOU');
		var key = 'multipartUpload/bigFile.tmp';
		client.upload.start({
				Bucket: bucketName,
				filePath: tmpFilePath,
				Key: key
			},
			function(err, data, res) {
				should.not.exist(err);
				res.should.have.status(200);
				done();
			});
	});
	after(function() {
		//删除临时文件
		fs.unlinkSync(tmpFilePath);
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
			},
			ACL:'public-read'
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

