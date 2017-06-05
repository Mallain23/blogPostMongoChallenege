const mongoose = require('mongoose');

const blogPostSchema = mongoose.Schema({

    title: {type:  String, required: true},
    author: {
      firstName: String,
      lastName: String
    },
    content: String

});

blogPostSchema.virtual('authorName').get(function() {
  return `${this.author.firstName} ${this.author.lastName}`.trim();
});

blogPostSchema.methods.apiRepr = function() {
  return {
    id: this._id,
    author: this.authorName,
    content: this.content,
    title: this.title,
    created: this.created
  };
}

const BlogPost = mongoose.model('Blogs', blogPostSchema);

module.exports = {BlogPost};
