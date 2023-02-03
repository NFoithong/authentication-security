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
// const bcrypt = require('bcrypt');
// const saltRound = 10;

// using passport, session packages
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');

// Google-Oauth
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const findOrCreate = require('mongoose-findorcreate');

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

// if we run nodemon and there is a message the application warning that (node:35949) deprecationWarning: use the code below
// mongoose.set('useCreateIndex', true);

// Tell the app to use session here: checkout the documentation in npm.js how to implement the code
app.use(session({
    secret: "Our little secret.", // any long string which you can remember
    resave: false,
    saveUninitialized: true,
}));

// Tell the app to use passport initialize here: checkout on passportjs.org documentation
app.use(passport.initialize());
app.use(passport.session()); // use passport to dealing with the session

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
});

// To use hash and salt the password to save on the mongoose DB 
userSchema.plugin(passportLocalMongoose);

userSchema.plugin(findOrCreate);

// Secret String Instead of Two Keys
// For convenience, you can also pass in a single secret string instead of two keys.
// Encrypt Only Certain Fields
// const secret = 'Thisisourlittlesecret.'; delete this line and save into .env file for hidden security
// userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ['password'] }); delete this line because we gonna use hashing function with md5

const User = new mongoose.model('User', userSchema);

// passport-local configuration: serializeUser and deserializeUser
passport.use(User.createStrategy()); // passport to use login strategy
// this is for passport for local authentication
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

// this can work for any kind of authentication
passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
        done(err, user);
    });
});

// Credentials google oauth here
passport.use(new GoogleStrategy({
        clientID: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        callbackURL: "http://localhost:3000/auth/google/secrets",
        userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
            // just in case callback URL might break, this is gonna back up code as an optional
    },
    function(accessToken, refreshToken, profile, cb) {
        console.log(profile);

        User.findOrCreate({ googleId: profile.id }, function(err, user) {
            return cb(err, user);
        });
    }
));

// home
app.get('/', (req, res) => {
    res.render('home');
});

// request authenticate to google account for loggin
app.get("/auth/google",
    passport.authenticate("google", { scope: ["profile"] })
);

app.get("/auth/google/secrets",
    passport.authenticate("google", { failureRedirect: "/login" }),
    function(req, res) {
        // Successful authentication, redirect secrets.
        res.redirect("/secrets");
    });

// login page
app.get('/login', (req, res) => {
    res.render('login');
});

// registrer page
app.get('/register', (req, res) => {
    res.render('register');
});

// create a secrets route
app.get("/secrets", function(req, res) {
    if (req.isAuthenticated()) {
        res.render("secrets");
    } else {
        res.redirect("/login");
    }
});

// logout
app.get("/logout", function(req, res) {
    req.logout(function(err) {
        if (err) {
            console.log(err);
        } else {
            res.redirect("/");
        }
    });
});

// register post route 
app.post('/register', (req, res) => {

    /* This bcrypt is deleted because we gonna use passport, session

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
    */

    // go to npm.js passport-local-mongoose for documentation to user authentication
    User.register({ username: req.body.username }, req.body.password, function(err, user) {
        if (err) {
            console.log(err);
            res.redirect("/register");
        } else {
            passport.authenticate('local')(req, res, function() {
                res.redirect("/secrets");
            })
        }
    })
});

// login post route
app.post('/login', (req, res) => {
    /* This bcrypt is deleted because we gonna use passport, session
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
    */

    // checkout passportjs.org
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, function(err) {
        if (err) {
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, function() {
                res.redirect("/secrets");
            })
        }
    });
});


app.listen(3000, function() {
    console.log('Server is running on port 3000')
})