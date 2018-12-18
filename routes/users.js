var express = require('express'),
	newUser = require('../models/user'),
	passport = require('passport'),
	LocalStrategy = require('passport-local').Strategy,
	db = require('../database/database'),
	bcrypt = require('bcryptjs'),
	router = express.Router();

router.get('/registration', (req, res) => {
	res.render('registration')
});

router.get('/login', (req, res) => {
	res.render('login')
});

router.get('/logout',(req, res) => {
	req.logout();
	res.redirect('/');
});

checkUniqueUsername = (username) => {
	var query = "SELECT * FROM users WHERE username='" + username + "'";
	var flag = true;
	db.query(query).spread((result, metadata) => {
		if (result.length > 0){
			flag = false;
		}
	});
	return flag;
};

router.post('/registration', (req, res) => {
	req.checkBody('username', 'Username cannot be empty!').notEmpty();
	req.checkBody('email', 'Email cannot be empty!').notEmpty();
	req.checkBody('email', 'Email is not valid!').isEmail();
	req.checkBody('password', 'Password cannot be empty!').notEmpty();
	req.checkBody('repassword', 'Passwords do not match!').equals(req.body.password);
	var errors = req.validationErrors();

	var query = "SELECT * FROM users WHERE username='" + req.body.username + "'";
	db.query(query).spread((result, metadata) => {
		if (result.length > 0){
			var newError = {
				param: 'uniqueUsername',
				msg: 'This username has already existed!'
			}
			errors.push(newError);
		}
	});

	if(errors){
		res.render('registration', {
			errors: errors
		});
	} else {
		console.log('Passed!');
		newUser.createUser(res, req);
		res.redirect('/users/login');
	}
});

passport.use(new LocalStrategy(
	(username, password, done) => {
		var submittedPassword = password;
		var query = "SELECT * FROM users WHERE username='" + username + "'";
		db.query(query).spread((result, metadata) => {
			if (result.length > 0){
				var user = result[0];
				var isVerified = bcrypt.compareSync(submittedPassword, user.passwd);

				if (isVerified){
					return done(null, user);
				} else {
					console.log('Invalid password');
					return done(null, false, { message: 'Invalid password' });
				}
			}
			else {
				console.log('Unknown user');
				return done(null, false, { message: 'Unknown user' });
			}
		})
}));

passport.serializeUser((user, done) => {
	done(null, user.username);
});

passport.deserializeUser((username, done) => {
	var user = "SELECT * FROM users WHERE username='" + username + "'";
	done(null, user);
});

router.post('/login',
	passport.authenticate('local', { 
		successRedirect: '/home', 
		failureRedirect: '/users/login', 
		failureFlash: true 
	}), (req, res) => {
		res.redirect('/home');
});

module.exports = router;