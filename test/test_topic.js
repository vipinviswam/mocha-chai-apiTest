var request = require('supertest')('localhost:8000'),
  chai = require('chai'),
  expect = chai.expect,
  setup = require('./setup'),
  teardown = require('./teardown');

var agent;
var topicId;
var agentObj;
var gambitRulePk;
var topicRule;
var rejoPK;
var speechGambit = {}
var topic = {
  pk: topicId,
  name: 'testing',
  data: '["Testing","validation","NewTesting","Newvalidation","newagain"]'
}
var rejoinderSchema = {
  data: {
    inputs: [],
    outputs: []
  },
  label: "",
  name: 'check',
  tier: 'a',
  topic: {
    name: topic.name,
    tags: [],
    is_active: true,
    pk: topicId,
    active_from: null,
    data: topic.data,
    active_until: null
  },
  type: "REJO"
}


function getgambitdata(resp) {
  bodyLength = (resp.body).length
  for (var i = 0; i < bodyLength; i++) {
    if ((resp.body[i].type) === 'REJO') {
      speechGambit.rejoName = resp.body[i].name
      speechGambit.rejoinderPK = resp.body[i].pk
    } else if ((resp.body[i].type) === 'GAMB') {
      speechGambit.gambName = resp.body[i].name
      speechGambit.gambpk = resp.body[i].pk
      var gambdata = JSON.parse(resp.body[i].data)
      var gambOutputslength = (gambdata.outputs).length
      for (var j = 0; j < gambOutputslength; j++) {
        if ((gambdata.outputs[j].texts[j]) === 'new text') {
          speechGambit.followupPK = gambdata.outputs[j].followups
        }
      }
    }
  }
}

/*
    Login to Rosetta and get CSRF token,SessionID
      returns JSON
    { csrftoken: 'xxx',
        sessionid: 'xxx',
        char: '1',
        head: 'csrftoken=xxxx;sessionid=xxxxx;char=1' }
*/
describe('Topics', function () {

  before(function (done) {
    setup.login(request, function (loginAgent) {
      agentObj = loginAgent;
      agent = agentObj.header
      done();
    });
  });

  /*
     User should be able to create a new Topic ==> POST /api/topic
      Expect response status 200
      Expect response has Primary key for Topic
    */
  it('TestCase 1 --> Create a new TOPIC ==> POST /api/topic and response status is 200', function (done) {
    var newTopic = { name: 'testing' }
    var req = request.post('/api/topic')
    req.send(JSON.stringify(newTopic))
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
        topicId = res.body.pk
        if (err) {
          return done(err)
        }
        done();
      });
  });



  /*
      User should be able to List all topics in topics tab
      get /api/topic
      topicID - get topic id from response body
      Expect response status 200
      Expect response body as Array
    */
  it('TestCase 2 --> List all TOPICS ==> GET api/topic, response status is 200 and ressponse body as array', function (done) {
    var req = request.get('/api/topic')
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
      User should be able to list one topic based on primary Key(topicID)
      GET /api/topic/pk 
      topicID - Pk for topic
      Expect response status 200
      Expect response body contain Name property
      Expect resposnse body contain PK property
      Verify name is equal to topic name
    */
  it('TestCase 3 --> List TOPIC by primary key ==> GET /api/topic/pk - topicId and response is 200', function (done) {
    var req = request.get('/api/topic/' + topicId)
    req.cookies = agent;
    req.set('Content-Type', 'application/JSON')
      .expect(200)
      .end(function (err, res) {
        expect(res.body).to.have.property('name')
        expect(res.body).to.have.property('pk')
        expect(res.body.name).to.eql(topic.name)
        if (err) {
          return done(err)
        }
        done();
      })
  });
  /*
      Update topic with new definition. 
      PUT /api/topic/{topic_pk}
      @params - topicId
  */

  it('TestCase 4 --> Update TOPIC Definition by primary key ==> PUT /api/topic/pk and response status is 200', function (done) {

    var req = request.put('/api/topic/' + topicId)
    req.send(JSON.stringify(topic))
    req.set('Content-Type', 'application/JSON')
    req.set('Accept', 'application/JSON')
    req.cookies = agent;
    req.set('X-CSRFToken', agentObj.csrftoken)
    req.type('json')
      .expect(200)
      .end(function (err, res) {
        expect(res.body).to.have.property('status')
        expect(res.body.status).to.eql('OK')
        if (err) {
          return done(err)
        }
        done();
      });
  });

  /*
      User should be able to update the topic name
      PUT /api/topic/{topic_pk}
      @params - topicId
  */

  it('TestCase 5 --> Update TOPIC Name by primary key ==> PUT /api/topic/${topicId} and response status is 200', function (done) {
    var newTopicName = {
      action: 'update_one|name',
      name: 'testing123'
    }
    topic.name = newTopicName.name;
    var req = request.put('/api/topic/' + topicId)
    req.send(JSON.stringify(newTopicName))
    req.set('Content-Type', 'application/JSON')
    req.set('Accept', 'application/JSON')
    req.cookies = agent;
    req.set('X-CSRFToken', agentObj.csrftoken)
    req.type('json')
      .expect(200)
      .end(function (err, res) {
        expect(res.body).to.have.property('status')
        expect(res.body.status).to.eql('OK')
        if (err) {
          return done(err)
        }
        done();
      });
  });

  /*
       Verify the newly added definition for topic is listed.
       GET /api/topic/{topic_pk}
       Verify response status as 200
       verify the Topic name
       Verify new deinition added to the Topic
   */
  it('Verify the  updated TOPIC by primary key ==> GET /api/topic/${topicId} and response is 200', function (done) {
    var req = request.get('/api/topic/' + topicId)
    req.cookies = agent;
    req.set('Content-Type', 'application/JSON')
      .expect(200)
      .end(function (err, res) {
        // console.log(res.body)
        expect(res.body).to.have.property('name')
        expect(res.body).to.have.property('pk')
        expect(res.body.name).to.eql(topic.name)
        expect(res.body.data).to.eql(topic.data)
        if (err) {
          return done(err)
        }
        done();
      })
  });

  /*
        Create a new Speech Gambit rule for topic  
        POST /api/topic/{topic_pk}/rule
        @params - topicId
        Resposnse {Status : "OK"} and new RULE
  */

  it('TestCase 6 --> Create a new speech Gambit RULE for TOPIC ==> POST /api/topic/${topicId}/rule by primary key and response status is 200', function (done) {

    var newGambit = {
      name: 'testing testing',
      data: '{"inputs": [], "outputs": []}',
      label: "",
      tier: 'a',
      topic: {
        name: 'testing',
        is_active: true,
        character: 1,
        active_from: null,
        data: '["Testing","validation","NewTesting","Newvalidation","newagain"]',
        id: topicId,
        active_until: null
      },
      type: 'GAMB'
    }

    var req = request.post('/api/topic/' + topicId + '/rule')
    req.send(JSON.stringify(newGambit))
    req.set('Content-Type', 'application/JSON')
    req.set('Accept', 'application/JSON')
    req.cookies = agent;
    req.set('X-CSRFToken', agentObj.csrftoken)
    req.type('json')
      .expect(200)
      .end(function (err, res) {
        expect(res.body).to.have.property('status')
        expect(res.body.status).to.eql('OK')
        expect(res.body.rule).to.have.property('name')
        expect(res.body.rule).to.have.property('pk')
        expect(res.body.rule.type).to.eql('GAMB')
        gambitRulePk = res.body.rule.pk
        if (err) {
          return done(err)
        }
        done();
      });
  });

  /*
      GET /api/topic/{topic_pk}/rule
      return list of all Speech Gambit rules in the topic
      Expect status as 200
      Verify the new rule is created and can be displayed

  */

  it('Verify speech Gambit rule is created ==> GET /api/topic/${topicId}/rule and response is 200', function (done) {
    var req = request.get('/api/topic/' + topicId + '/rule')
    req.cookies = agent;
    req.set('Content-Type', 'application/JSON')
      .expect(200)
      .end(function (err, res) {
        expect(res.body[0]).to.have.property('name')
        expect(res.body[0]).to.have.property('pk')
        expect(res.body[0].type).to.eql('GAMB')
        topicRule = res.body[0]
        if (err) {
          return done(err)
        }
        done();
      });
  })

  /*
         PUT /api/rule/{gambit rule PK}
         return list of all Speech Gambit rules in the topic
         Expect status as 200
         Response as {Status : "OK"}

     */

  it('TestCase 7 --> PUT RULE by primary key ==> PUT /api/rule/gambitRulePk and response is 200', function (done) {
    var data = JSON.parse(topicRule.data);
    // topicRule.data = '{"inputs": [], "outputs": [{"followups": [], "texts": ["new text"]}]}'
    (data.outputs).push({ "followups": [], "texts": ["new text"] })
    topicRule.data = JSON.stringify(data)
    var req = request.put('/api/rule/' + gambitRulePk)
    req.send(JSON.stringify(topicRule))
    req.set('Content-Type', 'application/JSON')
    req.set('Accept', 'application/JSON')
    req.cookies = agent;
    req.set('X-CSRFToken', agentObj.csrftoken)
    req.type('json')
      .expect(200)
      .end(function (err, res) {
        expect(res.body).to.have.property('status')
        expect(res.body.status).to.eql('OK')
        if (err) {
          return done(err)
        }
        done();
      });
  })

  /*
          GET /api/topic/{topic_pk}/rule
          return list of all Speech Gambit rules in the topic
          Expect status as 200
          Verify the new Gambit rule is added and can be displayed

      */

  it('Verify the new Gambit rule ==> GET /api/topic/${topicID}/rule and response is 200', function (done) {
    var req = request.get('/api/topic/' + topicId + '/rule')
    req.cookies = agent;
    req.set('Content-Type', 'application/JSON')
      .expect(200)
      .end(function (err, res) {
        expect(res.body[0]).to.have.property('name')
        expect(res.body[0]).to.have.property('pk')
        expect(res.body[0].type).to.eql('GAMB')
        var data = JSON.parse(res.body[0].data)
        var reqData = JSON.parse(topicRule.data)
        expect(data.outputs[0].texts).to.eql(reqData.outputs[0].texts)
        topicRule = res.body[0]
        if (err) {
          return done(err)
        }
        done();
      });
  })

  /*
         POST /api/topic/{TopiCID}/rule
         ADD rejoinder to Speech Gambit rule
         Expect status as 200
         Response as {Status : "OK"} and Rule
         Its 2 step process
             1) Create a rejoinder ( POST)
             2) Add the rejoinder PK to Gambit rule Followups array (PUT)

     */

  it('TestCase 8 --> Add Rejoinder to Gambit by primary key ==> POST /api/topic/${topicID}/rule and response is 200', function (done) {
    var req = request.post('/api/topic/' + topicId + '/rule')
    req.send(JSON.stringify(rejoinderSchema))
    req.set('Content-Type', 'application/JSON')
    req.set('Accept', 'application/JSON')
    req.cookies = agent;
    req.set('X-CSRFToken', agentObj.csrftoken)
    req.type('json')
      .expect(200)
      .end(function (err, res) {
        expect(res.body).to.have.property('status')
        expect(res.body.status).to.eql('OK')
        expect(res.body.rule.name).to.eql(rejoinderSchema.name)
        expect(res.body.rule.type).to.eql(rejoinderSchema.type)
        // expect(res.body.rule.topic).to.eql(rejoinderSchema.topic.pk)
        rejoPK = res.body.rule.pk
        if (err) {
          return done(err)
        }
        done();
      });
  })

  it('Add Rejoinder key to Gambit rule by primary key ==> PUT /api/rule/${gambitRulePk}/rule and response is 200', function (done) {
    var data = JSON.parse(topicRule.data)
    data.outputs[0].followups.push(rejoPK)
    topicRule.data = JSON.stringify(data)
    var req = request.put('/api/rule/' + gambitRulePk)
    req.send(JSON.stringify(topicRule))
    req.set('Content-Type', 'application/JSON')
    req.set('Accept', 'application/JSON')
    req.cookies = agent;
    req.set('X-CSRFToken', agentObj.csrftoken)
    req.type('json')
      .expect(200)
      .end(function (err, res) {
        expect(res.body).to.have.property('status')
        expect(res.body.status).to.eql('OK')
        // console.log(topicRule)
        if (err) {
          return done(err)
        }
        done();
      });
  })
  /*
      GET /api/topic/{topic_pk}/rule
      return list of all Speech Gambit rules in the topic
      Expect status as 200
      Verify the new Gambit rule is added and can be displayed

  */

  it('Verify Rejoinder is added to Speech Gambit by primary key ==> GET /api/topic/topicID/rule - topicId and response is 200', function (done) {
    var req = request.get('/api/topic/' + topicId + '/rule')
    req.cookies = agent;
    req.set('Content-Type', 'application/JSON')
      .expect(200)
      .end(function (err, res) {
        getgambitdata(res)
        expect(speechGambit.rejoName).to.eql(rejoinderSchema.name)
        expect(speechGambit.gambName).to.eql(topicRule.name)
        var data = JSON.parse(topicRule.data)
        expect(speechGambit.followupPK[0]).to.eql(data.outputs[0].followups[0])
        // console.log(speechGambit)
        if (err) {
          return done(err)
        }
        done();
      })
  });

  /*
        DELETE /api/rule/rejoindersPK
        Delete Speech Gambit rejoinders in  topic
        Expect status as 200
        Its 2 step process
          1) Delete the Rejoinder rule
          2) Update Speech Gambit rule by removing rejoinder PK from followups array.
    */

  it('TestCase 9 --> Delete Rejoinder for Gambit by primary key ==> Delete /api/rule/${rejoPK}/rule and response is 200', function (done) {
    var req = request.delete('/api/rule/' + rejoPK)
    req.set('Content-Type', 'application/JSON')
    req.set('Accept', 'application/JSON')
    req.cookies = agent;
    req.set('X-CSRFToken', agentObj.csrftoken)
      .expect(200)
      .end(function (err, res) {
        expect(res.body).to.have.property('status')
        expect(res.body.status).to.eql('OK')
        if (err) {
          return done(err)
        }
        done();
      });
  })
  it('Remove rejoinder PK from Gambit speech RULE by primary key ==> PUT /api/rule/${gambitRulePk}/rule and response is 200', function (done) {
    var data = JSON.parse(topicRule.data)
    var length = (data.outputs[0].followups).length
    for (var i = 0; i < length; i++) {
      if ((data.outputs[0].followups[i]) === rejoPK) {
        (data.outputs[0].followups).splice(i, 1);
      }
    }
    topicRule.data = JSON.stringify(data)
    var req = request.put('/api/rule/' + gambitRulePk)
    req.send(JSON.stringify(topicRule))
    req.set('Content-Type', 'application/JSON')
    req.set('Accept', 'application/JSON')
    req.cookies = agent;
    req.set('X-CSRFToken', agentObj.csrftoken)
    req.type('json')
      .expect(200)
      .end(function (err, res) {
        expect(res.body).to.have.property('status')
        expect(res.body.status).to.eql('OK')
        if (err) {
          return done(err)
        }
        done();
      });
  })

  /*
      PUT /api/rule/gambitRulePk
      Delete Speech Gambit Text in  tTpic
      Expect status as 200
      
  */

  it('TestCase 10 --> Delete Gambit speech Text by primary key ==> PUT /api/rule/${gambitRulePk}/rule and response is 200', function (done) {
    var data = JSON.parse(topicRule.data)
    var length = (data.outputs[0].texts).length
    for (var i = 0; i < length; i++) {
      if ((data.outputs[0].texts[i]) === 'new text') {
        (data.outputs[0].texts).splice(i, 1);
      }
    }
    topicRule.data = JSON.stringify(data)
    var req = request.put('/api/rule/' + gambitRulePk)
    req.send(JSON.stringify(topicRule))
    req.set('Content-Type', 'application/JSON')
    req.set('Accept', 'application/JSON')
    req.cookies = agent;
    req.set('X-CSRFToken', agentObj.csrftoken)
    req.type('json')
      .expect(200)
      .end(function (err, res) {
        expect(res.body).to.have.property('status')
        expect(res.body.status).to.eql('OK')
        if (err) {
          return done(err)
        }
        done();
      });
  })

  /*
        DELETE /api/rule/gambitRulePk
        Delete Speech Gambit rule in  topic
        Expect status as 200
        
    */

  it('TestCase 11 --> Delete Gambit Rule by primary key ==> Delete /api/rule/${gambitRulePk} and response is 200', function (done) {
    var req = request.delete('/api/rule/' + gambitRulePk)
    req.set('Content-Type', 'application/JSON')
    req.set('Accept', 'application/JSON')
    req.cookies = agent;
    req.set('X-CSRFToken', agentObj.csrftoken)
      .expect(200)
      .end(function (err, res) {
        expect(res.body).to.have.property('status')
        expect(res.body.status).to.eql('OK')
        if (err) {
          return done(err)
        }
        done();
      });
  })

  /*
        DELETE /api/rule/topicId
        Delete Topic
        Expect status as 200
        
    */

  it('TestCase 12 --> Delete Topic by primary key ==> Delete /api/topic/${topicID} and response is 200', function (done) {
    var req = request.delete('/api/topic/' + topicId)
    req.set('Content-Type', 'application/JSON')
    req.set('Accept', 'application/JSON')
    req.cookies = agent;
    req.set('X-CSRFToken', agentObj.csrftoken)
      .expect(200)
      .end(function (err, res) {
        expect(res.body).to.have.property('status')
        expect(res.body.status).to.eql('OK')
        if (err) {
          return done(err)
        }
        done();
      });
  })

  after(function (done) {
    teardown.logout(request, agent, function (done) {

    })

    done();
  });
})
