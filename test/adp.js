/* 测试异步数据处理相关操作 */
var KS3 = require('..');
var should = require('should');
require('should-http');
var path = require('path');
var fs = require('fs');

var ak = process.env.AK || 'WRHLHOZQD3OY3VTROMGQ';
var sk = process.env.SK || 'dWSmyMmVcpahaZphUdyVz11myMIoCAsOKeZ6wi4T';
var bucketName = process.env.BUCKET || 'ks3-sdk-test';

describe('Asynchronous Data Processing', function () {
    var client = new KS3(ak, sk, bucketName);
    beforeEach(function () {
        client.bucket.put(function (err, data, res) {
        });
    });

    describe('Upload Trigger Processing', function () {
        it('put a image and trigger a addition of watermark', function (done) {
            var key = 'test_upload_photo.jpg';
            var filePath = path.join(__dirname, './assets/' + key);

            client.object.put({
                    Bucket: bucketName,
                    Key: key,
                    filePath: filePath
                },
                function (err, data, res) {
                    should.not.exist(err);
                    res.should.have.status(200);
                    //console.log(JSON.stringify(res));

                    //下载加过水印的图片到assets目录
                    setTimeout(getAdpResult, 2000);

                    function getAdpResult() {
                        client.object.get({
                            Bucket: bucketName,
                            Key: 'watermarked_' + key
                        }, function (err, data, res, originData) {
                            should.not.exist(err);
                            var newFileName = path.join(__dirname, 'assets/watermarked_' + key);
                            fs.writeFileSync(newFileName, originData);
                            done();
                        });
                    }
                },
                {
                    'kss-async-process': 'tag=imgWaterMark&type=2&dissolve=65&gravity=NorthEast&text=6YeR5bGx5LqR&font=5b6u6L2v6ZuF6buR&fill=I2JmMTcxNw==&fontsize=500&dy=10&dx=20|tag=saveas&bucket=' + bucketName + '&object=watermarked_' + key,
                    'kss-notifyurl': 'http://10.4.2.38:19090/'
                });
        });
    });
});

