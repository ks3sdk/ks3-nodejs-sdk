var KS3 = require('..');
var xml2json = require('../lib/util').xml2json;

var AK = '';
var SK = '';
var bucket = '';
var region = '';
var key = '';

var ks3 = new KS3(AK, SK, bucket, region);

// 查询Tagging
function testGetTagging() {
  ks3.object.getTagging(
    {
      Bucket: bucket,
      Key: key
      
    },
    function (err, data, res) {
      console.log('res:', res);
      if (err && err.code == 404) {
        console.log('当前Object，无Tagging');
      } else if (!err) {
        console.log('当前Object，Tagging配置为：', data);
        var json = xml2json.parser(
          data.toString().replace(/\s\w+\:\w+=\"\S+\"/g, '')
        );
        console.log('TaggingFormat:', JSON.stringify(json, null, 4));
      }
    }
  );
}
function testDeleteTagging() {
  ks3.object.delTagging(
    {
      Bucket: bucket,
      Key: key
    },
    function (err, data, res) {
      console.log('err:', err);
      console.log('data:', data);
      console.log('res:', res);
    }
  );
}
function testPutTagging() {
  ks3.object.putTagging(
    {
      Bucket: bucket,
      Key: key,
      Tagging: [
        {key: 'abcd', value: './asd'},
        {key: 'q a 2', value: 'qweqweqweq 2'}
      ]
    },
    function (err, data, res) {
      console.log('err:', err);
      console.log('data:', data);
      console.log('res:', res);
      if (!err) {
        console.log('配置成功');
      }
    }
  );
}

function testPutObjectWithTagging() {
  var content = 'Hello world';
  var key = 'test_upload_with_tagging.txt';
  ks3.object.put({
    Bucket: bucket,
    Key: key,
    Body: content,
    Tagging: [{key: 'abc', value: '123.2'}, {key: 'qwe', value: '22'}]
  },
  function(err, data, res) {
    console.log('err:', err);
    console.log('data:', data);
    console.log('res:', res);
    if (!err) {
      console.log('上传成功');
    }
  });
}
function testPutObjectWithOutTagging() {
  var content = 'Hello world';
  var key = 'test_upload_without_tagging.txt';
  ks3.object.put({
    Bucket: bucket,
    Key: key,
    Body: content
  },
  function(err, data, res) {
    console.log('err:', err);
    console.log('data:', data);
    console.log('res:', res);
    if (!err) {
      console.log('上传成功');
    }
  });
}

function testMultitPartUploadWithTagging() {
  ks3.config({
    dataType: 'json'
  });
  var key = 'bigFile.txt';

  ks3.object.multitpart_upload_init({
    Key: key,
    Tagging: [{key: 'tag1', value: 'val1'}, {key: 'tag2', value: 'val 2'}]
  },
  function(err, data, res) {
    if (err) throw err;
    var uploadId = data.InitiateMultipartUploadResult.UploadId;
    ks3.config({
      dataType: 'xml'
    });
    ks3.object.upload_part({
      Key: key,
      PartNumber: 1,
      body: 'API Object put test : uploads a part in a multipart upload',
      UploadId: uploadId
    },
    function(err, data, res) {
      if (err) throw err;
      var etag = res.headers.etag;

      ks3.object.upload_complete({
        Key: key,
        UploadId: uploadId,
        body: (function() {
          var sample = ['<CompleteMultipartUpload>', '<Part>', '<PartNumber>' + 1 + '</PartNumber>', '<ETag>' + etag + '</ETag>', '</Part>', '</CompleteMultipartUpload>'];
          return sample.join('');
        })()
      },
      function(err, data, res) {
        console.log('err:', err);
        console.log('data:', data);
        console.log('res:', res);
        if (!err) {
          console.log('分块上传成功');
        }
      })
    });
  });
}

// 查询Object Tagging 数量 headobj
function testHeadObjectTaggingCount() {
  ks3.object.head(
    {
      Bucket: bucket,
      Key: key
      
    },
    function (err, data, res) {
      // console.log('res:', res);
      console.log('TaggingCount:', res.headers['x-kss-tagging-count']);
    }
  );
}

// 查询Object Tagging 数量 getobj
function testGetObjectTaggingCount() {
  ks3.object.get(
    {
      Bucket: bucket,
      Key: key
      
    },
    function (err, data, res) {
      // console.log('res:', res);
      console.log('TaggingCount:', res.headers['x-kss-tagging-count']);
    }
  );
}

// 测试添加Tag
// testPutTagging();
// 测试获取Tag
// testGetTagging();
// 测试删除Tag
// testDeleteTagging();
// 测试put上传文件，携带Tag
// testPutObjectWithTagging();
// 测试put上传文件，不携带Tag
// testPutObjectWithOutTagging();
// 测试分块上传，携带Tag
// testMultitPartUploadWithTagging();
// 测试已配置Tagging Object tag数量
// testHeadObjectTaggingCount();
// testGetObjectTaggingCount();
