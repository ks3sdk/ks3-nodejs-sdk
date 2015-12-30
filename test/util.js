var util = require('../lib/util');
var should = require('should');

describe('util verifyAcl()', function() {
    it('should return acl name or false', function() {
        util.verifyAcl('private').should.equal('private');
        util.verifyAcl('public-read').should.equal('public-read');
        util.verifyAcl('public-read-write').should.equal('public-read-write');
        util.verifyAcl('authenticated-read').should.equal('authenticated-read');
        util.verifyAcl('bucket-owner-read').should.equal('bucket-owner-read');
        util.verifyAcl('bucket-owner-full-control').should.equal('bucket-owner-full-control');
        (util.verifyAcl('testacl') === null).should.be.ok;


    });
    it('should return a lowercase acl', function() {
        util.verifyAcl('Private').should.equal('private');
        util.verifyAcl('public-READ').should.equal('public-read');
        util.verifyAcl('public-read-Write').should.equal('public-read-write');
        util.verifyAcl('authenticated-READ').should.equal('authenticated-read');
        util.verifyAcl('bucket-OWNER-read').should.equal('bucket-owner-read');
        util.verifyAcl('bucket-owner-FULL-control').should.equal('bucket-owner-full-control');


    });
});
describe('util verifyBucket()', function() {
    it('should be between 3 to 63 character', function() {
        (util.verifyBucket('test001') === true).should.be.ok;
        (util.verifyBucket('te') === false).should.be.ok;
        (util.verifyBucket('testbuckettestbuckettestbuckettestbuckettestbuckettestbuckettest') === false).should.be.ok;
    });
    it('should be start with number or letter', function() {
        (util.verifyBucket('test001') === true).should.be.ok;
        (util.verifyBucket('8test001') === true).should.be.ok;
        (util.verifyBucket('-test001') === false).should.be.ok;
    });
    it('should be end with number or letter', function() {
        (util.verifyBucket('test001') === true).should.be.ok;
        (util.verifyBucket('100test') === true).should.be.ok;
        (util.verifyBucket('test001-') === false).should.be.ok;
    });
    it('should be lowercase', function() {
        (util.verifyBucket('test') === true).should.be.ok;
        (util.verifyBucket('teSt') === false).should.be.ok;
    });
    it('only contain specail character("." or "-")', function() {
        (util.verifyBucket('test-sdk') === true).should.be.ok;
        (util.verifyBucket('test.sdk') === true).should.be.ok;
        (util.verifyBucket('test_sdk') === false).should.be.ok;
        (util.verifyBucket('test+sdk') === false).should.be.ok;
    });

});
describe('util encodeKey()', function() {
    it('should be return true, compare after encode result', function() {
        (util.encodeKey('abc/中/') === 'abc/%E4%B8%AD/').should.be.ok;
    })
})
