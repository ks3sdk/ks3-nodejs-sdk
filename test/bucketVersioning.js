var KS3 = require('..');
var xml2json = require('../lib/util').xml2json;

var AK = '';
var SK = '';
var bucket = '';
var region = '';

var key = '';
var versionId1 = '';
var versionId2 = '';


var ks3 = new KS3(AK, SK, bucket, region);

// 查询bucket versioning 状态
function testGetBucketVersioning() {
  ks3.bucket.getVersioning(
    {
      Bucket: bucket,
    },
    function (err, data, res) {
      console.log('res: ', res);
      // console.log('data: ', data);
      if (err) {
        console.log(
          '获取Bucket版本控制异常---Bucket---',
          bucket,
          '###err###',
          err
        );
      } else if (!err) {
        console.log('当前Bucket,版本控制配置为：', data);
        var json = xml2json.parser(data.toString());
        console.log('XmlFormat:', JSON.stringify(json, null, 2));
      }
    }
  );
}
// 配置bucket versioning 状态
function testPutBucketVersioning() {
  var status = 'Enabled';
  ks3.bucket.putVersioning(
    {
      Bucket: bucket,
      Status: status,
    },
    function (err, data, res) {
      // console.log('res: ', res);
      if (!err && res.status == 200) {
        console.log('配置versioning成功，状态为', status);
      } else {
        console.log('配置失败', err, res);
      }
    }
  );
}

// 查询Tagging
function testGetTagging() {
  ks3.object.getTagging(
    {
      Bucket: bucket,
      Key: key,
      VersionId: versionId1,
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
      Key: key,
      VersionId: versionId1,
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
      VersionId: versionId1,
      Tagging: [
        { key: 'abcd', value: './asd' },
        { key: 'q a 2', value: 'qweqweqweq 2' },
        { key: 'q1212', value: 'qweqweqweq' },
      ],
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
  ks3.object.put(
    {
      Bucket: bucket,
      Key: key,
      Body: content,
      Tagging: [
        { key: 'abc', value: '123.2' },
        { key: 'qwe', value: '22' },
      ],
    },
    function (err, data, res) {
      console.log('err:', err);
      console.log('data:', data);
      console.log('res:', res);
      if (!err) {
        console.log('上传成功');
      }
    }
  );
}
function testPutObjectWithOutTagging() {
  var content = 'Hello world';
  var key = 'test.txt';
  // var content = '';
  // var key = 'testdir/';
  ks3.object.put(
    {
      Bucket: bucket,
      Key: key,
      Body: content,
    },
    function (err, data, res) {
      console.log('err:', err);
      console.log('data:', data);
      console.log('res:', res);
      if (!err) {
        console.log('上传成功');
      }
    }
  );
}

function testMultitPartUploadWithTagging() {
  ks3.config({
    dataType: 'json',
  });
  var key = 'bigFile.txt';

  ks3.object.multitpart_upload_init(
    {
      Key: key,
      Tagging: [
        { key: 'tag1', value: 'val1' },
        { key: 'tag2', value: 'val 2' },
      ],
    },
    function (err, data, res) {
      if (err) throw err;
      var uploadId = data.InitiateMultipartUploadResult.UploadId;
      ks3.config({
        dataType: 'xml',
      });
      ks3.object.upload_part(
        {
          Key: key,
          PartNumber: 1,
          body: 'API Object put test : uploads a part in a multipart upload',
          UploadId: uploadId,
        },
        function (err, data, res) {
          if (err) throw err;
          var etag = res.headers.etag;

          ks3.object.upload_complete(
            {
              Key: key,
              UploadId: uploadId,
              body: (function () {
                var sample = [
                  '<CompleteMultipartUpload>',
                  '<Part>',
                  '<PartNumber>' + 1 + '</PartNumber>',
                  '<ETag>' + etag + '</ETag>',
                  '</Part>',
                  '</CompleteMultipartUpload>',
                ];
                return sample.join('');
              })(),
            },
            function (err, data, res) {
              console.log('err:', err);
              console.log('data:', data);
              console.log('res:', res);
              if (!err) {
                console.log('分块上传成功');
              }
            }
          );
        }
      );
    }
  );
}

// 查询Object Tagging 数量 headobj
function testHeadObjectTaggingCount() {
  ks3.object.head(
    {
      Bucket: bucket,
      Key: key,
      VersionId: versionId2,
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
      Key: key,
      VersionId: versionId2,
    },
    function (err, data, res) {
      // console.log('res:', res);
      console.log('TaggingCount:', res.headers['x-kss-tagging-count']);
    }
  );
}

// listObjects
function listObjects() {
  ks3.bucket.get(
    {
      Bucket: bucket,
      'max-keys': 2,
      // marker: 'suiyi.jpg',
      // delimiter: '/'
    },
    function (err, data, res) {
      console.log('res:', res);
      console.log('data:', data);
      var json = xml2json.parser(data.toString());
      console.log('XmlFormat:', JSON.stringify(json, null, 2));
    }
  );
}
// listObjectsv2
function listObjectsV2() {
  ks3.bucket.getV2(
    {
      Bucket: bucket,
      'max-keys': 2,
      // 'key-marker': 'test_upload_without_tagging1.txt',
      // 'version-id-marker': 'a5HIJVyiOQFrdyKyyne/tlaO+Il0r2lHzxEjAv22NvU='
    },
    function (err, data, res) {
      console.log('res:', res);
      console.log('data:', data);
      var json = xml2json.parser(data.toString());
      console.log('XmlFormat:', JSON.stringify(json, null, 2));
    }
  );
}

function delObject() {
  ks3.object.del(
    {
      Bucket: bucket,
      Key: key,
      VersionId: versionId2,
    },
    function (err, data, res) {
      console.log('res:', res);
      console.log('data:', data);
      var json = xml2json.parser(data.toString());
      console.log('XmlFormat:', JSON.stringify(json, null, 2));
    }
  );
}

function cb(err, data, res) {
  console.log('res:', res);
  console.log('data:', data);
  var json = xml2json.parser(data.toString());
  console.log('XmlFormat:', JSON.stringify(json, null, 2));
}

function headObject() {
  ks3.object.head(
    {
      Bucket: bucket,
      Key: key,
      VersionId: versionId1,
    },
    cb
  );
}

// 测试获取bucket版本控制状态 'Off' || 'Enabled' || 'Suspended'
// testGetBucketVersioning();
// testPutBucketVersioning();
// listObjectsV2();
// listObjects();
// delObject();
// headObject();

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
