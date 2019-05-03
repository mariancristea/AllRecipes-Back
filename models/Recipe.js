var mongoose = require('mongoose');
var slug = require('slug');
var uniqueValidator = require('mongoose-unique-validator');
var User = mongoose.model('User');

var Schema = mongoose.Schema;
var RecipeSchema = new Schema({
    slug: {type: String, lowercase: true, unique: true},
    title: { type: String, text: true },
    description: String,
    body: String,
    image: String,
    difficulty: String,
    time: Number,
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment'}],
    favoritesCount: {type: Number, default: 0},
    tagList: [{ type: String}],
    ingredients: [{ type: String}],
    steps: [{ type: String}],
    author: {type: mongoose.Schema.Types.ObjectId, ref: 'User'}
}, {timestamps: true});

RecipeSchema.plugin(uniqueValidator, {message: 'This recipe is already in use.'});

RecipeSchema.pre('validate', function (next) {
    if (!this.slug) {

        this.slug = slug(this.title) + '-' + (Math.random() * Math.pow(36, 6) | 0).toString(36);
    }
    next();
})

RecipeSchema.methods.updateFavoriteCount = function()   {
    var recipe = this;
    return User.count({favorites: {$in: [recipe._id]}}).then(function(count)  {
        recipe.favoritesCount = count;
        return recipe.save();
    });
}

RecipeSchema.methods.toJSONFor = function(user) {
    return {
        slug: this.slug,
        title: this.title,
        image: this.image,
        time: this.time,
        difficulty: this.difficulty,
        description: this.description,
        body: this.body,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
        tagList: this.tagList,
        steps: this.steps,
        ingredients: this.ingredients,
        favorited: user ? user.isFavorite(this._id) : false,
        favoritesCount: this.favoritesCount,
        author: this.author.toProfileJSONFor()
    }
}


module.exports = mongoose.model('Recipe', RecipeSchema);