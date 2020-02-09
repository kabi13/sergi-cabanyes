let chai = require('chai');
let chaiHttp = require('chai-http');
const assert = require('chai').assert;
const expect = require('chai').expect;
const config = require('../config');
const randomstring = require("randomstring");

let testStoreId = 0;

chai.use(chaiHttp);

describe('[STORES]',() => {

    before( (done) => {
        chai.request(config.url)
            .post('/stores')
            .send(testStore)
            .end( (err,res) => {
                assert.equal(res.statusCode,201);
                testStoreId = res.body.id;
                done(err);
            });
    });

    after( (done) => {
        chai.request(config.url)
            .delete(`/stores/${testStoreId}`)
            .end( (err,res) => {
                assert.equal(res.statusCode,200);
                done(err);
            });
    });

    describe('GET:', () => {

        it('get default list of stores', (done) => {
            chai.request(config.url)
                .get('/stores')
                .end( (err,res) => {
                    assert.equal(res.statusCode,200);
                    assert.equal(res.body.limit, 10);
                    assert.equal(res.body.skip, 0);
                    assert.isArray(res.body.data);
                    assert.isAtMost(res.body.data.length, 10);
                    done(err);
                });
        });

        it('get list of stores limit 17', (done) => {
            chai.request(config.url)
                .get('/stores?$limit=17')
                .end( (err,res) => {
                    assert.equal(res.statusCode,200);
                    assert.equal(res.body.limit, 17);
                    assert.equal(res.body.skip, 0);
                    assert.isAtMost(res.body.data.length, 17);
                    done(err);
                });
        });

        it('get list of stores max limit 25', (done) => {
            chai.request(config.url)
                .get('/stores?$limit=53')
                .end( (err,res) => {
                    assert.equal(res.statusCode,200);
                    assert.equal(res.body.limit, 25);
                    assert.equal(res.body.skip, 0);
                    assert.isAtMost(res.body.data.length, 25);
                    done(err);
                });
        });

        it('get list of stores skipping first 25', (done) => {
            chai.request(config.url)
                .get('/stores?$limit=25&$skip=25')
                .end( (err,res) => {
                    assert.equal(res.statusCode,200);
                    assert.equal(res.body.limit, 25);
                    assert.equal(res.body.skip, 25);
                    assert.isAtMost(res.body.data.length, 25);
                    done(err);
                });
        });

        it('get list of stores filtering by name', (done) => {
            chai.request(config.url)
                .get(`/stores?name=${testStore.name}`)
                .end( (err,res) => {
                    assert.equal(res.statusCode,200);
                    assert.isAtLeast(res.body.data.length, 1);
                    assert.equal(res.body.data[0].name,testStore.name);
                    done(err);
                });
        });

        it('get list of stores filtering by partial store name', (done) => {
            chai.request(config.url)
                .get(`/stores?name[$like]=*Potatoes*`)
                .end( (err,res) => {
                    assert.equal(res.statusCode,200);
                    assert.isAtLeast(res.body.data.length, 1);
                    res.body.data.forEach(store => {
                        assert.ok(store.name.toLowerCase().includes('potatoes'))
                    });
                    done(err);
                });
        });

        it('get list of stores filtering by service name', (done) => {
            chai.request(config.url)
                .get(`/stores?service.name=Best Buy Mobile`)
                .end( (err,res) => {
                    assert.equal(res.statusCode,200);
                    let stores = res.body.data.filter(store => {
                        let foundServiceInStore = store.services.find((service) => service.name.toLowerCase() === 'best buy mobile');
                        if (foundServiceInStore) return true
                    });
                    assert.equal(res.body.data.length,stores.length);
                    done(err);
                });
        });

        it('get list of stores only with name and address', (done) => {
            chai.request(config.url)
                .get(`/stores?$select[]=name&$select[]=address`)
                .end( (err,res) => {
                    assert.equal(res.statusCode,200);
                    res.body.data.forEach(store => {
                        assert.equal(Object.keys(store).length, 2);
                        assert.hasAllKeys(store, ['name','address']);
                    });
                    done(err);
                });
        });

        it('get store by id', (done) => {
            chai.request(config.url)
                .get(`/stores/${testStoreId}`)
                .end( (err,res) => {
                    assert.equal(res.statusCode,200);
                    assert.equal(res.body.id,testStoreId);
                    done(err);
                });
        });

        it('get store with wrong id', (done) => {
            chai.request(config.url)
                .get(`/stores/${-1}`)
                .end( (err,res) => {
                    assert.equal(res.statusCode,404);
                    assert.equal(res.body.message,`No record found for id \'${-1}\'`);
                    done(err);
                });
        });

        it('get store selecting only the name', (done) => {
            chai.request(config.url)
                .get(`/stores/${testStoreId}?$select[]=name`)
                .end( (err,res) => {
                    assert.equal(res.statusCode,200);
                    assert.equal(Object.keys(res.body).length,2);
                    assert.equal(res.body.name,testStore.name);
                    assert.equal(res.body.id,testStoreId);
                    done(err);
                });
        });

    });

    describe('POST:', () => {

        it('create empty store', (done) => {
            const newStore = {};
            chai.request(config.url)
                .post('/stores')
                .send(newStore)
                .end( (err,res) => {
                    assert.equal(res.statusCode,400);
                    let expectedErrors = [
                        "should have required property 'name'",
                        "should have required property 'address'",
                        "should have required property 'city'",
                        "should have required property 'state'",
                        "should have required property 'zip'"
                    ];
                    expect(res.body.errors).to.have.members(expectedErrors);
                    done(err);
                });
        });

        it('create store without name', (done) => {
            const newStore = {
                "address": "Al mig de Joanetes",
                "city": "Joanetes",
                "state": "Catalunya",
                "zip": "1714",
            };
            chai.request(config.url)
                .post('/stores')
                .send(newStore)
                .end( (err,res) => {
                    assert.equal(res.statusCode,400);
                    let expectedErrors = [
                        "should have required property 'name'"
                    ];
                    expect(res.body.errors).to.have.members(expectedErrors);
                    done(err);
                });
        });

        it('create store without address', (done) => {
            const newStore = {
                "name": "Botigueta",
                "city": "Joanetes",
                "state": "Catalunya",
                "zip": "1714",
            };
            chai.request(config.url)
                .post('/stores')
                .send(newStore)
                .end( (err,res) => {
                    assert.equal(res.statusCode,400);
                    let expectedErrors = [
                        "should have required property 'address'"
                    ];
                    expect(res.body.errors).to.have.members(expectedErrors);
                    done(err);
                });
        });

        it('create store without city', (done) => {
            const newStore = {
                "name": "Botigueta",
                "address": "Al mig de Joanetes",
                "state": "Catalunya",
                "zip": "1714",
            };
            chai.request(config.url)
                .post('/stores')
                .send(newStore)
                .end( (err,res) => {
                    assert.equal(res.statusCode,400);
                    let expectedErrors = [
                        "should have required property 'city'"
                    ];
                    expect(res.body.errors).to.have.members(expectedErrors);
                    done(err);
                });
        });

        it('create store without state', (done) => {
            const newStore = {
                "name": "Botigueta",
                "address": "Al mig de Joanetes",
                "city": "Joanetes",
                "zip": "1714",
            };
            chai.request(config.url)
                .post('/stores')
                .send(newStore)
                .end( (err,res) => {
                    assert.equal(res.statusCode,400);
                    let expectedErrors = [
                        "should have required property 'state'"
                    ];
                    expect(res.body.errors).to.have.members(expectedErrors);
                    done(err);
                });
        });

        it('create store without zip', (done) => {
            const newStore = {
                "name": "Botigueta",
                "address": "Al mig de Joanetes",
                "city": "Joanetes",
                "state": "Catalunya",
            };
            chai.request(config.url)
                .post('/stores')
                .send(newStore)
                .end( (err,res) => {
                    assert.equal(res.statusCode,400);
                    let expectedErrors = [
                        "should have required property 'zip'"
                    ];
                    expect(res.body.errors).to.have.members(expectedErrors);
                    done(err);
                });
        });

        it('create store with unrecognized properties', (done) => {
            const newStore = {
                "nothing":"null",
                "name": "Botigueta",
                "type":"Localillo",
                "address": "Al mig de Joanetes",
                "address2":"Can Pet",
                "city": "Joanetes",
                "state": "Catalunya",
                "zip": "1714",
                "lat": 42.120153,
                "lng": 2.419299,
                "hours":"Tue: 10-9; Wed: 10-9; Thurs: 10-9; Fri: 10-9"
            };
            chai.request(config.url)
                .post('/stores')
                .send(newStore)
                .end( (err,res) => {
                    assert.equal(res.statusCode,400);
                    let expectedErrors = [
                        "should NOT have additional properties: 'nothing'"
                    ];
                    expect(res.body.errors).to.have.members(expectedErrors);
                    done(err);
                });
        });

        it('validate type of parameters when creating store', (done) => {
            const newStore = {
                "name":-1,
                "type":-1,
                "address":-1,
                "address2":-1,
                "city":-1,
                "state":-1,
                "zip":-1,
                "lat":"no",
                "lng":"no",
                "hours":-1
            };
            chai.request(config.url)
                .post('/stores')
                .send(newStore)
                .end( (err,res) => {
                    assert.equal(res.statusCode, 400);
                    let expectedErrors = [
                        "'name' should be string",
                        "'type' should be string",
                        "'address' should be string",
                        "'address2' should be string",
                        "'city' should be string",
                        "'state' should be string",
                        "'zip' should be string",
                        "'lat' should be number",
                        "'lng' should be number",
                        "'hours' should be string"
                    ];
                    expect(res.body.errors).to.have.members(expectedErrors);
                    done(err);
                });
        });

        it('validate min length for string parameters when creating store', (done) => {
            const newStore = {
                "name":"",
                "type":"",
                "address":"",
                "city":"",
                "state":"",
                "zip":"",
                "hours":""
            };
            chai.request(config.url)
                .post('/stores')
                .send(newStore)
                .end( (err,res) => {
                    assert.equal(res.statusCode, 400);
                    let expectedErrors = [
                        "'name' should NOT be shorter than 1 characters",
                        "'type' should NOT be shorter than 1 characters",
                        "'address' should NOT be shorter than 1 characters",
                        "'city' should NOT be shorter than 1 characters",
                        "'state' should NOT be shorter than 1 characters",
                        "'zip' should NOT be shorter than 1 characters",
                        "'hours' should NOT be shorter than 1 characters"
                    ];
                    expect(res.body.errors).to.have.members(expectedErrors);
                    done(err);
                });
        });

        it('validate max length for string parameters when creating store', (done) => {
            const newStore = {
                "name": `${randomstring.generate(101)}`,
                "type": `${randomstring.generate(31)}`,
                "address": `${randomstring.generate(51)}`,
                "address2": `${randomstring.generate(31)}`,
                "city": `${randomstring.generate(51)}`,
                "state": `${randomstring.generate(31)}`,
                "zip": `${randomstring.generate(31)}`,
                "hours": `${randomstring.generate(101)}`,
            };
            chai.request(config.url)
                .post('/stores')
                .send(newStore)
                .end( (err,res) => {
                    assert.equal(res.statusCode, 400);
                    let expectedErrors = [
                        "'name' should NOT be longer than 100 characters",
                        "'type' should NOT be longer than 30 characters",
                        "'address' should NOT be longer than 50 characters",
                        "'address2' should NOT be longer than 30 characters",
                        "'city' should NOT be longer than 50 characters",
                        "'state' should NOT be longer than 30 characters",
                        "'zip' should NOT be longer than 30 characters",
                        "'hours' should NOT be longer than 100 characters"
                    ];
                    expect(res.body.errors).to.have.members(expectedErrors);
                    done(err);
                });
        });

        it('create store with only required fields', (done) => {
            const newStore = {
                "name": "Botigueta",
                "address": "Al mig de Joanetes",
                "city": "Joanetes",
                "state": "Catalunya",
                "zip": "1714",
            };
            let newStoreId = 0;
            chai.request(config.url)
                .post('/stores')
                .send(newStore)
                .end( (err,res) => {
                    assert.equal(res.statusCode,201);
                    newStoreId = res.body.id;
                    expect(res.body).to.deep.include(newStore);
                    chai.request(config.url)
                        .delete(`/stores/${newStoreId}`)
                        .end();
                    done(err);
                });
        });

        it('create store with all fields', (done) => {
            const newStore = {
                "name": "Botigueta",
                "type":"Localillo",
                "address": "Al mig de Joanetes",
                "address2":"Can Pet",
                "city": "Joanetes",
                "state": "Catalunya",
                "zip": "1714",
                "lat": 42.120153,
                "lng": 2.419299,
                "hours":"Tue: 10-9; Wed: 10-9; Thurs: 10-9; Fri: 10-9"
            };
            let newStoreId = 0;
            chai.request(config.url)
                .post('/stores')
                .send(newStore)
                .end( (err,res) => {
                    assert.equal(res.statusCode,201);
                    newStoreId = res.body.id;
                    expect(res.body).to.deep.include(newStore);
                    chai.request(config.url)
                        .delete(`/stores/${newStoreId}`)
                        .end();
                    done(err);
                });
        });

    });

    describe('PUT:', () => {

        it('update with empty store', (done) => {
            const newStore = {};
            chai.request(config.url)
                .put(`/stores/${testStoreId}`)
                .send(newStore)
                .end( (err,res) => {
                    assert.equal(res.statusCode,400);
                    let expectedErrors = [
                        "should have required property 'name'",
                        "should have required property 'address'",
                        "should have required property 'city'",
                        "should have required property 'state'",
                        "should have required property 'zip'"
                    ];
                    expect(res.body.errors).to.have.members(expectedErrors);
                    done(err);
                });
        });

        it('cannot update store with new id', (done) => {
            const newStore = {
                "id": -1,
                "name": "Botigueta",
                "address": "Al mig de Joanetes",
                "city": "Joanetes",
                "state": "Catalunya",
                "zip": "1714",
            };
            chai.request(config.url)
                .put(`/stores/${testStoreId}`)
                .send(newStore)
                .end( (err,res) => {
                    assert.equal(res.statusCode,400);
                    let expectedErrors = [
                        "should NOT have additional properties: 'id'"
                    ];
                    expect(res.body.errors).to.have.members(expectedErrors);
                    done(err);
                });
        });

        it('update store without name', (done) => {
            const newStore = {
                "address": "Al mig de Joanetes",
                "city": "Joanetes",
                "state": "Catalunya",
                "zip": "1714",
            };
            chai.request(config.url)
                .put(`/stores/${testStoreId}`)
                .send(newStore)
                .end( (err,res) => {
                    assert.equal(res.statusCode,400);
                    let expectedErrors = [
                        "should have required property 'name'"
                    ];
                    expect(res.body.errors).to.have.members(expectedErrors);
                    done(err);
                });
        });

        it('update store without address', (done) => {
            const newStore = {
                "name": "Botigueta",
                "city": "Joanetes",
                "state": "Catalunya",
                "zip": "1714",
            };
            chai.request(config.url)
                .put(`/stores/${testStoreId}`)
                .send(newStore)
                .end( (err,res) => {
                    assert.equal(res.statusCode,400);
                    let expectedErrors = [
                        "should have required property 'address'"
                    ];
                    expect(res.body.errors).to.have.members(expectedErrors);
                    done(err);
                });
        });

        it('update store without city', (done) => {
            const newStore = {
                "name": "Botigueta",
                "address": "Al mig de Joanetes",
                "state": "Catalunya",
                "zip": "1714",
            };
            chai.request(config.url)
                .put(`/stores/${testStoreId}`)
                .send(newStore)
                .end( (err,res) => {
                    assert.equal(res.statusCode,400);
                    let expectedErrors = [
                        "should have required property 'city'"
                    ];
                    expect(res.body.errors).to.have.members(expectedErrors);
                    done(err);
                });
        });

        it('update store without state', (done) => {
            const newStore = {
                "name": "Botigueta",
                "address": "Al mig de Joanetes",
                "city": "Joanetes",
                "zip": "1714",
            };
            chai.request(config.url)
                .put(`/stores/${testStoreId}`)
                .send(newStore)
                .end( (err,res) => {
                    assert.equal(res.statusCode,400);
                    let expectedErrors = [
                        "should have required property 'state'"
                    ];
                    expect(res.body.errors).to.have.members(expectedErrors);
                    done(err);
                });
        });

        it('update store without zip', (done) => {
            const newStore = {
                "name": "Botigueta",
                "address": "Al mig de Joanetes",
                "city": "Joanetes",
                "state": "Catalunya",
            };
            chai.request(config.url)
                .put(`/stores/${testStoreId}`)
                .send(newStore)
                .end( (err,res) => {
                    assert.equal(res.statusCode,400);
                    let expectedErrors = [
                        "should have required property 'zip'"
                    ];
                    expect(res.body.errors).to.have.members(expectedErrors);
                    done(err);
                });
        });

        it('update store with unrecognized properties', (done) => {
            const newStore = {
                "nothing":"null",
                "name": "Botigueta",
                "address": "Al mig de Joanetes",
                "city": "Joanetes",
                "state": "Catalunya",
                "zip": "1714",
            };
            chai.request(config.url)
                .put(`/stores/${testStoreId}`)
                .send(newStore)
                .end( (err,res) => {
                    assert.equal(res.statusCode,400);
                    let expectedErrors = [
                        "should NOT have additional properties: 'nothing'"
                    ];
                    expect(res.body.errors).to.have.members(expectedErrors);
                    done(err);
                });
        });

        it('validate type of parameters when updating store', (done) => {
            const newStore = {
                "name":-1,
                "type":-1,
                "address":-1,
                "address2":-1,
                "city":-1,
                "state":-1,
                "zip":-1,
                "lat":"no",
                "lng":"no",
                "hours":-1
            };
            chai.request(config.url)
                .put('/stores')
                .send(newStore)
                .end( (err,res) => {
                    assert.equal(res.statusCode, 400);
                    let expectedErrors = [
                        "'name' should be string",
                        "'type' should be string",
                        "'address' should be string",
                        "'address2' should be string",
                        "'city' should be string",
                        "'state' should be string",
                        "'zip' should be string",
                        "'lat' should be number",
                        "'lng' should be number",
                        "'hours' should be string"
                    ];
                    expect(res.body.errors).to.have.members(expectedErrors);
                    done(err);
                });
        });

        it('validate min length for string parameters when updating store', (done) => {
            const newStore = {
                "name":"",
                "type":"",
                "address":"",
                "city":"",
                "state":"",
                "zip":"",
                "hours":""
            };
            chai.request(config.url)
                .put('/stores')
                .send(newStore)
                .end( (err,res) => {
                    assert.equal(res.statusCode, 400);
                    let expectedErrors = [
                        "'name' should NOT be shorter than 1 characters",
                        "'type' should NOT be shorter than 1 characters",
                        "'address' should NOT be shorter than 1 characters",
                        "'city' should NOT be shorter than 1 characters",
                        "'state' should NOT be shorter than 1 characters",
                        "'zip' should NOT be shorter than 1 characters",
                        "'hours' should NOT be shorter than 1 characters"
                    ];
                    expect(res.body.errors).to.have.members(expectedErrors);
                    done(err);
                });
        });

        it('validate max length for string parameters when updating store', (done) => {
            const newStore = {
                "name": `${randomstring.generate(101)}`,
                "type": `${randomstring.generate(31)}`,
                "address": `${randomstring.generate(51)}`,
                "address2": `${randomstring.generate(31)}`,
                "city": `${randomstring.generate(51)}`,
                "state": `${randomstring.generate(31)}`,
                "zip": `${randomstring.generate(31)}`,
                "hours": `${randomstring.generate(101)}`,
            };
            chai.request(config.url)
                .put('/stores')
                .send(newStore)
                .end( (err,res) => {
                    assert.equal(res.statusCode, 400);
                    let expectedErrors = [
                        "'name' should NOT be longer than 100 characters",
                        "'type' should NOT be longer than 30 characters",
                        "'address' should NOT be longer than 50 characters",
                        "'address2' should NOT be longer than 30 characters",
                        "'city' should NOT be longer than 50 characters",
                        "'state' should NOT be longer than 30 characters",
                        "'zip' should NOT be longer than 30 characters",
                        "'hours' should NOT be longer than 100 characters"
                    ];
                    expect(res.body.errors).to.have.members(expectedErrors);
                    done(err);
                });
        });

        it('update store with only required fields', (done) => {
            const newStore = {
                "name": "Botigueta",
                "address": "Al mig de Joanetes",
                "city": "Joanetes",
                "state": "Catalunya",
                "zip": "1714"
            };
            chai.request(config.url)
                .put(`/stores/${testStoreId}`)
                .send(newStore)
                .end( (err,res) => {
                    assert.equal(res.statusCode,200);
                    expect(res.body).to.deep.include(newStore);
                    chai.request(config.url)
                        .put(`/stores/${testStoreId}`)
                        .send(testStore)
                        .end( (err) => {
                            done(err);
                        });
                });
        });

        it('update store with all fields', (done) => {
            const newStore = {
                "name": "Botigueta",
                "type":"Localillo",
                "address": "Al mig de Joanetes",
                "address2":"Can Pet",
                "city": "Joanetes",
                "state": "Catalunya",
                "zip": "1714",
                "lat": 42.120153,
                "lng": 2.419299,
                "hours":"Tue: 10-9; Wed: 10-9; Thurs: 10-9; Fri: 10-9"
            };
            chai.request(config.url)
                .put(`/stores/${testStoreId}`)
                .send(newStore)
                .end( (err,res) => {
                    assert.equal(res.statusCode,200);
                    expect(res.body).to.deep.include(newStore);
                    chai.request(config.url)
                        .put(`/stores/${testStoreId}`)
                        .send(testStore)
                        .end( (err) => {
                            done(err);
                        });
                });
        });

    });

    describe('PATCH:', () => {

        it('patch store without properties changes', (done) => {
            const newStore = {};
            chai.request(config.url)
                .patch(`/stores/${testStoreId}`)
                .send(newStore)
                .end( (err,res) => {
                    assert.equal(res.statusCode,200);
                    expect(res.body).to.deep.include(testStore);
                    done(err);
                });
        });

        it('cannot patch store with new id', (done) => {
            const newStore = {
                "id": -1
            };
            chai.request(config.url)
                .patch(`/stores/${testStoreId}`)
                .send(newStore)
                .end( (err,res) => {
                    assert.equal(res.statusCode,400);
                    assert.equal(res.body.id, testStoreId);
                    done(err);
                });
        });

        it('patch store with new name', (done) => {
            const newStore = {
                "name": "Patatones"
            };
            chai.request(config.url)
                .patch(`/stores/${testStoreId}`)
                .send(newStore)
                .end( (err,res) => {
                    assert.equal(res.statusCode,200);
                    expect(res.body).to.deep.include(newStore);
                    chai.request(config.url)
                        .put(`/stores/${testStoreId}`)
                        .send(testStore)
                        .end()
                    done(err);
                });
        });

        it('patch store with unrecognized properties', (done) => {
            const newStore = {
                "nothing": "null"
            };
            chai.request(config.url)
                .patch(`/stores/${testStoreId}`)
                .send(newStore)
                .end( (err,res) => {
                    assert.equal(res.statusCode,400);
                    let expectedErrors = [
                        "should NOT have additional properties: 'nothing'"
                    ];
                    expect(res.body.errors).to.have.members(expectedErrors);
                    done(err);
                });
        });

        it('validate type of parameters when patching store', (done) => {
            const newStore = {
                "name":-1,
                "type":-1,
                "address":-1,
                "address2":-1,
                "city":-1,
                "state":-1,
                "zip":-1,
                "lat":"no",
                "lng":"no",
                "hours":-1
            };
            chai.request(config.url)
                .patch(`/stores/${testStoreId}`)
                .send(newStore)
                .end( (err,res) => {
                    assert.equal(res.statusCode, 400);
                    let expectedErrors = [
                        "'name' should be string",
                        "'type' should be string",
                        "'address' should be string",
                        "'address2' should be string",
                        "'city' should be string",
                        "'state' should be string",
                        "'zip' should be string",
                        "'lat' should be number",
                        "'lng' should be number",
                        "'hours' should be string"
                    ];
                    expect(res.body.errors).to.have.members(expectedErrors);
                    //restoring the original values as the test is failing
                    chai.request(config.url)
                        .put(`/stores/${testStoreId}`)
                        .send(testStore)
                        .end()
                    done(err);
                });
        });

        it('validate min length for string parameters when patching store', (done) => {
            const newStore = {
                "name":"",
                "type":"",
                "address":"",
                "city":"",
                "state":"",
                "zip":"",
                "hours":""
            };
            chai.request(config.url)
                .patch(`/stores/${testStoreId}`)
                .send(newStore)
                .end( (err,res) => {
                    assert.equal(res.statusCode, 400);
                    let expectedErrors = [
                        "'name' should NOT be shorter than 1 characters",
                        "'type' should NOT be shorter than 1 characters",
                        "'address' should NOT be shorter than 1 characters",
                        "'city' should NOT be shorter than 1 characters",
                        "'state' should NOT be shorter than 1 characters",
                        "'zip' should NOT be shorter than 1 characters",
                        "'hours' should NOT be shorter than 1 characters"
                    ];
                    expect(res.body.errors).to.have.members(expectedErrors);
                    //restoring the original values as the test is failing
                    chai.request(config.url)
                        .put(`/stores/${testStoreId}`)
                        .send(testStore)
                        .end()
                    done(err);
                });
        });

        it('validate max length for string parameters when patching store', (done) => {
            const newStore = {
                "name": `${randomstring.generate(101)}`,
                "type": `${randomstring.generate(31)}`,
                "address": `${randomstring.generate(51)}`,
                "address2": `${randomstring.generate(31)}`,
                "city": `${randomstring.generate(51)}`,
                "state": `${randomstring.generate(31)}`,
                "zip": `${randomstring.generate(31)}`,
                "hours": `${randomstring.generate(101)}`,
            };
            chai.request(config.url)
                .patch(`/stores/${testStoreId}`)
                .send(newStore)
                .end( (err,res) => {
                    assert.equal(res.statusCode, 400);
                    let expectedErrors = [
                        "'name' should NOT be longer than 100 characters",
                        "'type' should NOT be longer than 30 characters",
                        "'address' should NOT be longer than 50 characters",
                        "'address2' should NOT be longer than 30 characters",
                        "'city' should NOT be longer than 50 characters",
                        "'state' should NOT be longer than 30 characters",
                        "'zip' should NOT be longer than 30 characters",
                        "'hours' should NOT be longer than 100 characters"
                    ];
                    expect(res.body.errors).to.have.members(expectedErrors);
                    //restoring the original values as the test is failing
                    chai.request(config.url)
                        .put(`/stores/${testStoreId}`)
                        .send(testStore)
                        .end()
                    done(err);
                });
        });

        it('patch store with required fields', (done) => {
            const newStore = {
                "name": "Botigueta",
                "address": "Al mig de Joanetes",
                "city": "Joanetes",
                "state": "Catalunya",
                "zip": "1714",
            };
            chai.request(config.url)
                .patch(`/stores/${testStoreId}`)
                .send(newStore)
                .end( (err,res) => {
                    assert.equal(res.statusCode,200);
                    expect(res.body).to.deep.include(newStore);
                    chai.request(config.url)
                        .put(`/stores/${testStoreId}`)
                        .send(testStore)
                        .end()
                    done(err);
                });
        });

    });

    describe('DELETE:', () => {

        it('delete store with non-existing id', (done) => {
            chai.request(config.url)
                .delete(`/stores/-1`)
                .end( (err,res) => {
                    assert.equal(res.statusCode,404);
                    assert.equal(res.body.message, "No record found for id '-1'");
                    done(err);
                });

        });

        it('delete store with existing id', (done) => {
            chai.request(config.url)
                .post('/stores')
                .send(testStore)
                .end( (err,res) => {
                    assert.equal(res.statusCode,201);
                    let newStoreId = res.body.id;
                    chai.request(config.url)
                        .delete(`/stores/${newStoreId}`)
                        .end( (err,res) => {
                            assert.equal(res.statusCode, 200);
                            expect(res.body).to.deep.include(testStore);
                            done(err);
                        });
                });

        });

    });

});

const testStore = {
    "name":"Best Potatoes",
    "type":"Store",
    "address":"Plaça Catalunya 13",
    "address2":"",
    "city":"Olot",
    "state":"CAT",
    "zip":"17800",
    "lat":42.182363,
    "lng":2.485790,
    "hours":"Mon: 10-9; Tue: 10-9; Wed: 10-9; Thurs: 10-9; Fri: 10-9"
};