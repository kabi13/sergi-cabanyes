let chai = require('chai');
let chaiHttp = require('chai-http');
const assert = require('chai').assert;
const config = require('../config');

let version = '1.1.0';

chai.use(chaiHttp);

describe('[UTILITIES]',() => {

    it('get version', (done) => {
        chai.request(config.url)
        .get('/version')
        .end(function (err, res) {
            if (err) { assert.ifError(err); }
            assert.equal(res.statusCode,200)
            assert.equal(res.body.version, version);
            done(err);
        });
    });

    it('get health', (done) => {
        chai.request(config.url)
            .get('/healthcheck')
            .end(function (err, res) {
            if (err) { assert.ifError(err); }
            assert.equal(res.statusCode,200)
            assert.ok(res.body.uptime);
            assert.isAtLeast(res.body.documents.products, 0);
            assert.isAtLeast(res.body.documents.stores, 0);
            assert.isAtLeast(res.body.documents.categories, 0);
            done(err);
        });
    });

});
