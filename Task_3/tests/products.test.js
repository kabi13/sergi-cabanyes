let chai = require('chai');
let chaiHttp = require('chai-http');
const assert = require('chai').assert;
const expect = require('chai').expect;
const config = require('../config');
const randomstring = require("randomstring");

let testProductId = 0;

chai.use(chaiHttp);

describe('[PRODUCTS]',() => {

    before( (done) => {
        chai.request(config.url)
            .post('/products')
            .send(testProduct)
            .end( (err,res) => {
                assert.equal(res.statusCode,201);
                testProductId = res.body.id;
                done(err);
            });
    });

    after( (done) => {
        chai.request(config.url)
            .delete(`/products/${testProductId}`)
            .end( (err,res) => {
                assert.equal(res.statusCode,200);
                done(err);
            });
    });

    describe('GET:', () => {

        it('get default list of products', (done) => {
            chai.request(config.url)
                .get('/products')
                .end( (err,res) => {
                    assert.equal(res.statusCode,200);
                    assert.equal(res.body.limit, 10);
                    assert.equal(res.body.skip, 0);
                    assert.isArray(res.body.data);
                    assert.isAtMost(res.body.data.length, 10);
                    done(err);
                });
        });

        it('get list of products limit 17', (done) => {
            chai.request(config.url)
                .get('/products?$limit=17')
                .end( (err,res) => {
                    assert.equal(res.statusCode,200);
                    assert.equal(res.body.limit, 17);
                    assert.equal(res.body.skip, 0);
                    assert.isAtMost(res.body.data.length, 17);
                    done(err);
                });
        });

        it('get list of products max limit 25', (done) => {
            chai.request(config.url)
                .get('/products?$limit=53')
                .end( (err,res) => {
                    assert.equal(res.statusCode,200);
                    assert.equal(res.body.limit, 25);
                    assert.equal(res.body.skip, 0);
                    assert.isAtMost(res.body.data.length, 25);
                    done(err);
                });
        });

        it('get list of products skipping first 25', (done) => {
            chai.request(config.url)
                .get('/products?$limit=25&$skip=25')
                .end( (err,res) => {
                    assert.equal(res.statusCode,200);
                    assert.equal(res.body.limit, 25);
                    assert.equal(res.body.skip, 25);
                    assert.isAtMost(res.body.data.length, 25);
                    done(err);
                });
        });

        it('get list of products filtering by name', (done) => {
            chai.request(config.url)
                .get(`/products?name=${testProduct.name}`)
                .end( (err,res) => {
                    assert.equal(res.statusCode,200);
                    assert.isAtLeast(res.body.data.length, 1);
                    assert.equal(res.body.data[0].name,testProduct.name);
                    done(err);
                });
        });

        it('get list of products filtering by partial product name', (done) => {
            chai.request(config.url)
                .get(`/products?name[$like]=*Olot*`)
                .end( (err,res) => {
                    assert.equal(res.statusCode,200);
                    assert.isAtLeast(res.body.data.length, 1);
                    res.body.data.forEach(product => {
                        assert.ok(product.name.toLowerCase().includes('olot'))
                    });
                    done(err);
                });
        });

        it('get list of products filtering by category name', (done) => {
            chai.request(config.url)
                .get(`/products?category.name=Alkaline Batteries`)
                .end( (err,res) => {
                    assert.equal(res.statusCode,200);
                    let products = res.body.data.filter(product => {
                        let foundCategoryInProduct = product.categories.find((category) => category.name.toLowerCase() === 'alkaline batteries');
                        if (foundCategoryInProduct) return true
                    });
                    assert.equal(res.body.data.length,products.length);
                    done(err);
                });
        });

        it('get list of products sorted by price descending', (done) => {
            chai.request(config.url)
                .get(`/products?$sort[price]=0`)
                .end( (err,res) => {
                    assert.equal(res.statusCode,200);
                    let priceComparer = Number.MAX_VALUE;
                    for(i=0; i<res.body.data.length; i++){
                        if (!res.body.data[i].price) { continue; }
                        assert.isAtMost(res.body.data[i].price, priceComparer);
                        priceComparer = res.body.data[i].price;
                    }
                    done(err);
                });
        });

        it('get list of products sorted by price ascending', (done) => {
            chai.request(config.url)
                .get(`/products?$sort[price]=1`)
                .end( (err,res) => {
                    assert.equal(res.statusCode,200);
                    let priceComparer = Number.MIN_VALUE;
                    for(i=0; i<res.body.data.length; i++){
                        if (!res.body.data[i].price) { continue; }
                        assert.isAtLeast(res.body.data[i].price, priceComparer);
                        priceComparer = res.body.data[i].price;
                    }
                    done(err);
                });
        });

        it('get list of products only with name and price', (done) => {
            chai.request(config.url)
                .get(`/products?$select[]=name&$select[]=price`)
                .end( (err,res) => {
                    assert.equal(res.statusCode,200);
                    res.body.data.forEach(product => {
                        assert.equal(Object.keys(product).length, 2);
                        assert.hasAllKeys(product, ['name','price']);
                    });
                    done(err);
                });
        });

        it('get product by id', (done) => {
            chai.request(config.url)
                .get(`/products/${testProductId}`)
                .end( (err,res) => {
                    assert.equal(res.statusCode,200);
                    assert.equal(res.body.id,testProductId);
                    done(err);
                });
        });

        it('get product with wrong id', (done) => {
            chai.request(config.url)
                .get(`/products/${-1}`)
                .end( (err,res) => {
                    assert.equal(res.statusCode,404);
                    assert.equal(res.body.message,`No record found for id \'${-1}\'`);
                    done(err);
                });
        });

        it('get product selecting only the name', (done) => {
            chai.request(config.url)
                .get(`/products/${testProductId}?$select[]=name`)
                .end( (err,res) => {
                    assert.equal(res.statusCode,200);
                    assert.equal(Object.keys(res.body).length,2);
                    assert.equal(res.body.name,testProduct.name);
                    assert.equal(res.body.id,testProductId);
                    done(err);
                });
        });

    });

    describe('POST:', () => {

        it('create empty product', (done) => {
            const newProduct = {};
            chai.request(config.url)
                .post('/products')
                .send(newProduct)
                .end( (err,res) => {
                    assert.equal(res.statusCode,400);
                    let expectedErrors = [
                        "should have required property 'name'",
                        "should have required property 'type'",
                        "should have required property 'description'",
                        "should have required property 'upc'",
                        "should have required property 'model'"
                    ];
                    expect(res.body.errors).to.have.members(expectedErrors);
                    done(err);
                });
        });

        it('create product without name', (done) => {
            const newProduct = {
                "type": "Rodones",
                "upc": "987654321",
                "model": "PATATONES-BONES",
                "description": "Les bones patates d'Olot",
            };
            chai.request(config.url)
                .post('/products')
                .send(newProduct)
                .end( (err,res) => {
                    assert.equal(res.statusCode,400);
                    let expectedErrors = [
                        "should have required property 'name'"
                    ];
                    expect(res.body.errors).to.have.members(expectedErrors);
                    done(err);
                });
        });

        it('create product without type', (done) => {
            const newProduct = {
                "name": "Patatones",
                "upc": "987654321",
                "model": "PATATONES-BONES",
                "description": "Les bones patates d'Olot",
            };
            chai.request(config.url)
                .post('/products')
                .send(newProduct)
                .end( (err,res) => {
                    assert.equal(res.statusCode,400);
                    let expectedErrors = [
                        "should have required property 'type'"
                    ];
                    expect(res.body.errors).to.have.members(expectedErrors);
                    done(err);
                });
        });

        it('create product without upc', (done) => {
            const newProduct = {
                "name": "Patatones",
                "type": "Rodones",
                "model": "PATATONES-BONES",
                "description": "Les bones patates d'Olot",
            };
            chai.request(config.url)
                .post('/products')
                .send(newProduct)
                .end( (err,res) => {
                    assert.equal(res.statusCode,400);
                    let expectedErrors = [
                        "should have required property 'upc'"
                    ];
                    expect(res.body.errors).to.have.members(expectedErrors);
                    done(err);
                });
        });

        it('create product without model', (done) => {
            const newProduct = {
                "name": "Patatones",
                "type": "Rodones",
                "upc": "987654321",
                "description": "Les bones patates d'Olot",
            };
            chai.request(config.url)
                .post('/products')
                .send(newProduct)
                .end( (err,res) => {
                    assert.equal(res.statusCode,400);
                    let expectedErrors = [
                        "should have required property 'model'"
                    ];
                    expect(res.body.errors).to.have.members(expectedErrors);
                    done(err);
                });
        });

        it('create product without description', (done) => {
            const newProduct = {
                "name": "Patatones",
                "type": "Rodones",
                "upc": "987654321",
                "model": "PATATONES-BONES",
            };
            chai.request(config.url)
                .post('/products')
                .send(newProduct)
                .end( (err,res) => {
                    assert.equal(res.statusCode,400);
                    let expectedErrors = [
                        "should have required property 'description'"
                    ];
                    expect(res.body.errors).to.have.members(expectedErrors);
                    done(err);
                });
        });

        it('create product with unrecognized properties', (done) => {
            const newProduct = {
                "nothing": "null",
                "name": "Potatoes from Olot",
                "type": "HardGood",
                "price": 3.12,
                "upc": "123456789012",
                "model": "PATATES-OLOT",
                "description": "Roast potatoes with plenty of tasty meat inside",
                "manufacturer": "Cabanyes SA",
                "image": "http://deplatenplat.gastronomicament.cat/files/2013/11/patatesblog1.jpg"
            };
            chai.request(config.url)
                .post('/products')
                .send(newProduct)
                .end( (err,res) => {
                    assert.equal(res.statusCode,400);
                    let expectedErrors = [
                        "should NOT have additional properties: 'nothing'"
                    ];
                    expect(res.body.errors).to.have.members(expectedErrors);
                    done(err);
                });
        });

        it('validate type of parameters when creating product', (done) => {
            const newProduct = {
                "name": -1,
                "type": -1,
                "price": "no",
                "upc": -1,
                "model": -1,
                "description": -1,
                "manufacturer": -1,
                "image": -1
            };
            chai.request(config.url)
                .post('/products')
                .send(newProduct)
                .end( (err,res) => {
                    assert.equal(res.statusCode, 400);
                    let expectedErrors = [
                        "'name' should be string",
                        "'type' should be string",
                        "'price' should be number",
                        "'upc' should be string",
                        "'description' should be string",
                        "'manufacturer' should be string",
                        "'model' should be string",
                        "'image' should be string"
                    ];
                    expect(res.body.errors).to.have.members(expectedErrors);
                    done(err);
                });
        });

        it('validate min length for string parameters when creating product', (done) => {
            const newProduct = {
                "name": "",
                "type": "",
                "upc": "",
                "model": "",
                "description": "",
                "manufacturer": "",
                "image": "",
                "url":""
            };
            chai.request(config.url)
                .post('/products')
                .send(newProduct)
                .end( (err,res) => {
                    assert.equal(res.statusCode, 400);
                    let expectedErrors = [
                        "'name' should NOT be shorter than 1 characters",
                        "'type' should NOT be shorter than 1 characters",
                        "'upc' should NOT be shorter than 1 characters",
                        "'description' should NOT be shorter than 1 characters",
                        "'manufacturer' should NOT be shorter than 1 characters",
                        "'model' should NOT be shorter than 1 characters",
                        "'url' should NOT be shorter than 1 characters",
                        "'image' should NOT be shorter than 1 characters"
                    ];
                    expect(res.body.errors).to.have.members(expectedErrors);
                    done(err);
                });
        });

        it('validate max length for string parameters when creating product', (done) => {
            const newProduct = {
                "name": `${randomstring.generate(101)}`,
                "type": `${randomstring.generate(31)}`,
                "upc": `${randomstring.generate(16)}`,
                "model": `${randomstring.generate(26)}`,
                "description": `${randomstring.generate(101)}`,
                "manufacturer": `${randomstring.generate(51)}`,
                "image": `${randomstring.generate(501)}`,
                "url": `${randomstring.generate(501)}`
            };
            chai.request(config.url)
                .post('/products')
                .send(newProduct)
                .end( (err,res) => {
                    assert.equal(res.statusCode, 400);
                    let expectedErrors = [
                        "'name' should NOT be longer than 100 characters",
                        "'type' should NOT be longer than 30 characters",
                        "'upc' should NOT be longer than 15 characters",
                        "'description' should NOT be longer than 100 characters",
                        "'manufacturer' should NOT be longer than 50 characters",
                        "'model' should NOT be longer than 25 characters",
                        "'url' should NOT be longer than 500 characters",
                        "'image' should NOT be longer than 500 characters"
                    ];
                    expect(res.body.errors).to.have.members(expectedErrors);
                    done(err);
                });
        });

        it('validate min value for number parameters when creating product', (done) => {
            const newProduct = {
                "name": "test",
                "type": "test",
                "upc": "test",
                "model": "test",
                "description": "test",
                "price": 0.001,
                "shipping": 0.001
            };
            chai.request(config.url)
                .post('/products')
                .send(newProduct)
                .end( (err,res) => {
                    assert.equal(res.statusCode, 400);
                    let expectedErrors = [
                        "'price' should be multiple of 0.01",
                        "'shipping' should be multiple of 0.01"
                    ];
                    expect(res.body.errors).to.have.members(expectedErrors);
                    done(err);
                });
        });

        it('create product with only required fields', (done) => {
            const newProduct = {
                "name": "Patatones",
                "type": "Rodones",
                "upc": "987654321",
                "model": "PATATONES-BONES",
                "description": "Les bones patates d'Olot",
            };
            let newProductId = 0;
            chai.request(config.url)
                .post('/products')
                .send(newProduct)
                .end( (err,res) => {
                    assert.equal(res.statusCode,201);
                    newProductId = res.body.id;
                    expect(res.body).to.deep.include(newProduct);
                    chai.request(config.url)
                        .delete(`/products/${newProductId}`)
                        .end();
                    done(err);
                });
        });

        it('create product with all fields', (done) => {
            const newProduct = {
                "name": "Patatones",
                "type": "Rodones",
                "price": 10.01,
                "upc": "987654321",
                "model": "PATATONES-BONES",
                "description": "Les bones patates d'Olot",
                "manufacturer": "Can Cabanyes",
                "image": "http://www.sergi.cabanyes.com/Sergi.jpg"
            };
            let newProductId = 0;
            chai.request(config.url)
                .post('/products')
                .send(newProduct)
                .end( (err,res) => {
                    assert.equal(res.statusCode,201);
                    newProductId = res.body.id;
                    expect(res.body).to.deep.include(newProduct);
                    chai.request(config.url)
                        .delete(`/products/${newProductId}`)
                        .end();
                    done(err);
                });
        });

    });

    describe('PUT:', () => {

        it('update with empty product', (done) => {
            const newProduct = {};
            chai.request(config.url)
                .put(`/products/${testProductId}`)
                .send(newProduct)
                .end( (err,res) => {
                    assert.equal(res.statusCode,400);
                    let expectedErrors = [
                        "should have required property 'name'",
                        "should have required property 'type'",
                        "should have required property 'description'",
                        "should have required property 'upc'",
                        "should have required property 'model'"
                    ];
                    expect(res.body.errors).to.have.members(expectedErrors);
                    done(err);
                });
        });

        it('cannot update product with new id', (done) => {
            const newProduct = {
                "id": -1,
                "name": "Patatones",
                "type": "Rodones",
                "upc": "987654321",
                "model": "PATATONES-BONES",
                "description": "Les bones patates d'Olot",
            };
            chai.request(config.url)
                .put(`/products/${testProductId}`)
                .send(newProduct)
                .end( (err,res) => {
                    assert.equal(res.statusCode,400);
                    let expectedErrors = [
                        "should NOT have additional properties: 'id'"
                    ];
                    expect(res.body.errors).to.have.members(expectedErrors);
                    done(err);
                });
        });

        it('update product without name', (done) => {
            const newProduct = {
                "type": "Rodones",
                "upc": "987654321",
                "model": "PATATONES-BONES",
                "description": "Les bones patates d'Olot",
            };
            chai.request(config.url)
                .put(`/products/${testProductId}`)
                .send(newProduct)
                .end( (err,res) => {
                    assert.equal(res.statusCode,400);
                    let expectedErrors = [
                        "should have required property 'name'"
                    ];
                    expect(res.body.errors).to.have.members(expectedErrors);
                    done(err);
                });
        });

        it('update product without type', (done) => {
            const newProduct = {
                "name": "Patatones",
                "upc": "987654321",
                "model": "PATATONES-BONES",
                "description": "Les bones patates d'Olot",
            };
            chai.request(config.url)
                .put(`/products/${testProductId}`)
                .send(newProduct)
                .end( (err,res) => {
                    assert.equal(res.statusCode,400);
                    let expectedErrors = [
                        "should have required property 'type'"
                    ];
                    expect(res.body.errors).to.have.members(expectedErrors);
                    done(err);
                });
        });

        it('update product without upc', (done) => {
            const newProduct = {
                "name": "Patatones",
                "type": "Rodones",
                "model": "PATATONES-BONES",
                "description": "Les bones patates d'Olot",
            };
            chai.request(config.url)
                .put(`/products/${testProductId}`)
                .send(newProduct)
                .end( (err,res) => {
                    assert.equal(res.statusCode,400);
                    let expectedErrors = [
                        "should have required property 'upc'"
                    ];
                    expect(res.body.errors).to.have.members(expectedErrors);
                    done(err);
                });
        });

        it('update product without model', (done) => {
            const newProduct = {
                "name": "Patatones",
                "type": "Rodones",
                "upc": "987654321",
                "description": "Les bones patates d'Olot",
            };
            chai.request(config.url)
                .put(`/products/${testProductId}`)
                .send(newProduct)
                .end( (err,res) => {
                    assert.equal(res.statusCode,400);
                    let expectedErrors = [
                        "should have required property 'model'"
                    ];
                    expect(res.body.errors).to.have.members(expectedErrors);
                    done(err);
                });
        });

        it('update product without description', (done) => {
            const newProduct = {
                "name": "Patatones",
                "type": "Rodones",
                "upc": "987654321",
                "model": "PATATONES-BONES",
            };
            chai.request(config.url)
                .put(`/products/${testProductId}`)
                .send(newProduct)
                .end( (err,res) => {
                    assert.equal(res.statusCode,400);
                    let expectedErrors = [
                        "should have required property 'description'"
                    ];
                    expect(res.body.errors).to.have.members(expectedErrors);
                    done(err);
                });
        });

        it('update product with unrecognized properties', (done) => {
            const newProduct = {
                "nothing": "null",
                "name": "Patatones",
                "type": "Rodones",
                "price": 10.01,
                "upc": "987654321",
                "model": "PATATONES-BONES",
                "description": "Les bones patates d'Olot",
                "manufacturer": "Can Cabanyes",
                "image": "http://www.sergi.cabanyes.com/Sergi.jpg"
            };
            chai.request(config.url)
                .put(`/products/${testProductId}`)
                .send(newProduct)
                .end( (err,res) => {
                    assert.equal(res.statusCode,400);
                    let expectedErrors = [
                        "should NOT have additional properties: 'nothing'"
                    ];
                    expect(res.body.errors).to.have.members(expectedErrors);
                    done(err);
                });
        });

        it('validate type of parameters when updating', (done) => {
            const newProduct = {
                "name": -1,
                "type": -1,
                "price": "no",
                "upc": -1,
                "model": -1,
                "description": -1,
                "manufacturer": -1,
                "image": -1
            };
            chai.request(config.url)
                .put(`/products/${testProductId}`)
                .send(newProduct)
                .end( (err,res) => {
                    assert.equal(res.statusCode, 400);
                    let expectedErrors = [
                        "'name' should be string",
                        "'type' should be string",
                        "'price' should be number",
                        "'upc' should be string",
                        "'description' should be string",
                        "'manufacturer' should be string",
                        "'model' should be string",
                        "'image' should be string"
                    ];
                    expect(res.body.errors).to.have.members(expectedErrors);
                    done(err);
                });
        });

        it('validate min length for string parameters when updating', (done) => {
            const newProduct = {
                "name": "",
                "type": "",
                "upc": "",
                "model": "",
                "description": "",
                "manufacturer": "",
                "image": "",
                "url":""
            };
            chai.request(config.url)
                .put(`/products/${testProductId}`)
                .send(newProduct)
                .end( (err,res) => {
                    assert.equal(res.statusCode, 400);
                    let expectedErrors = [
                        "'name' should NOT be shorter than 1 characters",
                        "'type' should NOT be shorter than 1 characters",
                        "'upc' should NOT be shorter than 1 characters",
                        "'description' should NOT be shorter than 1 characters",
                        "'manufacturer' should NOT be shorter than 1 characters",
                        "'model' should NOT be shorter than 1 characters",
                        "'url' should NOT be shorter than 1 characters",
                        "'image' should NOT be shorter than 1 characters"
                    ];
                    expect(res.body.errors).to.have.members(expectedErrors);
                    done(err);
                });
        });

        it('validate max length for string parameters when updating', (done) => {
            const newProduct = {
                "name": `${randomstring.generate(101)}`,
                "type": `${randomstring.generate(31)}`,
                "upc": `${randomstring.generate(16)}`,
                "model": `${randomstring.generate(26)}`,
                "description": `${randomstring.generate(101)}`,
                "manufacturer": `${randomstring.generate(51)}`,
                "image": `${randomstring.generate(501)}`,
                "url": `${randomstring.generate(501)}`
            };
            chai.request(config.url)
                .put(`/products/${testProductId}`)
                .send(newProduct)
                .end( (err,res) => {
                    assert.equal(res.statusCode, 400);
                    let expectedErrors = [
                        "'name' should NOT be longer than 100 characters",
                        "'type' should NOT be longer than 30 characters",
                        "'upc' should NOT be longer than 15 characters",
                        "'description' should NOT be longer than 100 characters",
                        "'manufacturer' should NOT be longer than 50 characters",
                        "'model' should NOT be longer than 25 characters",
                        "'url' should NOT be longer than 500 characters",
                        "'image' should NOT be longer than 500 characters"
                    ];
                    expect(res.body.errors).to.have.members(expectedErrors);
                    done(err);
                });
        });

        it('validate min value for number parameters when updating', (done) => {
            const newProduct = {
                "name": "test",
                "type": "test",
                "upc": "test",
                "model": "test",
                "description": "test",
                "price": 0.001,
                "shipping": 0.001
            };
            chai.request(config.url)
                .put(`/products/${testProductId}`)
                .send(newProduct)
                .end( (err,res) => {
                    assert.equal(res.statusCode, 400);
                    let expectedErrors = [
                        "'price' should be multiple of 0.01",
                        "'shipping' should be multiple of 0.01"
                    ];
                    expect(res.body.errors).to.have.members(expectedErrors);
                    done(err);
                });
        });

        it('update product with only required fields', (done) => {
            const newProduct = {
                "name": "Patatones",
                "type": "Rodones",
                "upc": "987654321",
                "model": "PATATONES-BONES",
                "description": "Les bones patates d'Olot"
            };
            chai.request(config.url)
                .put(`/products/${testProductId}`)
                .send(newProduct)
                .end( (err,res) => {
                    assert.equal(res.statusCode,200);
                    expect(res.body).to.deep.include(newProduct);
                    chai.request(config.url)
                        .put(`/products/${testProductId}`)
                        .send(testProduct)
                        .end( (err,res) => {
                            done(err);
                        });
                });
        });

        it('update product with all fields', (done) => {
            const newProduct = {
                "name": "Patatones",
                "type": "Rodones",
                "price": 10.01,
                "upc": "987654321",
                "model": "PATATONES-BONES",
                "description": "Les bones patates d'Olot",
                "manufacturer": "Can Cabanyes",
                "image": "http://www.sergi.cabanyes.com/Sergi.jpg"
            };
            chai.request(config.url)
                .put(`/products/${testProductId}`)
                .send(newProduct)
                .end( (err,res) => {
                    assert.equal(res.statusCode,200);
                    expect(res.body).to.deep.include(newProduct);
                    chai.request(config.url)
                        .put(`/products/${testProductId}`)
                        .send(testProduct)
                        .end( (err,res) => {
                            done(err);
                        });
                });
        });

    });

    describe('PATCH:', () => {

        it('patch product without properties changes', (done) => {
            const newProduct = {};
            chai.request(config.url)
                .patch(`/products/${testProductId}`)
                .send(newProduct)
                .end( (err,res) => {
                    assert.equal(res.statusCode,200);
                    expect(res.body).to.deep.include(testProduct);
                    done(err);
                });
        });

        it('cannot patch product with new id', (done) => {
            const newProduct = {
                "id": -1
            };
            chai.request(config.url)
                .patch(`/products/${testProductId}`)
                .send(newProduct)
                .end( (err,res) => {
                    assert.equal(res.statusCode,400);
                    assert.equal(res.body.id, testProductId);
                    done(err);
                });
        });

        it('patch product with new name', (done) => {
            const newProduct = {
                "name": "Patatones"
            };
            chai.request(config.url)
                .patch(`/products/${testProductId}`)
                .send(newProduct)
                .end( (err,res) => {
                    assert.equal(res.statusCode,200);
                    expect(res.body).to.deep.include(newProduct);
                    chai.request(config.url)
                        .put(`/products/${testProductId}`)
                        .send(testProduct)
                        .end();
                    done();
                });
        });

        it('patch product with unrecognized properties', (done) => {
            const newProduct = {
                "nothing": "null"
            };
            chai.request(config.url)
                .patch(`/products/${testProductId}`)
                .send(newProduct)
                .end( (err,res) => {
                    assert.equal(res.statusCode,400);
                    let expectedErrors = [
                        "should NOT have additional properties: 'nothing'"
                    ];
                    expect(res.body.errors).to.have.members(expectedErrors);
                    done(err);
                });
        });

        it('validate type of parameters when patching', (done) => {
            const newProduct = {
                "name": -1,
                "type": -1,
                "upc": -1,
                "model": -1,
                "description": -1,
                "manufacturer": -1,
                "image": -1
            };
            chai.request(config.url)
                .patch(`/products/${testProductId}`)
                .send(newProduct)
                .end( (err,res) => {
                    assert.equal(res.statusCode, 400);
                    let expectedErrors = [
                        "'name' should be string",
                        "'type' should be string",
                        "'upc' should be string",
                        "'description' should be string",
                        "'manufacturer' should be string",
                        "'model' should be string",
                        "'image' should be string"
                    ];
                    expect(res.body.errors).to.have.members(expectedErrors);
                    //restoring the original values as the test is failing
                    chai.request(config.url)
                        .put(`/products/${testProductId}`)
                        .send(testProduct)
                        .end();
                    done();
                });
        });

        it('validate min length for string parameters when patching', (done) => {
            const newProduct = {
                "name": "",
                "type": "",
                "upc": "",
                "model": "",
                "description": "",
                "manufacturer": "",
                "image": "",
                "url":""
            };
            chai.request(config.url)
                .patch(`/products/${testProductId}`)
                .send(newProduct)
                .end( (err,res) => {
                    assert.equal(res.statusCode, 400);
                    let expectedErrors = [
                        "'name' should NOT be shorter than 1 characters",
                        "'type' should NOT be shorter than 1 characters",
                        "'upc' should NOT be shorter than 1 characters",
                        "'description' should NOT be shorter than 1 characters",
                        "'manufacturer' should NOT be shorter than 1 characters",
                        "'model' should NOT be shorter than 1 characters",
                        "'url' should NOT be shorter than 1 characters",
                        "'image' should NOT be shorter than 1 characters"
                    ];
                    expect(res.body.errors).to.have.members(expectedErrors);
                    //restoring the original values as the test is failing
                    chai.request(config.url)
                        .put(`/products/${testProductId}`)
                        .send(testProduct)
                        .end();
                    done();
                });
        });

        it('validate max length for string parameters when patching', (done) => {
            const newProduct = {
                "name": `${randomstring.generate(101)}`,
                "type": `${randomstring.generate(31)}`,
                "upc": `${randomstring.generate(16)}`,
                "model": `${randomstring.generate(26)}`,
                "description": `${randomstring.generate(101)}`,
                "manufacturer": `${randomstring.generate(51)}`,
                "image": `${randomstring.generate(501)}`,
                "url": `${randomstring.generate(501)}`
            };
            chai.request(config.url)
                .patch(`/products/${testProductId}`)
                .send(newProduct)
                .end( (err,res) => {
                    assert.equal(res.statusCode, 400);
                    let expectedErrors = [
                        "'name' should NOT be longer than 100 characters",
                        "'type' should NOT be longer than 30 characters",
                        "'upc' should NOT be longer than 15 characters",
                        "'description' should NOT be longer than 100 characters",
                        "'manufacturer' should NOT be longer than 50 characters",
                        "'model' should NOT be longer than 25 characters",
                        "'url' should NOT be longer than 500 characters",
                        "'image' should NOT be longer than 500 characters"
                    ];
                    expect(res.body.errors).to.have.members(expectedErrors);
                    //restoring the original values as the test is failing
                    chai.request(config.url)
                        .put(`/products/${testProductId}`)
                        .send(testProduct)
                        .end();
                    done();
                });
        });

        it('validate min value for number parameters when patching', (done) => {
            const newProduct = {
                "price": 0.001,
                "shipping": 0.001
            };
            chai.request(config.url)
                .patch(`/products/${testProductId}`)
                .send(newProduct)
                .end( (err,res) => {
                    assert.equal(res.statusCode, 400);
                    let expectedErrors = [
                        "'price' should be multiple of 0.01",
                        "'shipping' should be multiple of 0.01"
                    ];
                    expect(res.body.errors).to.have.members(expectedErrors);
                    //restoring the original values as the test is failing
                    chai.request(config.url)
                        .put(`/products/${testProductId}`)
                        .send(testProduct)
                        .end();
                    done();
                });
        });

        it('patch product with required fields', (done) => {
            const newProduct = {
                "name": "Patatones",
                "type": "Rodones",
                "upc": "987654321",
                "model": "PATATONES-BONES",
                "description": "Les bones patates d'Olot"
            };
            chai.request(config.url)
                .patch(`/products/${testProductId}`)
                .send(newProduct)
                .end( (err,res) => {
                    assert.equal(res.statusCode,200);
                    expect(res.body).to.deep.include(newProduct);
                    chai.request(config.url)
                        .put(`/products/${testProductId}`)
                        .send(testProduct)
                        .end();
                    done();
                });
        });

    });

    describe('DELETE:', () => {

        it('delete product with non-existing id', (done) => {
            chai.request(config.url)
                .delete(`/products/-1`)
                .end( (err,res) => {
                    assert.equal(res.statusCode,404);
                    assert.equal(res.body.message, "No record found for id '-1'");
                    done(err);
                });

        });

        it('delete product with existing id', (done) => {
            chai.request(config.url)
                .post('/products')
                .send(testProduct)
                .end( (err,res) => {
                    assert.equal(res.statusCode,201);
                    let newProductId = res.body.id;
                    chai.request(config.url)
                        .delete(`/products/${newProductId}`)
                        .end( (err,res) => {
                            assert.equal(res.statusCode, 200);
                            expect(res.body).to.deep.include(testProduct);
                            done(err);
                        });
                });

        });

    });

});

const testProduct = {
    "name": "Potatoes from Olot",
    "type": "HardGood",
    "price": 3.12,
    "upc": "123456789012",
    "model": "PATATES-OLOT",
    "description": "Roast potatoes with plenty of tasty meat inside",
    "manufacturer": "Cabanyes SA",
    "image": "http://deplatenplat.gastronomicament.cat/files/2013/11/patatesblog1.jpg"
};
