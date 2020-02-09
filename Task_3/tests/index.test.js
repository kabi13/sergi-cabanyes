let chai = require('chai');
let chaiHttp = require('chai-http');
const assert = require('chai').assert;
const config = require('../config');

chai.use(chaiHttp);

describe('[INDEX]',() => {

    it('shows index page',  (done) => {
        chai.request(config.url)
        .get('/')
        .end(function(err,res){
            assert.equal(res.statusCode,200);
            assert.ok(res.text.indexOf('<title>') !== -1);
            done(err);
        });
    });

    it('shows 404 HTML page', (done) => {
        chai.request(config.url)
        .get('/nothing')
        .set('Accept', 'text/html')
        .end(function(err,res){
            assert.equal(res.statusCode,404);
            assert.ok(res.text.indexOf('<html>') !== -1);
            done(err);
        });
    });

    it('shows a 404 JSON error', function (done) {
        chai.request(config.url)
        .get('/nothing')
        .end(function (err, res) {
            assert.equal(res.statusCode, 404);
            assert.equal(res.body.message, 'Page not found');
            assert.equal(res.body.name, 'NotFound');
            done(err);
        });
    });

});