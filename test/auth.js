var auth = require('../lib/auth');
var should = require('should');

var ak = process.env.AK || 'WRHLHOZQD3OY3VTROMGQ';
var sk = process.env.SK || 'dWSmyMmVcpahaZphUdyVz11myMIoCAsOKeZ6wi4T';

describe('AUTH generateHeaders', function() {
	it('return a empty string if we havent passed param', function() {
		auth.generateHeaders().should.equal('');
	});
	it('should only handler spectical header', function() {
		var config = require('./../config');
		var prefix = config.prefix;
		var headers = {
			'x-amz-test1': 'test1',
			'x-amz-test2': 'test2',
			'x-amz-test0': 'test0',
			'x-amz-zest0': 'test0',
			'x-kss-test1': 'test1',
			'x-kss-test0': 'test0',
			'amz-test0': 'test0'
		};

		config.prefix = 'fake';
		var fakeHeader = auth.generateHeaders(headers);
		fakeHeader.should.equal('');
		config.prefix = 'amz';
		var kssHeader = auth.generateHeaders(headers);
		kssHeader.should.equal('x-amz-test0:test0\nx-amz-test1:test1\nx-amz-test2:test2\nx-amz-zest0:test0');
		config.prefix = 'kss';
		var kssHeader = auth.generateHeaders(headers);
		kssHeader.should.equal('x-kss-test0:test0\nx-kss-test1:test1');
		config.prefix = prefix;
	});
});

describe('AUTH generateToken', function() {
	it('should generate a legal token', function() {
		var body = '';
		var reqSimple = {
			method: 'GET',
			date: 'Fri, 17 Oct 2014 10:08:22 GMT',
			uri: 'http://kss.ksyun.com',
			resource: '/'
		};
		var tokenSimple = auth.generateToken(sk, reqSimple, body);
		tokenSimple.should.equal('2lxTJjvP1ndsKASapBxLeIUzhkQ=');

		var reqWithHeader = {
			method: 'PUT',
			date: 'Fri, 17 Oct 2014 10:00:18 GMT',
			uri: 'http://guoliang11.kss.ksyun.com/?acl',
			resource: '/guoliang11/?acl',
			headers: {
				attr_Acl: 'public-read-write'
			}
		};
		var tokenWithHeader = auth.generateToken(sk, reqWithHeader, body);
		tokenWithHeader.should.equal('+V7+A8ib9uLqix87F8BRfTbcHSg=');

	})
});

