var request = require('supertest')('localhost:8000'),
  chai = require('chai'),
  expect = chai.expect,
  setup = require('./setup'),
  teardown = require('./teardown');

var agent;
var agentObj;
var conceptSchema = {
  data: '["test","valid","yes"]',
  index: 0,
  is_active: true,
  name: '',
  pk: '',
  _selected: true
}

/*
    Following test cases related to concepts are added in this 

    1) Return a list of all concepts
  */

describe('Concepts', function () {


  before(function (done) {
    setup.login(request, function (loginAgent) {
      agentObj = loginAgent;
      agent = agentObj.header
      done();
    });
  });

  /*
   User should be able to create a new concept
   POST /api/concept
   return status code 200 OK
   Return Primary Key
   Return Status - OK
  */
  it('TestCase 1 --> Create a new concept ==> POST /api/concept and response is 200', function (done) {
    var conceptName = { name: 'testing' }
    conceptSchema.name = conceptName.name;
    var req = request.post('/api/concept')
    req.send(JSON.stringify(conceptName))
    req.set('Content-Type', 'application/JSON')
    req.set('Accept', 'application/JSON')
    req.cookies = agent;
    req.set('X-CSRFToken', agentObj.csrftoken)
    req.type('json')
      .expect(200)
      .end(function (err, res) {
        expect(res.body).to.have.property('status')
        expect(res.body.status).to.eql('OK')
        expect(res.body).to.have.property('pk')
        conceptSchema.pk = res.body.pk
        if (err) {
          return done(err);
        }
        done();
      });
  });

  /*
     GET /api/concept
     return a list of all concepts
 */
  it('TestCase 2 --> List all concepts ==> GET /api/concept and response is 200', function (done) {
    var req = request.get('/api/concept')
    req.cookies = agent;
    req.set('Content-Type', 'application/JSON')
      .expect(200)
      .end(function (err, res) {
        expect(res.body).to.be.an('array')
        if (err) {
          return done(err);
        }
        done();
      });
  });

  /*
    User should be able to list concept with primary Key 
    GET /api/concept/pk
    return the concept details
    Status code 200
    Concept name should be equal to created concept
  */

  it('TestCase 3 --> List concept by PK ==> GET /api/concept/${conceptPK} and response is 200', function (done) {
    var url = '/api/concept/' + conceptSchema.pk
    var req = request.get(url)
    req.cookies = agent;
    req.set('Content-Type', 'application/JSON')
      .expect(200)
    console.log(req)
      .end(function (err, res) {
        console.log(res.body)
        expect(res.body).to.haveOwnProperty('name')
        expect(res.body.name).to.eql(conceptSchema.name)
        expect(res.body.pk).to.eql(conceptSchema.pk)
        if (err) {
          return done(err);
        }
        done();
      })
  })

  after(function (done) {
    teardown.logout(request, agent, function (done) {

    })

    done();
  });

});

