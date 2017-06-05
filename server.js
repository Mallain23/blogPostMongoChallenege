const express = require('express');
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const morgan = require('morgan')

mongoose.Promise = global.Promise;

const {PORT, DATABASE_URL} = require('./config')
const {BlogPost} = require('./models')

const app = express();

app.use(bodyParser.json())
app.use(morgan('common'))

app.get('/blogdata', (req, res) => {
    BlogPost
    .find()
    .exec()
    .then(posts => {
        res.json(posts.map(post => post.apiRepr()));
    })
    .catch(err => {
            console.log(err);
            res.status(500).json({error: 'something went wrong'})
    })
});

app.get('/blogdata/:id', (req, res) => {
      BlogPost
      .findById(req.params.id)
      .exec()
      .then(posts => {
          res.json(posts.apiRepr())
      })
      .catch(err => {
          console.log(err);
          res.status(500).json({error: 'something went wrong'})
      })
})

app.post('/blogdata', (req, res) => {
    const requiredFields = ['content', 'title', 'author']
    const missingFields = requiredFields.filter(field => !req.body[field])

    if (!req.body || missingFields.length) {

        const message = `Request body is missing "${missingFields.length} fields"`
        console.error(message)

        return res.status(400).send(message);
    }

    BlogPost
    .create({
        title: req.body.title,
        author: req.body.author,
        content: req.bodu.content
    })
    .then(post => res.status(201).json(post.apiRepr()))
    .catch(err => {
        console.error(err)
        res.status(500).json({error: 'something went wrong'})
    })
})

app.delete('blogposts/:id', (req, res) => {
    BlogPosts
    .findByIdAndRemove(req.params.id)
    .exec()
    .then(() => {
        res.status(204).json({message: 'success'})
    })
    .catch(err => {
      console.error(err)
      res.status(500).json({message: 'something went wrong'})
    })
});

app.put('blogposts/:id', (req, res) => {
    if(!(req.params.id && req.body.id && req.params.id === req.body.id)) {
        res.status(400).json({message: 'request path ID and request body ID must match'})
    }

    const updated = {};
    const updateableFields = ['content', 'author', 'title'];
    updateableFields.forEach(field => {
        if (field in req.body) {
            updated[field] = req.body[field];
        }
    })

    BlogPost
    .findByIdAndUpdate(req.params.id, {$set: updated}, {new: true})
    .exec()
    .then(post => res.status(201).json(post.apiRepr()))
    .catch(err => res.status(500).json({message: 'something went wrong'}))
})

app.use('*', function(req, res) {
  res.status(404).json({message: 'Not Found'});
});

let server;

  function runServer(databaseUrl=DATABASE_URL, port=PORT) {
    return new Promise((resolve, reject) => {
        mongoose.connect(databaseUrl, err => {
            if (err) {
                return reject(err);
            }

            server = app.listen(port, () => {
                console.log(`Your app is listening on port ${port}`);
                resolve();
            })
            .on('error', err => {
                mongoose.disconnect();
                reject(err);
            });
        });
    });
}


function closeServer() {
    return mongoose.disconnect().then(() => {

        return new Promise((resolve, reject) => {

            console.log('Closing server');
            server.close(err => {

                if (err) {
                    return reject(err);
                }

            resolve();
            });
        });
    });
}


if (require.main === module) {
  runServer().catch(err => console.error(err));
};

module.exports = {app, runServer, closeServer};
