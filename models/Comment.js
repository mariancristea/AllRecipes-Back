var mongoose = require('mongoose')

var CommentSchema = new mongoose.Schema({
    body:String,
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    recipe: { type: mongoose.Schema.Types.ObjectId, ref: 'Article' }
}, {timestamps: true});

CommentSchema.methods.toJSONFor = function(user){
    return {
        id: this._id,
        body: this.body,
        author: this.author.toProfileJSONFor(user)
    };
};

mongoose.model('Comment', CommentSchema)