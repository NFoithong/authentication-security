//jshint esversion:6

// Storing configuration in the environment separate from code is based on The Twelve-Factor App methodology.
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
// npm i mongoose-encryption : read the document in npmjs.com to use
// const encrypt = require('mongoose-encryption');
// const md5 = require('md5'); js function for hashing messages with MD5

// Bcrypt is a library to help you hash passwords. It uses a password-hashing function that is based on the Blowfish cipher.
const bcrypt = require('bcrypt');
const saltRound = 10;

const app = express();

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

/* When strict option is set to true, 
Mongoose will ensure that only the fields that are specified 
in your Schema will be saved in the database, 
and all other fields will not be saved (if some other fields are sent).
*/
mongoose.set("strictQuery", false);
// connect to mongodb
mongoose.connect('mongodb://localhost:27017/secrests', { useNewUrlParser: true });

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

// Secret String Instead of Two Keys
// For convenience, you can also pass in a single secret string instead of two keys.
// Encrypt Only Certain Fields
// const secret = 'Thisisourlittlesecret.'; delete this line and save into .env file for hidden security
// userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ['password'] }); delete this line because we gonna use hashing function with md5

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

    // bcrypt hashing function for password
    bcrypt.hash(req.body.password, saltRound, function(err, hash) {
        const newUser = new User({
            email: req.body.username,
            password: hash
        });

        newUser.save(function(err) {
            if (err) {
                console.log(err);
            } else {
                res.render('secrets');
            }
        });
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
                // if (foundUser.password === password) {
                bcrypt.compare(password, foundUser.password, function(err, result) {
                    if (result == true) {
                        res.render('secrets');
                    }
                });
            }
        }
    });
});


app.listen(3000, function() {
    console.log('Server is running on port 3000')
})