Corsèt
======

This is a Twitter CORS proxy server.
It is ready to be deployed in Heroku.

It currently does not handle streaming APIs.

Features:
- Authenticate with Twitter
- Relay Twitter API appending CORS
- Issue a token for Firebase

Install
-------

```
npm install
# edit config properly
vim ./src/config.coffee
cake build
git commit -a

# deploy on heroku
heroku create
heroku addons:add redistogo:nano
heroku config:set URL=http://your-server-name.herokuapp.com
git push heroku master
```

How to use
----------

Before calling Twitter APIs, It is necessary to authenticate clients via Corsèt.
the url for authentication is "/auth".

After the authentication, clients can call APIs.
Corsèt stores client secrets and access tokens on server-side not on client-side.
Each client has session between Corsèt to be identified.
Therefore XHR calling APIs must set .withCredentials = true.
Now, you can call APIs by replacing "https://api.twitter.com" with "http://your-server-name.herokuapp.com/api".

As an option, It can provide Firebase custom auth token via "/auth/firebase".