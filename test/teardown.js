var chai        = require('chai'),
    should      = chai.should(),
    expect      = chai.expect,
    cheerio     = require('cheerio'),
    superagent  = require('superagent'),
    agent       = superagent.agent();



   exports.logout = function(request,agent,done){

          var req = request.get('/user/logout/')
                    req.cookies = agent;
                    req.set('Accept','application/json')
                    .expect(302)
                    .end(function(err){
                        if(err){
                            return done(err)
                        }
                        done();
                    })
                };