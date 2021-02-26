var KS3 = require('..');
var xml2json = require('../lib/util').xml2json;

var AK = '';
var SK = '';
var bucket = '';
var region = '';
var targetBucket = ''; // 跨区域复制规则目标桶，不能与原桶在同一region

var ks3 = new KS3(AK, SK, bucket, region);
// 查询crr规则
function testGetCrr() {
  ks3.bucket.getCrr(
    {
      bucket,
    },
    function (err, data, res) {
      console.log('res:', res);
      if (err && err.code == 404) {
        console.log('当前bucket，无跨区域复制规则');
      } else if (!err) {
        console.log('当前bucket，已配置跨区域复制规则', data);
        var json = xml2json.parser(
          data.toString().replace(/ns2:/g, '').replace(/:ns2/g, ''),
          'Replication,xmlns'
        );
        console.log('crrConfig:', json);
      }
    }
  );
}
function testDeleteCrr() {
  ks3.bucket.delCrr(
    {
      bucket,
    },
    function (err, data, res) {
      console.log('err:', err);
      console.log('data:', data);
      console.log('res:', res);
    }
  );
}
function testPutCrr() {
  ks3.bucket.putCrr(
    {
      bucket,
      targetBucket,
      prefixs: ['123', 'qwe/we'],
      syncDelete: 'Disabled',
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

// 测试添加跨区域复制规则
// testPutCrr();
// 测试获取跨区域复制规则
// testGetCrr();
// 测试删除跨区域复制规则
// testDeleteCrr();
