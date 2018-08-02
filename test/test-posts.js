// on a directory level, how does branches work?
'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');

const expect = chai.expect;

const { BlogPost } = require('../models');
const { app, runServer, closeServer } = require('../server');
const { TEST_DATABASE_URL } = require('../config');

chai.use(chaiHttp);

function seedBlogPostsData() {
  const seedData = [];

  for(let i=0; i<10; i++) {
    seedData.push(generateBlogPostData())
  }

  return BlogPost.insertMany(seedData);
}


function generateBlogPostData() {
  return {
    title: faker.random.words(),
    content: faker.lorem.sentences(),
    author: {
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName()
    }
  };
}

// I'm getting an error stating that the process between the previous teardown and the new seed is happening too quickly. What's a good way around this?

function tearDownDB() {
  return mongoose.connection.dropDatabase();
}

describe('BlogPost API resource', function() {
  before(function() {
    return runServer(TEST_DATABASE_URL);
  });

// there is a warning popping up, is the tearing down the database then reseeding happening too fast? is there a way to handle this with promises?
// how exactly does this async await works?

  beforeEach(async function() {
    await seedBlogPostsData();
  });

  afterEach(async function() {
    await tearDownDB();
  });

  after(function() {
    return closeServer();
  });

  describe('GET endpoint', function() {
    it('should return all blog posts', function() {
      let res;
      return chai.request(app)
        .get('/posts')
        .then(function(_res) {
          res = _res;
          expect(res).to.have.status(200);
          expect(res.body).to.have.lengthOf.at.least(1);
          return BlogPost.countDocuments();
        })
        .then(function(count) {
          expect(res.body).to.have.lengthOf(count);
        });
    });

    it('should return posts with right fields', function() {
      let resPost;
      return chai.request(app)
        .get('/posts')
        .then(function(res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.lengthOf.at.least(1);

          res.body.forEach(function(post) {
            expect(post).to.be.a('object');
            expect(post).to.include.keys(
              'id', 'title', 'content', 'author'
            );
          });

          resPost = res.body[0];
          return BlogPost.findById(resPost.id);
        })
        .then(function(post) {
          expect(resPost.id).to.equal(post.id);
          expect(resPost.title).to.equal(post.title);
          expect(resPost.content).to.equal(post.content);
          expect(resPost.author).to.equal(`${post.author.firstName} ${post.author.lastName}`);
        });
    });
  });

  // what would be more preferable to validate firstname and lastname? serializing it as I am now or just check the fields individually?

  describe('POST endpoint', function() {
    it('should add a new post', function() {
      const newPost = generateBlogPostData();

      return chai.request(app)
        .post('/posts')
        .send(newPost)
        .then(function(res) {
          expect(res).to.have.status(201);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.include.keys(
            'id', 'title', 'content', 'author'
          );
          expect(res.body.id).to.not.be.null;
          expect(res.body.title).to.equal(newPost.title);
          expect(res.body.content).to.equal(newPost.content);

          expect(res.body.author).to.equal(`${newPost.author.firstName} ${newPost.author.lastName}`);
        })
    });
  });

  describe('PUT endpoint', function() {
    it('should update fields you send over', function() {
      const updateData = {
        title: "Updated Title",
        content: "Updated Content",
        author: {
          firstName: "Updated",
          lastName: "Author"
        }
      };

      return BlogPost
        .findOne()
        .then(function(post) {
          updateData.id = post.id;

          return chai.request(app)
            .put(`/posts/${post.id}`)
            .send(updateData);
        })
        .then(function(res) {
          expect(res).to.have.status(204);
          return BlogPost.findById(updateData.id);
        })
        .then(function(post) {
          expect(post.title).to.equal(updateData.title);
          expect(post.content).to.equal(updateData.content);
          expect(post.author.firstName).to.equal(updateData.author.firstName);
          expect(post.author.lastName).to.equal(updateData.author.lastName);
        });
    });
  });

  describe('DELETE endpoint', function() {
    it('should delete a post by id', function() {
      let post;

      return BlogPost
        .findOne()
        .then(function(_post) {
          post = _post;
          return chai.request(app).delete(`/posts/${post.id}`);
        })
        .then(function(res) {
          expect(res).to.have.status(204);
          return BlogPost.findById(post.id);
        })
        .then(function(_post) {
          expect(_post).to.be.null;
        });
    });
  });
});
