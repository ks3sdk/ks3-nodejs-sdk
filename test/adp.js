/* 测试异步数据处理相关操作 */
var KS3 = require('..');
var should = require('should');
require('should-http');
var path = require('path');
var fs = require('fs');
var urllib = require('urllib');
var config = require('../config');
var xml2json = require("../lib/util").xml2json;
var debug = require('debug')('adptest');

var ak = process.env.AK || 'WRHLHOZQD3OY3VTROMGQ';
var sk = process.env.SK || 'dWSmyMmVcpahaZphUdyVz11myMIoCAsOKeZ6wi4T';
var bucketName = process.env.BUCKET || 'ks3-sdk-test';

describe('Asynchronous Data Processing', function () {
    var client = new KS3(ak, sk, bucketName);

    describe('Upload Trigger Processing', function () {
        it('avscrnshot: put a video and trigger a screen shot', function (done) {
            this.timeout(30000);
            var key = 'a.mp4';
            var resultKey = 'screenshot_a.png';
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

                    //下载视频截图图片到assets目录
                    setTimeout(getAdpResult, 2000);

                    function getAdpResult() {
                        client.object.get({
                            Bucket: bucketName,
                            Key: resultKey
                        }, function (err, data, res, originData) {
                            should.not.exist(err);
                            var newFileName = path.join(__dirname, 'assets/' + resultKey);
                            fs.writeFileSync(newFileName, originData);
                            done();
                        });
                    }
                },
                {
                    'kss-async-process': 'tag=avscrnshot&ss=1&res=640x360&&rotate=90|tag=saveas&bucket=' + bucketName + '&object=' + new Buffer(resultKey).toString('base64'),
                    'kss-notifyurl': 'http://10.4.2.38:19090/'
                });
        });

        it('avop : encode a video to flv format', function (done) {

            //设置超时时间
            this.timeout(30000);

            var key = 'a.mp4';
            var resultVideoName =  key.split('.')[0] + '1.flv';

            client.object.put({
                    Bucket: bucketName,
                    Key: key,
                    subResource:'adp',
                    isNoContent: true
                },
                function (err, data, res) {
                    should.not.exist(err);
                    res.should.have.status(200);

                    //通过HEAD请求验证转码后的flv文件是否存在
                    setTimeout(headAdpResult, 6000);

                    function headAdpResult() {
                        client.object.head({
                                Key: resultVideoName
                            },
                            function(err, data, res) {
                                should.not.exist(err);
                                res.should.have.status(200);
                                done();
                            }
                        );
                    }
                },
                {
                    'kss-async-process': 'tag=avop&f=flv&res=x480&as=1&vbr=128k|tag=saveas&bucket=' + bucketName + '&object=' + new Buffer(resultVideoName).toString('base64'),
                    'kss-notifyurl': 'http://10.4.2.38:19090/'
                });
        });
    });


    ////视频切片
    it('avm3u8 : convert a video to HTTP Live Streaming format', function (done) {
        var client = new KS3(ak, sk, bucketName,'HANGZHOU');
        var key = 'a.mp4';
        var resultVideoName = 'video/a.m3u8';
        this.timeout(30000);
        client.object.put({
                Bucket: bucketName,
                Key: key,
                subResource:'adp',
                isNoContent: true
            },
            function (err, data, res) {
                should.not.exist(err);
                res.should.have.status(200);

                var taskid = res.headers.taskid;

                //等8s转换时间
                setTimeout(getAVInfo, 8000);

                //通过queryadp获取生成的文件的元数据验证处理是否成功
                function getAVInfo() {
                    var uri = config.protocol + '://' + config.baseUrl + '/' + taskid + '?queryadp&tag=avinfo';
                    var headers = {
                      'User-Agent': config.ua
                    };
                    var data = {
                        headers: headers,
                        method: 'GET',
                        timeout: 1000 * 60 * 60
                    }
                    urllib.request(uri, data, function(err, result, res) {
                        should.not.exist(err);
                        res.should.have.status(200);
                        var data = '';
                        if ( !!result) {
                            var dataStr = result.toString();
                            data = dataStr;
                            dataStr = dataStr.replace(/\s\w+\:\w+=\"\S+\"/g, '');
                            var json = xml2json.parser(dataStr,'notifystatus,notifydesc', 'html');
                            data = json;
                            debug('res:' + JSON.stringify(data));
                            data.indexOf('task is process success').should.greaterThan(-1);
                            data.indexOf('&lt;![CDATA[success]]&gt;').should.greaterThan(-1);
                            done();
                        }
                    });
                }

            },
            {
                'kss-async-process': 'tag=avm3u8&segtime=2|tag=saveas&bucket=' + bucketName + '&object=' + new Buffer(resultVideoName).toString('base64'),
                'kss-notifyurl': 'http://10.4.2.38:19090/'
            });
    });

    after(function () {

    });

});
