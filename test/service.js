var KS3 = require('..');
var should = require('should');
require('should-http');

describe('API service', function() {
	var ak = process.env.AK || 'WRHLHOZQD3OY3VTROMGQ';
	var sk = process.env.SK || 'dWSmyMmVcpahaZphUdyVz11myMIoCAsOKeZ6wi4T';
	

	it('should get a 2XX statuscode ', function(done){
		var client = new KS3(ak, sk);
		client.service.get(function(err, data, res) {
			should.not.exist(err);
			res.should.have.status(200);
			done();
		});
	});
});

