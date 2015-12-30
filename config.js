var path = require('path');
module.exports = {
	protocol:'http',
	baseUrl:'kss.ksyun.com',
	// 所有header设置的前缀
	// ks3: kss , amazon s3: amz
	prefix:'kss',
	// 返回的数据格式,默认为xml,因为aws返回的全是xml,
	// 不过鉴于nodejs对于json的喜爱,可以在config中设置为`json`
	// ['xml','json']
	dataType: 'xml',
	// 默认返回的是这个格式
	// 非必要,不传递也不会报错
	//contentType:'application/xml',
	contentType:'',
	// 设置通过`user-agent`头信息
	ua:'KS3_NodeJS',
	// 简单文件上传的最大限制
	uploadMaxSize : 5*1024*1024*1024,
	// 分块上传的最小单位
	chunkSize:5*1024*1024,
	// 分块上传重试次数
	retries:20,
	// 上传文件信息缓存地址
	cachePath:path.join(__dirname,'./cache/files/'),
	// 
	region:''
}
