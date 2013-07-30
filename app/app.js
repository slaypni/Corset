// Generated by CoffeeScript 1.6.3
(function() {
  var FirebaseTokenGenerator, OAuth, RedisStore, apiCallback, app, config, express, oa, redisAuth, redisUrl, tokenGenerator, url;

  express = require('express');

  app = express();

  RedisStore = require('connect-redis')(express);

  OAuth = require('oauth').OAuth;

  config = require('./config');

  url = require('url');

  redisUrl = url.parse(process.env.REDISTOGO_URL);

  redisAuth = redisUrl.auth ? redisUrl.auth.split(':') : void 0;

  app.use(express.cookieParser(config.sessionSecret));

  app.use(express.session({
    store: new RedisStore({
      host: redisUrl.hostname,
      port: redisUrl.port,
      db: redisAuth != null ? redisAuth[0] : void 0,
      pass: redisAuth != null ? redisAuth[1] : void 0
    })
  }));

  app.use(function(req, res, next) {
    res.set({
      'Access-Control-Allow-Origin': config.originUrl,
      'Access-Control-Allow-Credentials': true
    });
    if (req.get('Access-Control-Request-Headers')) {
      res.set('Access-Control-Allow-Headers', req.get('Access-Control-Request-Headers'));
    }
    if (req.get('Access-Control-Request-Method')) {
      res.set('Access-Control-Allow-Method', req.get('Access-Control-Request-Method'));
    }
    if (req.method.toUpperCase() === 'OPTIONS') {
      return res.send(200);
    } else {
      return next();
    }
  });

  app.use(express.bodyParser());

  oa = new OAuth('https://api.twitter.com/oauth/request_token', 'https://api.twitter.com/oauth/access_token', config.oauthConsumerKey, config.oauthConsumerSecret, '1.0A', "" + process.env.URL + "/auth/callback", 'HMAC-SHA1');

  app.get('/auth/callback', function(req, res) {
    return oa.getOAuthAccessToken(req.session.oauthToken, req.session.oauthTokenSecret, req.param('oauth_verifier'), function(error, oauthAccessToken, oauthAccessTokenSecret, results) {
      if (error) {
        console.log(error);
        return res.send(error.statusCode, 'An error is occured while getting OAuth access token.');
      } else {
        req.session.oauthAccessToken = oauthAccessToken;
        req.session.oauthAccessTokenSecret = oauthAccessTokenSecret;
        return res.redirect(config.callbackUrl);
      }
    });
  });

  app.get('/auth', function(req, res) {
    return oa.getOAuthRequestToken(function(error, oauthToken, oauthTokenSecret, results) {
      if (error) {
        console.log(error);
        return res.send(error.statusCode, 'An error is occured while getting OAuth request token.');
      } else {
        req.session.oauthToken = oauthToken;
        req.session.oauthTokenSecret = oauthTokenSecret;
        return res.redirect("https://api.twitter.com/oauth/authorize?oauth_token=" + oauthToken);
      }
    });
  });

  apiCallback = function(req, res) {
    return function(error, data, response) {
      if (error) {
        console.log(error.statusCode);
        return res.send(error.statusCode, data);
      } else {
        res.set(response.headers);
        return res.end(data);
      }
    };
  };

  app.get(/^\/api\/(.*)$/, function(req, res) {
    return oa.get("https://api.twitter.com/" + req.params[0], req.session.oauthAccessToken, req.session.oauthAccessTokenSecret, apiCallback(req, res));
  });

  app.post(/^\/api\/(.*)$/, function(req, res) {
    if ('application/x-www-form-urlencoded' !== req.get('Content-Type').trim()) {
      return res.send(400, 'Content-Type must be application/x-www-form-urlencoded');
    } else {
      return oa.post("https://api.twitter.com/" + req.params[0], req.session.oauthAccessToken, req.session.oauthAccessTokenSecret, req.body, null, apiCallback(req, res));
    }
  });

  if (config.firebaseSecret) {
    FirebaseTokenGenerator = require('firebase-token-generator');
    tokenGenerator = new FirebaseTokenGenerator(config.firebaseSecret);
    app.get('/auth/firebase', function(req, res) {
      return oa.get('https://api.twitter.com/1.1/account/verify_credentials.json', req.session.oauthAccessToken, req.session.oauthAccessTokenSecret, function(error, data, response) {
        var d, token;
        if (error) {
          console.log(error);
          return res.send(error.statusCode);
        } else if (response.statusCode === 200) {
          d = JSON.parse(data);
          token = tokenGenerator.createToken({
            id: d.id
          });
          return res.send(token);
        } else {
          return res.send(response.statusCode);
        }
      });
    });
  }

  app.get('/', function(req, res) {
    return res.send('Corsèt');
  });

  console.log("URL is " + process.env.URL + ". Listening on " + process.env.PORT);

  app.listen(process.env.PORT);

}).call(this);
