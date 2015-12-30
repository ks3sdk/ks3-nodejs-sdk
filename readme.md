# KS3-SDK-Nodejs

本代码库为`金山云存储KS3`服务.主要提供`KS3 nodejs SDK`和`命令行工具`.

[![Build Status](https://api.travis-ci.org/StoneRen/ks3-node-sdk.svg)](https://travis-ci.org/StoneRen/ks3-node-sdk)

## Nodejs-sdk

### 安装

```
npm install ks3
```

### 测试

请先安装 `mocha`

```
npm install -g mocha
```

然后进行测试

```
// 全部测试
mocha

// 指定自己ak,sk和bucket做测试
AK=$ak SK=$sk BUCKET=$bucket mocha

// 大文件(大于5M)上传测试
BIGFILE=$path mocha test/upload.js

// 文件夹上传测试
UPDIR=$path mocha test/upload.js
```

### 使用


```
var KS3 = require('ks3');
var client = new KS3(AK,SK);
```

### api

以下调用详细信息,可以访问[官方文档](http://ks3.ksyun.com/doc/api/index.html)

`ks3.service.get` : 可以通过该操作来列出客户所有的 Bucket 信息   

`ks3.bucket.put` : 创建一个新的Bucket   
`ks3.bucket.del` : 删除指定Bucket     
`ks3.bucket.get` : 枚举Bucket内的Object   
`ks3.bucket.head` : 获取bucket元数据     
`ks3.bucket.getACL` : 获取Bucket ACL   
`ks3.bucket.putACL` : 设置Bucket的acl  
`ks3.bucket.getLogging` : 获得Bucket的日志信息   
`ks3.bucket.putLogging` : 设置Bucket的日志信息   

`ks3.object.del` : 删除指定Object  
`ks3.object.get` : 下载该Object数据    
`ks3.object.put` : 上传Object数据  
`ks3.object.getAcl` : 获得Bucket的acl  
`ks3.object.putAcl` : 上传object的acl  
`ks3.object.headObject` : 获取指定Object元数据  
`ks3.object.multitpart_upload_init` : 调用这个接口会初始化一个分块上传并且返回一个upload id, upload id 用来标识属于当前object的具体的块，并且用来标识完成分块上传或者取消分块上传  
`ks3.object.upload_part` : 初始化分块上传后，上传分块接口  
`ks3.object.upload_complete` : 组装之前上传的块，然后完成分块上传。通过你提供的xml文件，进行分块组装。在xml文件中，块号必须使用升序排列。必须提供每个块的ETag值  
`ks3.object.upload_abort` : 取消分块上传  
`ks3.object.upload_list_part` : 罗列出已经上传的块  
`ks3.upload.start` : 文件(文件夹)上传
 




## KS3 
  
关于命令行工具,文档请查看 `./bin/readme.md`,或者[查看这里](https://github.com/StoneRen/ks3-node-sdk/tree/master/bin#user-content-ks3-命令行文档)

功能包括上传文件和文件夹.上传过程中会根据文件大小进行简单上传和分块上传

如果大文件在上传过程中发生意外,限次上传文件的时候会从上次断开的地方续传.