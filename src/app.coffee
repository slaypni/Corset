express = require 'express'
app = express()
RedisStore = require('connect-redis')(express)
{OAuth} = require 'oauth'
config = require './config'

url = require 'url'
redisUrl = url.parse process.env.REDISTOGO_URL
redisAuth = if redisUrl.auth then redisUrl.auth.split(':')

app.use (req, res, next) ->
    res.set
        'Access-Control-Allow-Origin': config.originUrl
        'Access-Control-Allow-Credentials': true  # withCredentials of xhr must be set true
    res.set 'Access-Control-Allow-Headers', req.get 'Access-Control-Request-Headers' if req.get 'Access-Control-Request-Headers'
    res.set 'Access-Control-Allow-Method', req.get 'Access-Control-Request-Method' if req.get 'Access-Control-Request-Method'
    if req.method.toUpperCase() == 'OPTIONS'
        res.send 200
    else
        next()

app.use express.cookieParser config.sessionSecret
app.use express.session
    store: new RedisStore
        host: redisUrl.hostname
        port: redisUrl.port
        db: redisAuth?[0]
        pass: redisAuth?[1]
app.use express.bodyParser()
        
oa = new OAuth(
    'https://api.twitter.com/oauth/request_token',
    'https://api.twitter.com/oauth/access_token',
    config.oauthConsumerKey,
    config.oauthConsumerSecret,
    '1.0A',
    "#{process.env.URL}/auth/callback",
    'HMAC-SHA1'
)

app.get '/auth/callback', (req, res) ->
    oa.getOAuthAccessToken(
        req.session.oauthToken,
        req.session.oauthTokenSecret,
        req.param('oauth_verifier'),
        (error, oauthAccessToken, oauthAccessTokenSecret, results) ->
            if error
                console.log error
                res.send error.statusCode, 'An error is occured while getting OAuth access token.'
            else
                req.session.oauthAccessToken = oauthAccessToken
                req.session.oauthAccessTokenSecret = oauthAccessTokenSecret
                req.session.id = null
                res.redirect config.callbackUrl
    )

app.get '/auth', (req, res) ->
    oa.getOAuthRequestToken (error, oauthToken, oauthTokenSecret, results) ->
        if error
            console.log error
            res.send error.statusCode, 'An error is occured while getting OAuth request token.'
        else
            req.session.oauthToken = oauthToken
            req.session.oauthTokenSecret = oauthTokenSecret
            res.redirect "https://api.twitter.com/oauth/authorize?oauth_token=#{oauthToken}"

apiCallback = (req, res) ->
    return (error, data, response) ->
        res.set 'Access-Control-Expose-Headers', (header for header of response.headers).join ', '
        res.set response.headers
        if error
            res.send error.statusCode, data
        else
            res.end data

app.get /^\/api\/(.*)$/, (req, res) ->
    m = req.url.match /\/api\/(.*)$/
    oa.get(
        "https://api.twitter.com/#{m[1]}",
        req.session.oauthAccessToken,
        req.session.oauthAccessTokenSecret,
        apiCallback req, res
    )

app.post /^\/api\/(.*)$/, (req, res) ->
    if 'application/x-www-form-urlencoded' != req.get('Content-Type').trim()
        res.send 400, 'Content-Type must be application/x-www-form-urlencoded'
    else
        m = req.url.match /\/api\/(.*)$/
        oa.post(
            "https://api.twitter.com/#{m[1]}",
            req.session.oauthAccessToken,
            req.session.oauthAccessTokenSecret,
            req.body,
            null
            apiCallback req, res
        )

if config.firebaseSecret
    FirebaseTokenGenerator = require 'firebase-token-generator'
    tokenGenerator = new FirebaseTokenGenerator config.firebaseSecret
    app.get '/auth/firebase', (req, res) ->
        if req.session.id?
            res.send tokenGenerator.createToken {id: req.session.id}
        else
            oa.get(
                'https://api.twitter.com/1.1/account/verify_credentials.json',
                req.session.oauthAccessToken,
                req.session.oauthAccessTokenSecret,
                (error, data, response) ->
                    if error
                        console.log error
                        res.send error.statusCode
                    else if response.statusCode == 200
                        d = JSON.parse data
                        req.session.id = d.id
                        res.send tokenGenerator.createToken {id: d.id}
                    else
                        res.send response.statusCode
            )
        
app.get '/', (req, res) ->
    res.send 'Corsèt'
    

console.log("URL is #{process.env.URL}. Listening on #{process.env.PORT}")
app.listen process.env.PORT
