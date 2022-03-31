//jshint esversion:6
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');

const app = express();

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

// connect to mongodb
mongoose.connect('mongodb://localhost:27017/secrests', { useNewUrlParser: true });

const userSchema = {
    email: String,
    password: String
};

const User = new mongoose.model('User', userSchema);

// home
app.get('/', (req, res) => {
    res.render('home');
});

// login page
app.get('/login', (req, res) => {
    res.render('login');
});

// registrer page
app.get('/register', (req, res) => {
    res.render('register');
});

// register post route 
app.post('/register', (req, res) => {
    const newUser = new User({
        email: req.body.username,
        password: req.body.password
    });

    newUser.save(function(err) {
        if (err) {
            console.log(err);
        } else {
            res.render('secrets');
        }
    });
});

// login post route
app.post('/login', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    User.findOne({ email: username }, function(err, foundUser) {
        if (err) {
            console.log(err);
        } else {
            if (foundUser) {
                if (foundUser.password === password) {
                    res.render('secrets');
                }
            }
        }
    });
});


app.listen(3000, function() {
    console.log('Server is running on port 3000')
})