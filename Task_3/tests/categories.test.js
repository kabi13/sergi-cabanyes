let chai = require('chai');
let chaiHttp = require('chai-http');
const assert = require('chai').assert;
const expect = require('chai').expect;
const config = require('../config');
const randomstring = require("randomstring");

chai.use(chaiHttp);

describe('[CATEGORIES]',() => {

    before( (done) => {
        chai.request(config.url)
            .post('/categories')
            .send(testCategory)
            .end( (err,res) => {
                assert.equal(res.statusCode,201);
                done(err);
            });
    });

    after( (done) => {
        chai.request(config.url)
            .delete(`/categories/${testCategory.id}`)
            .end( (err,res) => {
                assert.equal(res.statusCode,200);
                done(err);
            });
    });

    describe('GET:', () => {

        it('get default list of categories', (done) => {
            chai.request(config.url)
                .get('/categories')
                .end( (err,res) => {
                    assert.equal(res.statusCode,200);
                    assert.equal(res.body.limit, 10);
                    assert.equal(res.body.skip, 0);
                    assert.isArray(res.body.data);
                    assert.isAtMost(res.body.data.length, 10);
                    done(err);
                });
        });

        it('get list of categories limit 17', (done) => {
            chai.request(config.url)
                .get('/categories?$limit=17')
                .end( (err,res) => {
                    assert.equal(res.statusCode,200);
                    assert.equal(res.body.limit, 17);
                    assert.equal(res.body.skip, 0);
                    assert.isAtMost(res.body.data.length, 17);
                    done(err);
                });
        });

        it('get list of categories max limit 25', (done) => {
            chai.request(config.url)
                .get('/categories?$limit=53')
                .end( (err,res) => {
                    assert.equal(res.statusCode,200);
                    assert.equal(res.body.limit, 25);
                    assert.equal(res.body.skip, 0);
                    assert.isAtMost(res.body.data.length, 25);
                    done(err);
                });
        });

        it('get list of categories skipping first 25', (done) => {
            chai.request(config.url)
                .get('/categories?$limit=25&$skip=25')
                .end( (err,res) => {
                    assert.equal(res.statusCode,200);
                    assert.equal(res.body.limit, 25);
                    assert.equal(res.body.skip, 25);
                    assert.isAtMost(res.body.data.length, 25);
                    done(err);
                });
        });

        it('get list of categories filtering by name', (done) => {
            chai.request(config.url)
                .get(`/categories?name=${testCategory.name}`)
                .end( (err,res) => {
                    assert.equal(res.statusCode,200);
                    assert.isAtLeast(res.body.data.length, 1);
                    assert.equal(res.body.data[0].name,testCategory.name);
                    done(err);
                });
        });

        it('get list of categories filtering by partial category name', (done) => {
            chai.request(config.url)
                .get(`/categories?name[$like]=*Kabi*`)
                .end( (err,res) => {
                    assert.equal(res.statusCode,200);
                    assert.isAtLeast(res.body.data.length, 1);
                    res.body.data.forEach(category => {
                        assert.ok(category.name.toLowerCase().includes('kabi'))
                    });
                    done(err);
                });
        });

        it('get category by id', (done) => {
            chai.request(config.url)
                .get(`/categories/${testCategory.id}`)
                .end( (err,res) => {
                    assert.equal(res.statusCode,200);
                    assert.equal(res.body.id,testCategory.id);
                    done(err);
                });
        });

        it('get category with wrong id', (done) => {
            chai.request(config.url)
                .get(`/categories/${-1}`)
                .end( (err,res) => {
                    assert.equal(res.statusCode,404);
                    assert.equal(res.body.message,`No record found for id \'${-1}\'`);
                    done(err);
                });
        });

        it('get category selecting only the name', (done) => {
            chai.request(config.url)
                .get(`/categories/${testCategory.id}?$select[]=name`)
                .end( (err,res) => {
                    assert.equal(res.statusCode,200);
                    assert.equal(Object.keys(res.body).length,2);
                    assert.equal(res.body.name,testCategory.name);
                    assert.equal(res.body.id,testCategory.id);
                    done(err);
                });
        });

    });

    describe('POST:', () => {

        it('create empty category', (done) => {
            const newCategory = {};
            chai.request(config.url)
                .post('/categories')
                .send(newCategory)
                .end( (err,res) => {
                    assert.equal(res.statusCode,400);
                    let expectedErrors = [
                        "should have required property 'name'",
                        "should have required property 'id'"
                    ];
                    expect(res.body.errors).to.have.members(expectedErrors);
                    done(err);
                });
        });

        it('create category without name', (done) => {
            const newCategory = {
                "id":"kabirol12345"
            };
            chai.request(config.url)
                .post('/categories')
                .send(newCategory)
                .end( (err,res) => {
                    assert.equal(res.statusCode,400);
                    let expectedErrors = [
                        "should have required property 'name'"
                    ];
                    expect(res.body.errors).to.have.members(expectedErrors);
                    done(err);
                });
        });

        it('create category without id', (done) => {
            const newCategory = {
                "name":"Kabirol del Bo"
            };
            chai.request(config.url)
                .post('/categories')
                .send(newCategory)
                .end( (err,res) => {
                    assert.equal(res.statusCode,400);
                    let expectedErrors = [
                        "should have required property 'id'"
                    ];
                    expect(res.body.errors).to.have.members(expectedErrors);
                    done(err);
                });
        });

        it('create category with unrecognized properties', (done) => {
            const newCategory = {
                "nothing":"null",
                "id":"kabirol12345",
                "name":"Kabirol del Bo"
            };
            chai.request(config.url)
                .post('/categories')
                .send(newCategory)
                .end( (err,res) => {
                    assert.equal(res.statusCode,400);
                    let expectedErrors = [
                        "should NOT have additional properties: 'nothing'"
                    ];
                    expect(res.body.errors).to.have.members(expectedErrors);
                    done(err);
                });
        });

        it('validate type of parameters when creating category', (done) => {
            const newCategory = {
                "name":-1,
                "id":-1
            };
            chai.request(config.url)
                .post('/categories')
                .send(newCategory)
                .end( (err,res) => {
                    assert.equal(res.statusCode, 400);
                    let expectedErrors = [
                        "'name' should be string",
                        "'id' should be string"
                    ];
                    expect(res.body.errors).to.have.members(expectedErrors);
                    done(err);
                });
        });

        it('validate min length for string parameters when creating category', (done) => {
            const newCategory = {
                "name": "",
                "id": ""
            };
            chai.request(config.url)
                .post('/categories')
                .send(newCategory)
                .end( (err,res) => {
                    assert.equal(res.statusCode, 400);
                    let expectedErrors = [
                        "'name' should NOT be shorter than 1 characters",
                        "'id' should NOT be shorter than 1 characters"
                    ];
                    expect(res.body.errors).to.have.members(expectedErrors);
                    done(err);
                });
        });

        it('validate max length for string parameters when creating category', (done) => {
            const newCategory = {
                "name": `${randomstring.generate(101)}`,
                "id": `${randomstring.generate(101)}`
            };
            chai.request(config.url)
                .post('/categories')
                .send(newCategory)
                .end( (err,res) => {
                    assert.equal(res.statusCode, 400);
                    let expectedErrors = [
                        "'name' should NOT be longer than 100 characters",
                        "'id' should NOT be longer than 100 characters"
                    ];
                    expect(res.body.errors).to.have.members(expectedErrors);
                    done(err);
                });
        });

        it('create category with only required fields', (done) => {
            const newCategory = {
                "id":"kabirol98765",
                "name":"Kabirol del Bo"
            };
            chai.request(config.url)
                .post('/categories')
                .send(newCategory)
                .end( (err,res) => {
                    assert.equal(res.statusCode,201);
                    expect(res.body).to.deep.include(newCategory);
                    chai.request(config.url)
                        .delete(`/categories/${newCategory.id}`)
                        .end();
                    done(err);
                });
        });

        it('create category with duplicated id', (done) => {
            const newCategory = {
                "id":"kabi13131313",
                "name":"Kabirol del Bo"
            };
            chai.request(config.url)
                .post('/categories')
                .send(newCategory)
                .end( (err,res) => {
                    assert.equal(res.statusCode,400);
                    let expectedErrors = "id must be unique";
                    expect(res.body.errors[0].message).to.be.equal(expectedErrors);
                    done(err);
                });
        });

    });

    describe('PUT:', () => {

        it('update empty category', (done) => {
            const newCategory = {};
            chai.request(config.url)
                .put(`/categories/${testCategory.id}`)
                .send(newCategory)
                .end( (err,res) => {
                    assert.equal(res.statusCode,400);
                    let expectedErrors = [
                        "should have required property 'name'",
                        "should have required property 'id'"
                    ];
                    expect(res.body.errors).to.have.members(expectedErrors);
                    done(err);
                });
        });

        it('update category without name', (done) => {
            const newCategory = {
                "id":"kabirol12345"
            };
            chai.request(config.url)
                .put(`/categories/${testCategory.id}`)
                .send(newCategory)
                .end( (err,res) => {
                    assert.equal(res.statusCode,400);
                    let expectedErrors = [
                        "should have required property 'name'"
                    ];
                    expect(res.body.errors).to.have.members(expectedErrors);
                    done(err);
                });
        });

        it('update category without id', (done) => {
            const newCategory = {
                "name":"Kabirol del Bo"
            };
            chai.request(config.url)
                .put(`/categories/${testCategory.id}`)
                .send(newCategory)
                .end( (err,res) => {
                    assert.equal(res.statusCode,400);
                    let expectedErrors = [
                        "should have required property 'id'"
                    ];
                    expect(res.body.errors).to.have.members(expectedErrors);
                    done(err);
                });
        });

        it('update category with unrecognized properties', (done) => {
            const newCategory = {
                "nothing":"null",
                "id":"kabirol12345",
                "name":"Kabirol del Bo"
            };
            chai.request(config.url)
                .put(`/categories/${testCategory.id}`)
                .send(newCategory)
                .end( (err,res) => {
                    assert.equal(res.statusCode,400);
                    let expectedErrors = [
                        "should NOT have additional properties: 'nothing'"
                    ];
                    expect(res.body.errors).to.have.members(expectedErrors);
                    done(err);
                });
        });

        it('validate type of parameters when updating category', (done) => {
            const newCategory = {
                "name":-1,
                "id":-1
            };
            chai.request(config.url)
                .put(`/categories/${testCategory.id}`)
                .send(newCategory)
                .end( (err,res) => {
                    assert.equal(res.statusCode, 400);
                    let expectedErrors = [
                        "'name' should be string",
                        "'id' should be string"
                    ];
                    expect(res.body.errors).to.have.members(expectedErrors);
                    done(err);
                });
        });

        it('validate min length for string parameters when updating category', (done) => {
            const newCategory = {
                "name": "",
                "id": ""
            };
            chai.request(config.url)
                .put(`/categories/${testCategory.id}`)
                .send(newCategory)
                .end( (err,res) => {
                    assert.equal(res.statusCode, 400);
                    let expectedErrors = [
                        "'name' should NOT be shorter than 1 characters",
                        "'id' should NOT be shorter than 1 characters"
                    ];
                    expect(res.body.errors).to.have.members(expectedErrors);
                    done(err);
                });
        });

        it('validate max length for string parameters when updating category', (done) => {
            const newCategory = {
                "name": `${randomstring.generate(101)}`,
                "id": `${randomstring.generate(101)}`
            };
            chai.request(config.url)
                .put(`/categories/${testCategory.id}`)
                .send(newCategory)
                .end( (err,res) => {
                    assert.equal(res.statusCode, 400);
                    let expectedErrors = [
                        "'name' should NOT be longer than 100 characters",
                        "'id' should NOT be longer than 100 characters"
                    ];
                    expect(res.body.errors).to.have.members(expectedErrors);
                    done(err);
                });
        });

        it('update category with only new name', (done) => {
            const newCategory = {
                "id":"kabi13131313",
                "name":"Kabirol del Bo"
            };
            chai.request(config.url)
                .put(`/categories/${testCategory.id}`)
                .send(newCategory)
                .end( (err,res) => {
                    assert.equal(res.statusCode,200);
                    expect(res.body).to.deep.include(newCategory);
                    //restoring the original values as the test is failing
                    chai.request(config.url)
                        .put(`/categories/${testCategory.id}`)
                        .send(testCategory)
                        .end( (err) => {
                            done(err);
                        });
                });
        });

    });

    describe('PATCH:', () => {

        it('patch category without properties changes', (done) => {
            const newCategory = {};
            chai.request(config.url)
                .patch(`/categories/${testCategory.id}`)
                .send(newCategory)
                .end( (err,res) => {
                    assert.equal(res.statusCode,200);
                    expect(res.body).to.deep.include(testCategory);
                    done(err);
                });
        });

        it('cannot patch category with new id', (done) => {
            const newCategory = {
                "id": -1
            };
            chai.request(config.url)
                .patch(`/categories/${testCategory.id}`)
                .send(newCategory)
                .end( (err,res) => {
                    assert.equal(res.statusCode,400);
                    assert.equal(res.body.id, testCategory.id);
                    done(err);
                });
        });

        it('patch category with new name', (done) => {
            const newCategory = {
                "name": "Kabirol del Bo"
            };
            chai.request(config.url)
                .patch(`/categories/${testCategory.id}`)
                .send(newCategory)
                .end( (err,res) => {
                    assert.equal(res.statusCode,200);
                    expect(res.body).to.deep.include(newCategory);
                    chai.request(config.url)
                        .put(`/category/${testCategory.id}`)
                        .send(testCategory)
                        .end()
                    done(err);
                });
        });

        it('patch category with unrecognized properties', (done) => {
            const newCategory = {
                "nothing": "null"
            };
            chai.request(config.url)
                .patch(`/categories/${testCategory.id}`)
                .send(newCategory)
                .end( (err,res) => {
                    assert.equal(res.statusCode,400);
                    let expectedErrors = [
                        "should NOT have additional properties: 'nothing'"
                    ];
                    expect(res.body.errors).to.have.members(expectedErrors);
                    done(err);
                });
        });

        it('validate type of parameters when patching category', (done) => {
            const newCategory = {
                "name": -1,
            };
            chai.request(config.url)
                .patch(`/categories/${testCategory.id}`)
                .send(newCategory)
                .end( (err,res) => {
                    assert.equal(res.statusCode, 400);
                    let expectedErrors = [
                        "'name' should be string"
                    ];
                    expect(res.body.errors).to.have.members(expectedErrors);
                    //restoring the original values as the test is failing
                    chai.request(config.url)
                        .put(`/categories/${testCategory.id}`)
                        .send(testCategory)
                        .end()
                    done(err);
                });
        });

        it('validate min length for string parameters when patching category', (done) => {
            const newCategory = {
                "name":"",
                "id":""
            };
            chai.request(config.url)
                .patch(`/categories/${testCategory.id}`)
                .send(newCategory)
                .end( (err,res) => {
                    assert.equal(res.statusCode, 400);
                    let expectedErrors = [
                        "'name' should NOT be shorter than 1 characters",
                        "'id' should NOT be shorter than 1 characters"
                    ];
                    expect(res.body.errors).to.have.members(expectedErrors);
                    //restoring the original values as the test is failing
                    chai.request(config.url)
                        .put(`/categories/${testCategory.id}`)
                        .send(testCategory)
                        .end()
                    done(err);
                });
        });

        it('validate max length for string parameters when patching category', (done) => {
            const newCategory = {
                "name": `${randomstring.generate(101)}`,
                "id": `${randomstring.generate(101)}`
            };
            chai.request(config.url)
                .patch(`/categories/${testCategory.id}`)
                .send(newCategory)
                .end( (err,res) => {
                    assert.equal(res.statusCode, 400);
                    let expectedErrors = [
                        "'name' should NOT be longer than 100 characters",
                        "'type' should NOT be longer than 100 characters"
                    ];
                    expect(res.body.errors).to.have.members(expectedErrors);
                    //restoring the original values as the test is failing
                    chai.request(config.url)
                        .put(`/categories/${testCategory.id}\``)
                        .send(testCategory)
                        .end()
                    done(err);
                });
        });

    });

    describe('DELETE:', () => {

        it('delete category with non-existing id', (done) => {
            chai.request(config.url)
                .delete(`/categories/-1`)
                .end( (err,res) => {
                    assert.equal(res.statusCode,404);
                    assert.equal(res.body.message, "No record found for id '-1'");
                    done(err);
                });

        });

        it('delete category with existing id', (done) => {
            const newCategory = {
                "id":"kabirol654654",
                "name":"Kabirol del Bo"
            };
            chai.request(config.url)
                .post('/categories')
                .send(newCategory)
                .end( (err,res) => {
                    assert.equal(res.statusCode,201);
                    chai.request(config.url)
                        .delete(`/categories/${newCategory.id}`)
                        .end( (err,res) => {
                            assert.equal(res.statusCode, 200);
                            expect(res.body).to.deep.include(newCategory);
                            done(err);
                        });
                });

        });

    });

});

const testCategory = {
    "id":"kabi13131313",
    "name":"Kabi Gifts",
};
