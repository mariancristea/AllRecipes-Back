var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');
var crypto = require('crypto');
var jwt = require('jsonwebtoken');
var secret = require('../config').secret;

var Schema = mongoose.Schema;
var UserSchema = new Schema({
  username: {
    type: String, 
    unique: false, 
    lowercase: true, 
    required: [true, "can't be"], 
    index: false
  },
  email: {
    type: String, unique: true, 
    lowercase: true, 
    required: [true, "can't be"], 
    match: [/\S+@\S+\.\S+/, 'is invalid'],
    index: true
  },
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Recipe'}],
  image: String,
  hash: String,
  salt: String,
      
  google: {
    googleId : { type : String },
    email : {
      type : String,
      lowercase: true
    }
  },
  facebook: {
    id : { type : String },
    email : {
      type : String,
      lowercase: true
    }
  }
}, {timestamps: true});

UserSchema.plugin(uniqueValidator, {message: 'This email is already in use.'});

UserSchema.methods.validPassword = function(password) {
  var hash = crypto.pbkdf2Sync(password.toString(), this.salt, 10000, 512, 'sha512').toString('hex');
  return this.hash === hash;
};

UserSchema.methods.setPassword = function(password){
  this.salt = crypto.randomBytes(16).toString('hex');
  this.hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
};
UserSchema.methods.generateJWT = function() {
  var today = new Date();
  var exp = new Date(today);
  exp.setDate(today.getDate() + 60);

  return jwt.sign({
    id: this._id,
    username: this.username,
    exp: parseInt(exp.getTime() / 1000)
  }
  , secret);
};

UserSchema.methods.toAuthJWT = function() {
  return {
    username: this.username,
    email: this.email,
    token: this.generateJWT(),
    image: this.image || 'https://static.productionready.io/images/smiley-cyrus.jpg'
  };
};

UserSchema.methods.favorite = function(id) {
  this.favorites.push(id);

  return this.save();
}

UserSchema.methods.unfavorite = function(id)  {
  this.favorites.remove(id);
  return this.save();
}

UserSchema.methods.isFavorite = function(id) {
  return this.favorites.some(function(favoriteId){
    return favoriteId.toString() === id.toString();
  });
}

UserSchema.methods.toProfileJSONFor = function()  {
  return {
    username: this.username,
    bio: this.bio,
    image: this.image || 'https://static.productionready.io/images/smiley-cyrus.jpg',
  };
};

module.exports = mongoose.model('User', UserSchema);