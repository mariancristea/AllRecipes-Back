var router = require('express').Router();
var mongoose = require('mongoose');
var User = mongoose.model('User');
require('../../models/Recipe')
var Recipe = mongoose.model('Recipe');
var auth = require('../auth');
require('../../models/Comment');
var Comment = mongoose.model('Comment');


router.param('recipe', function(req, res, next, slug)  {
    Recipe.findOne({ slug: slug})
        .populate('author')
        .then(function (recipe) {
            if(!recipe) { return res.sendStatus(404); }
            req.recipe = recipe;
            return next();
        }).catch(next);
});

router.get('/', auth.optional, function(req, res, next) {
    var query = {};
    var limit = 20;
    var offset = 0;
    if(typeof req.query.search !== 'undefined'){
        query.title={'$regex': '^'+req.query.search, '$options': "i"};
    }
    
    if(typeof req.query.limit !== 'undefined'){
        limit = req.query.limit;
    }
    
    if(typeof req.query.offset !== 'undefined'){
         offset = req.query.offset;
    }
    if( typeof req.query.tag !== 'undefined' ){
        query.tagList = { "$in": req.query.tag} 
    }
      //req.query.tag = '';
    Promise.all([
        req.query.author ? User.findOne({username: req.query.author}) : null,
        req.query.favorited ? User.findOne({username: req.query.favorited}) : null
    ]).then(function(results) {
        var author = results[0];
        var favoriter = results[1];

        if(author){
            query.author = {$in: author._id};
        }
        if(favoriter){
            query._id = {$in: favoriter.favorites}
        }else if(req.query.favorited){
            query._id ={$in: []}
        }
        console.log('a',req.query.underTime);
        var queryTime = 500;
        if(req.query.underTime !== undefined){
            queryTime = req.query.underTime;
        }

        return Promise.all([
            Recipe.find({$and: [query]})
                .where('time').lt(queryTime)
                .limit(Number(limit))
                .skip(Number(offset))
                .sort({createdAt: 'desc'})
                .populate('author')
                .exec(),
            Recipe.count(query).exec(),
            req.payload ? User.findById(req.payload.id) : null
        ]).then(function(results) {
            var recipes = results[0];
            var recipesCount = results[1];
            var user = results[2];
            return res.json({
                recipes: recipes.map(function(recipe){
                    return recipe.toJSONFor(user);
                }),
                recipesCount: recipesCount
            });
        });
    }).catch(next);
});

router.post('/', auth.required, function(req, res, next) {
    User.findById(req.payload.id).then(function(user){
        if(!user)   {   return res.sendStatus(401)  };
        var recipe = new Recipe(req.body.recipe);
        recipe.author = user;
        return recipe.save().then(function(){
            return res;
        })
    }).catch(next);
});

router.get('/:recipe', auth.optional, function(req, res, next) {
    Promise.all([
        req.payload ? User.findById(req.payload.id) : null,
        req.recipe.populate('author').execPopulate()
    ]).then(function(results){
        return res.json( {recipe: req.recipe.toJSONFor(results[0])} );
    })
})

router.post('/:recipe/favorites', auth.optional, function(req, res, next) {

    User.findById(req.payload.id).then(function(user){
        if(!user) { return res.sendStatus(401); }

        return user.favorite(req.recipe._id).then(function(){
            return req.recipe.updateFavoriteCount().then(function(recipe){
                return res.json({recipe: recipe.toJSONFor(user)});
            });
        });
    })
})

router.delete('/:recipe/favorites', auth.optional, function(req, res, next) {
    User.findById(req.payload.id).then(function(user){
        if(!user) { return res.sendStatus(401); }

        return user.unfavorite(req.recipe._id).then(function(){
            return req.recipe.updateFavoriteCount().then(function(recipe){
                return res.json( { recipe: recipe.toJSONFor(user)} );
            });
        });
    }).catch(next);
});

router.get('/:recipe/comments', auth.optional, function(req, res, next){
    Promise.all([
        req.payload ? User.findById(req.payload.id) : null,
        req.recipe.populate({
            path: 'comments',
            populate: { path: 'author' },
            options: { sort: {createdAt: 'desc'} }
        }).execPopulate()]
    ).then(function(results) {
        return res.json({ comments: req.recipe.comments.map(function(comment){
            return comment.toJSONFor(results[0]);
        })})
    })
})

router.post('/:recipe/comments', auth.required, function(req, res, next) {
    User.findById(req.payload.id).then(function(user){
        if(!user) { return res.sendStatus(401); }
        
        var comment = new Comment(req.body.comment);
        comment.recipe = req.article;
        comment.author = user;

        return comment.save().then(function(){
            req.recipe.comments.push(comment);

            return req.recipe.save().then(function(recipe) {
                res.json({comment: comment.toJSONFor(user)});
            });
        });
    }).catch(next);
})



module.exports = router;