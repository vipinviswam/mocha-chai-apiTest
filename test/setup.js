var chai        = require('chai'),
    should      = chai.should(),
    expect      = chai.expect,
    cheerio     = require('cheerio'),
    superagent  = require('superagent'),
    agent       = superagent.agent();


    var csrfmiddlewareToken;
    var Cookies;
    var sophia = 'char=1';
    var han = 'char=2';

    function extractCsrfToken (res) {
        var token = cheerio.load(res.text);
        return token('input[name=csrfmiddlewaretoken]').val();
      }

      function toObject(arr) {
        var prop = arr.split(',')
        var obj = {}
        prop.forEach(function(yyy){
            var tup = yyy.split(':')
            obj[tup[0]] = tup[1]
        })
        return obj;
      }

      function multiReplace(str){
        var replaceChars={ "=":":" , ";":"," };
        var newStr = str.replace(/=|;/g,function(match) {return replaceChars[match];});
        return newStr;
      }

  exports.login = function(request,done){
       
        request.get('/user/login/')
             .expect(200,function(err,res){
                csrfmiddlewareToken = extractCsrfToken(res);
                Cookies = res.headers['set-cookie'].pop().split(';')[0];
                request.post('/user/login/')
                .set('X-CSRFToken', csrfmiddlewareToken)
                .set('cookie', Cookies)
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .send({
                  username: 'hr',
                  password: 'hrobotics2045'
                })
                .expect(302,function(err,res){
                    if(err){
                        console.log(err)
                    }
                    var cookie = res.headers['set-cookie'];
                    sessionid = cookie.pop().split(';')[0];
                    csrfToken = cookie.pop().split(';')[0];
                    var cookieToken = csrfToken + ';' + sessionid + ';' + sophia;
                   /* var xx = cookieToken.replace(/=/g, ':')
                    var xxx = xx.replace(/;/g, ',') */
                    var agent = toObject(multiReplace(cookieToken))
                    agent.header = cookieToken
                    done(agent);
                })
             })

   
            };
       
