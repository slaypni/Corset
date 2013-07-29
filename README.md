Corsèt
======

Description
-----------

This is a Twitter CORS proxy server.
It is ready to be deployed in Heroku.

It currently does not handle streaming APIs.

features:
  Authenticate with Twitter
  Relay Twitter API appending CORS
  Issue a token for Firebase

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
git heroku push master
```
