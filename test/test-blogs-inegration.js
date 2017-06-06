const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');

// this makes the should syntax available throughout
// this module
const should = chai.should();

const {BlogPost} = require('../models');
const {app, runServer, closeServer} = require('../server');
const {TEST_DATABASE_URL} = require('../config');

chai.use(chaiHttp);

const seedBlogData = () => {
  console.info('seeding data')
  const seedData = []

  for (let i = 1; i <= 10; i++) {
      seedData.push(generateBlogData())
  }

  return BlogPost.insertMany(seedData)
}

const generateBlogData = () => {

    return {
      title: faker.lorem.sentence(),
      content: faker.lorem.sentence(),
      author: {
        firstName: faker.name.firstName(),
        lastName: faker.name.lastName()
      }
    }
};

const tearDownDb = () => {
    console.warn('deleting database')
    return mongoose.connection.dropDatabase();
}

describe('Blog Resource API',  function() {

    before(function() {
        return (runServer(TEST_DATABASE_URL))
      });

    beforeEach(function() {
        return seedBlogData()
    });

    afterEach(function() {
        return tearDownDb()
    })

    after(function() {
        return closeServer();
    })

    describe('GET endpoint', function() {

        it('should return entire database on get request', function() {
            let res
            return chai.request(app)
            .get('/blogdata')
            .then(function(_res) {
                res = _res
                res.should.have.status(200)
                res.body.should.have.length.of.at.least(1);
                return BlogPost.count()
            })
            .then(function(count) {
                res.body.should.have.length(count);
            })
        })

        it('should return blogs with right fields', function() {
            let resBlog

            return chai.request(app)
            .get('/blogdata')
            .then(function(res) {
                res.should.have.status(200)
                res.should.be.json;
                res.body.should.be.a('array');
                res.body.should.have.length.of.at.least(1)

                res.body.forEach(post => {
                  post.should.be.a('object')
                  post.should.include.keys('title', 'author', 'content', 'id')
                })
                resBlog = res.body[0]
                return BlogPost.findById(resBlog.id).exec()
            })
            .then(post => {
              resBlog.title.should.equal(post.title)
              resBlog.author.should.equal(post.authorName)
              resBlog.content.should.equal(post.content)
            })
        })
    })

    describe('POST endpoint', function() {
      it('should create a new blog post', function() {
        const newPost = {
          title: faker.lorem.sentence(),
          content: faker.lorem.sentence(),
          author: {
            firstName: faker.name.firstName(),
            lastName: faker.name.lastName()
          }
        }
        return chai.request(app)
        .post('/blogdata')
        .send(newPost)
        .then(function(res) {
            res.should.have.status(201)
            res.should.be.json;
            res.body.should.be.a('object')
            res.body.should.include.keys('author', 'content', 'title', 'id')
            res.body.title.should.equal(newPost.title)
            res.body.id.should.not.be.null
            res.body.author.should.equal(`${newPost.author.firstName} ${newPost.author.lastName}`)
            res.body.content.should.equal(newPost.content)
            return BlogPost.findById(res.body.id).exec()
        })
        .then(function(post) {
          post.title.should.equal(newPost.title)
          post.content.should.equal(newPost.content)
          post.author.firstName.should.equal(newPost.author.firstName)
          post.author.lastName.should.equal(newPost.author.lastName)
        })
      })
    })

    describe('put endpoint', function() {
        it('should update fields you send over', function() {
          const updateData = {
            title: "SDfsd",
            content: "sdfs",
            author: {
                      firstName: "SDFs",
                      lastName: "Sdfsd"
                    }
          }
          return BlogPost
          .findOne()
          .exec()
          .then(function(post) {
            updateData.id = post.id
            return chai.request(app)
            .put(`/blogdata/${post.id}`)
            .send(updateData)
          })
          .then(function(res) {
            res.should.have.status(201)
            res.should.be.json
            res.body.should.be.a('object')
            res.body.title.should.equal(updateData.title)
            res.body.content.should.equal(updateData.content)
            res.body.author.should.equal(`${updateData.author.firstName} ${updateData.author.lastName}`)

            return BlogPost.findById(res.body.id).exec()
          })
          .then(function(post) {
            post.title.should.equal(updateData.title)
            post.content.should.equal(updateData.content)
            post.author.firstName.should.equal(updateData.author.firstName)
            post.author.lastName.should.equal(updateData.author.lastName)
          })
        })
    })
    describe('DELETE endpoint', function() {
        it('should delete a post by id', function() {

          let post;

          return BlogPost
            .findOne()
            .exec()
            .then(_post => {
              post = _post;
              return chai.request(app).delete(`/blogdata/${post.id}`);
            })
            .then(res => {
              res.should.have.status(204);
              return BlogPost.findById(post.id);
            })
            .then(_post => {
              should.not.exist(_post);
            });
        });
      });
})
