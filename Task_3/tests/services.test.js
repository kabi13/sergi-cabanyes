let chai = require('chai');
let chaiHttp = require('chai-http');
const assert = require('chai').assert;
const expect = require('chai').expect;
const config = require('../config');
const randomstring = require("randomstring");

let testServiceId = 0;

chai.use(chaiHttp);

describe('[SERVICES]',() => {

    before( (done) => {
        chai.request(config.url)
            .post('/services')
            .send(testService)
            .end( (err,res) => {
                testServiceId = res.body.id;
                done(err);
            });
    });

    after( (done) => {
        chai.request(config.url)
            .delete(`/services/${testServiceId}`)
            .end( (err,res) => {
                assert.equal(res.statusCode,200);
                done(err);
            });
    });

    describe('GET:', () => {

        it('get default list of services', (done) => {
            chai.request(config.url)
                .get('/services')
                .end( (err,res) => {
                    assert.equal(res.statusCode,200);
                    assert.equal(res.body.limit, 10);
                    assert.equal(res.body.skip, 0);
                    assert.isArray(res.body.data);
                    assert.isAtMost(res.body.data.length, 10);
                    done(err);
                });
        });

        it('get list of services limit 17', (done) => {
            chai.request(config.url)
                .get('/services?$limit=17')
                .end( (err,res) => {
                    assert.equal(res.statusCode,200);
                    assert.equal(res.body.limit, 17);
                    assert.equal(res.body.skip, 0);
                    assert.isAtMost(res.body.data.length, 17);
                    done(err);
                });
        });

        it('get list of services max limit 25', (done) => {
            chai.request(config.url)
                .get('/services?$limit=53')
                .end( (err,res) => {
                    assert.equal(res.statusCode,200);
                    assert.equal(res.body.limit, 25);
                    assert.equal(res.body.skip, 0);
                    assert.isAtMost(res.body.data.length, 25);
                    done(err);
                });
        });

        it('get list of services skipping first 25', (done) => {
            chai.request(config.url)
                .get('/services?$limit=25&$skip=25')
                .end( (err,res) => {
                    assert.equal(res.statusCode,200);
                    assert.equal(res.body.limit, 25);
                    assert.equal(res.body.skip, 25);
                    assert.isAtMost(res.body.data.length, 25);
                    done(err);
                });
        });

        it('get list of services filtering by name', (done) => {
            chai.request(config.url)
                .get(`/services?name=${testService.name}`)
                .end( (err,res) => {
                    assert.equal(res.statusCode,200);
                    assert.isAtLeast(res.body.data.length, 1);
                    assert.equal(res.body.data[0].name,testService.name);
                    done(err);
                });
        });

        it('get list of services filtering by partial store name', (done) => {
            chai.request(config.url)
                .get(`/services?name[$like]=*Kabi*`)
                .end( (err,res) => {
                    assert.equal(res.statusCode,200);
                    assert.isAtLeast(res.body.data.length, 1);
                    res.body.data.forEach(service => {
                        assert.ok(service.name.toLowerCase().includes('kabi'))
                    });
                    done(err);
                });
        });

        it('get list of services only with name and id', (done) => {
            chai.request(config.url)
                .get(`/services?$select[]=name&$select[]=id`)
                .end( (err,res) => {
                    assert.equal(res.statusCode,200);
                    res.body.data.forEach(service => {
                        assert.equal(Object.keys(service).length, 2);
                        assert.hasAllKeys(service, ['name','id']);
                    });
                    done(err);
                });
        });

        it('get service by id', (done) => {
            chai.request(config.url)
                .get(`/services/${testServiceId}`)
                .end( (err,res) => {
                    assert.equal(res.statusCode,200);
                    assert.equal(res.body.id,testServiceId);
                    done(err);
                });
        });

        it('get service with wrong id', (done) => {
            chai.request(config.url)
                .get(`/services/${-1}`)
                .end( (err,res) => {
                    assert.equal(res.statusCode,404);
                    assert.equal(res.body.message,`No record found for id \'${-1}\'`);
                    done(err);
                });
        });

        it('get service selecting only the name', (done) => {
            chai.request(config.url)
                .get(`/services/${testServiceId}?$select[]=name`)
                .end( (err,res) => {
                    assert.equal(res.statusCode,200);
                    assert.equal(Object.keys(res.body).length,2);
                    assert.equal(res.body.name,testService.name);
                    assert.equal(res.body.id,testServiceId);
                    done(err);
                });
        });

    });

    describe('POST:', () => {

        it('create empty service', (done) => {
            const newService = {};
            chai.request(config.url)
                .post('/services')
                .send(newService)
                .end( (err,res) => {
                    assert.equal(res.statusCode,400);
                    let expectedErrors = [
                        "should have required property 'name'"
                    ];
                    expect(res.body.errors).to.have.members(expectedErrors);
                    done(err);
                });
        });

        it('create service with unrecognized properties', (done) => {
            const newService = {
                "nothing":"null",
                "name": "Botigueta"
            };
            chai.request(config.url)
                .post('/services')
                .send(newService)
                .end( (err,res) => {
                    assert.equal(res.statusCode,400);
                    let expectedErrors = [
                        "should NOT have additional properties: 'nothing'"
                    ];
                    expect(res.body.errors).to.have.members(expectedErrors);
                    done(err);
                });
        });

        it('validate type of parameters when creating service', (done) => {
            const newService = {
                "name":-1
            };
            chai.request(config.url)
                .post('/services')
                .send(newService)
                .end( (err,res) => {
                    assert.equal(res.statusCode, 400);
                    let expectedErrors = [
                        "'name' should be string"
                    ];
                    expect(res.body.errors).to.have.members(expectedErrors);
                    done(err);
                });
        });

        it('validate min length for string parameters when creating service', (done) => {
            const newService = {
                "name":""
            };
            chai.request(config.url)
                .post('/services')
                .send(newService)
                .end( (err,res) => {
                    assert.equal(res.statusCode, 400);
                    let expectedErrors = [
                        "'name' should NOT be shorter than 1 characters"
                    ];
                    expect(res.body.errors).to.have.members(expectedErrors);
                    done(err);
                });
        });

        it('validate max length for string parameters when creating service', (done) => {
            const newService = {
                "name": `${randomstring.generate(101)}`
            };
            chai.request(config.url)
                .post('/services')
                .send(newService)
                .end( (err,res) => {
                    assert.equal(res.statusCode, 400);
                    let expectedErrors = [
                        "'name' should NOT be longer than 100 characters"
                    ];
                    expect(res.body.errors).to.have.members(expectedErrors);
                    done(err);
                });
        });

        it('create service with required fields', (done) => {
            const newService = {
                "name": "Olot Services"
            };
            let newServiceId = 0;
            chai.request(config.url)
                .post('/services')
                .send(newService)
                .end( (err,res) => {
                    assert.equal(res.statusCode,201);
                    newServiceId = res.body.id;
                    expect(res.body).to.deep.include(newService);
                    chai.request(config.url)
                        .delete(`/stores/${newServiceId}`)
                        .end();
                    done(err);
                });
        });

    });

    describe('PUT:', () => {

        it('update empty service', (done) => {
            const newService = {};
            chai.request(config.url)
                .put(`/services/${testServiceId}`)
                .send(newService)
                .end( (err,res) => {
                    assert.equal(res.statusCode,400);
                    let expectedErrors = [
                        "should have required property 'name'"
                    ];
                    expect(res.body.errors).to.have.members(expectedErrors);
                    done(err);
                });
        });

        it('cannot update service with new id', (done) => {
            const newService = {
                "id": -1,
                "name": "Olot Services"
            };
            chai.request(config.url)
                .put(`/services/${testServiceId}`)
                .send(newService)
                .end( (err,res) => {
                    assert.equal(res.statusCode,400);
                    let expectedErrors = [
                        "should NOT have additional properties: 'id'"
                    ];
                    expect(res.body.errors).to.have.members(expectedErrors);
                    done(err);
                });
        });

        it('update service with unrecognized properties', (done) => {
            const newService = {
                "nothing":"null",
                "name": "Botigueta"
            };
            chai.request(config.url)
                .put(`/services/${testServiceId}`)
                .send(newService)
                .end( (err,res) => {
                    assert.equal(res.statusCode,400);
                    let expectedErrors = [
                        "should NOT have additional properties: 'nothing'"
                    ];
                    expect(res.body.errors).to.have.members(expectedErrors);
                    done(err);
                });
        });

        it('validate type of parameters when updating service', (done) => {
            const newService = {
                "name":-1
            };
            chai.request(config.url)
                .put(`/services/${testServiceId}`)
                .send(newService)
                .end( (err,res) => {
                    assert.equal(res.statusCode, 400);
                    let expectedErrors = [
                        "'name' should be string"
                    ];
                    expect(res.body.errors).to.have.members(expectedErrors);
                    done(err);
                });
        });

        it('validate min length for string parameters when updating service', (done) => {
            const newService = {
                "name":""
            };
            chai.request(config.url)
                .put(`/services/${testServiceId}`)
                .send(newService)
                .end( (err,res) => {
                    assert.equal(res.statusCode, 400);
                    let expectedErrors = [
                        "'name' should NOT be shorter than 1 characters"
                    ];
                    expect(res.body.errors).to.have.members(expectedErrors);
                    done(err);
                });
        });

        it('validate max length for string parameters when updating service', (done) => {
            const newService = {
                "name": `${randomstring.generate(101)}`
            };
            chai.request(config.url)
                .put(`/services/${testServiceId}`)
                .send(newService)
                .end( (err,res) => {
                    assert.equal(res.statusCode, 400);
                    let expectedErrors = [
                        "'name' should NOT be longer than 100 characters"
                    ];
                    expect(res.body.errors).to.have.members(expectedErrors);
                    done(err);
                });
        });

        it('update service with required fields', (done) => {
            const newService = {
                "name": "Olot Services"
            };
            let newServiceId = 0;
            chai.request(config.url)
                .put(`/services/${testServiceId}`)
                .send(newService)
                .end( (err,res) => {
                    assert.equal(res.statusCode,200);
                    newServiceId = res.body.id;
                    expect(res.body).to.deep.include(newService);
                    chai.request(config.url)
                        .put(`/services/${newServiceId}`)
                        .send(testService)
                        .end( (err) => {
                            done(err);
                        });
                });
        });

    });

    describe('PATCH:', () => {

        it('patch service without properties changes', (done) => {
            const newService = {};
            chai.request(config.url)
                .patch(`/services/${testServiceId}`)
                .send(newService)
                .end( (err,res) => {
                    assert.equal(res.statusCode,200);
                    expect(res.body).to.deep.include(testService);
                    done(err);
                });
        });

        it('cannot patch service with new id', (done) => {
            const newService = {
                "id": -1
            };
            chai.request(config.url)
                .patch(`/services/${testServiceId}`)
                .send(newService)
                .end( (err,res) => {
                    assert.equal(res.statusCode,400);
                    assert.equal(res.body.id, testServiceId);
                    done(err);
                });
        });

        it('patch service with new name', (done) => {
            const newService = {
                "name": "Kabirol del Bo"
            };
            chai.request(config.url)
                .patch(`/services/${testServiceId}`)
                .send(newService)
                .end( (err,res) => {
                    assert.equal(res.statusCode,200);
                    expect(res.body).to.deep.include(newService);
                    chai.request(config.url)
                        .put(`/services/${testServiceId}`)
                        .send(testService)
                        .end()
                    done(err);
                });
        });

        it('patch service with unrecognized properties', (done) => {
            const newService = {
                "nothing": "null"
            };
            chai.request(config.url)
                .patch(`/services/${testServiceId}`)
                .send(newService)
                .end( (err,res) => {
                    assert.equal(res.statusCode,400);
                    let expectedErrors = [
                        "should NOT have additional properties: 'nothing'"
                    ];
                    expect(res.body.errors).to.have.members(expectedErrors);
                    done(err);
                });
        });

        it('validate type of parameters when patching service', (done) => {
            const newService = {
                "name": -1,
            };
            chai.request(config.url)
                .patch(`/services/${testServiceId}`)
                .send(newService)
                .end( (err,res) => {
                    assert.equal(res.statusCode, 400);
                    let expectedErrors = [
                        "'name' should be string"
                    ];
                    expect(res.body.errors).to.have.members(expectedErrors);
                    //restoring the original values as the test is failing
                    chai.request(config.url)
                        .put(`/services/${testServiceId}`)
                        .send(testService)
                        .end()
                    done(err);
                });
        });

        it('validate min length for string parameters when patching service', (done) => {
            const newService = {
                "name":"",
                "id":""
            };
            chai.request(config.url)
                .patch(`/services/${testServiceId}`)
                .send(newService)
                .end( (err,res) => {
                    assert.equal(res.statusCode, 400);
                    let expectedErrors = [
                        "'name' should NOT be shorter than 1 characters",
                        "'id' should NOT be shorter than 1 characters"
                    ];
                    expect(res.body.errors).to.have.members(expectedErrors);
                    //restoring the original values as the test is failing
                    chai.request(config.url)
                        .put(`/services/${testServiceId}`)
                        .send(testService)
                        .end()
                    done(err);
                });
        });

        it('validate max length for string parameters when patching service', (done) => {
            const newService = {
                "name": `${randomstring.generate(101)}`
            };
            chai.request(config.url)
                .patch(`/services/${testServiceId}`)
                .send(newService)
                .end( (err,res) => {
                    assert.equal(res.statusCode, 400);
                    let expectedErrors = [
                        "'name' should NOT be longer than 100 characters"
                    ];
                    expect(res.body.errors).to.have.members(expectedErrors);
                    //restoring the original values as the test is failing
                    chai.request(config.url)
                        .put(`/services/${testServiceId}\``)
                        .send(testCategory)
                        .end()
                    done(err);
                });
        });

    });

    describe('DELETE:', () => {

        it('delete service with non-existing id', (done) => {
            chai.request(config.url)
                .delete(`/services/-1`)
                .end( (err,res) => {
                    assert.equal(res.statusCode,404);
                    assert.equal(res.body.message, "No record found for id '-1'");
                    done(err);
                });

        });

        it('delete service with existing id', (done) => {
            chai.request(config.url)
                .post('/services')
                .send(testService)
                .end( (err,res) => {
                    assert.equal(res.statusCode,201);
                    let newServiceId = res.body.id;
                    chai.request(config.url)
                        .delete(`/services/${newServiceId}`)
                        .end( (err,res) => {
                            assert.equal(res.statusCode, 200);
                            expect(res.body).to.deep.include(testService);
                            done(err);
                        });
                });

        });

    });




});

const testService = {
    "name": "Kabi Services"
};