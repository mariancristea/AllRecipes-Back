var mongoose = require('mongoose');
var router = require('express').Router();
var passport = require('passport');
var User = require('../../models/User')
var auth = require('../auth');
require('../../models/Recipe')
var r= mongoose.model('Recipe');
router.get('/',function(req,res,next)
{
  res.send("gg");
});

// SignUP LOCAL
router.post('/users', function(req, res, next){
    var user = new User();
    user.username = req.body.user.username;
    user.email = req.body.user.email;
    user.setPassword(req.body.user.password);

    user.save().then(function() {
        return res.json({user: user.toAuthJWT()});
    }).catch(next);
});

// LOG IN LOCAL
router.post('/users/login', function(req, res, next){
    if(!req.body.user.email){
      return res.status(422).json({errors: {email: "can't be blank"}});
    }
  
    if(!req.body.user.password){
      return res.status(422).json({errors: {password: "can't be blank"}});
    }
  
    passport.authenticate('local', {session: false}, function(err, user, info){
      if(err){ return next(err); }
  
      if(user){
        user.token = user.generateJWT();
        return res.json({user: user.toAuthJWT()});
      } else {
        return res.status(422).json(info);
      }
    })(req, res, next);
  });

  router.get('/users/facebook', passport.authenticate('facebook', {session: false}, {
    scope : ['email']
  }));

  router.get('/users/facebook/redirect', function (req, res, next) {
    passport.authenticate('facebook', function(err, user, info) {
      if (err) { return next(err); }
      req.logIn(user, function(err) {
        if (err) { return next(err); }

      var responseHTML = '<html><head><title>Main</title></head><body></body><script>res = %value%; window.opener.postMessage(res, "*");window.close();</script></html>'
        responseHTML = responseHTML.replace('%value%', JSON.stringify(
        user.toAuthJWT()
    ));
    res.status(200).send(responseHTML);
      });
    })(req, res, next);

});


router.get('/users/google', passport.authenticate('facebook', { scope : ['public_profile', 'email'] }));

// handle the callback after facebook has authenticated the user
router.get('/users/google/redirect',
    passport.authenticate('google', {
        successRedirect : '/profile',
        failureRedirect : '/'
    }),(req,res)=>{
    });

router.get('/logout',function(req, res){
  console.log('logout');
  req.logout();
  return res.json({user: 'asd'});
  //return res.redirect('http://localhost:4200/register',);
});

function loggedIn(req, res, next) {
  
  if (req.user) {
      next();
  } else {
      res.redirect('http://localhost:4200/');
  }
}

  router.get('/user', auth.required, function(req, res, next){
    User.findById(req.payload.id).then(function(user){
      if(!user){ return res.sendStatus(401); }
  
      return res.json({user: user.toAuthJWT()});
    }).catch(next);
  });

  router.put('/user', auth.required, function(req, res, next){
  User.findById(req.payload.id).then(function(user){
    if(!user){ return res.sendStatus(401); }

    // only update fields that were actually passed...
    if(typeof req.body.user.username !== 'undefined'){
      user.username = req.body.user.username;
    }
    if(typeof req.body.user.email !== 'undefined'){
      user.email = req.body.user.email;
    }
    if(typeof req.body.user.bio !== 'undefined'){
      user.bio = req.body.user.bio;
    }
    if(typeof req.body.user.image !== 'undefined'){
      user.image = req.body.user.image;
    }
    if(typeof req.body.user.password !== 'undefined'){
      user.setPassword(req.body.user.password);
    }

    return user.save().then(function(){
      return res.json({user: user.toAuthJWT()});
    });
  }).catch(next);
});




module.exports = router;