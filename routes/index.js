var express = require('express'),
	router = express.Router(),
	currentUser = {};

// Homepage
router.get('/', (req, res) => {
	res.render('index')
});

router.get('/home',(req, res) => {
	if(req.isAuthenticated()){
		res.render('home');
		currentUser.name = req.session.passport.user;
	} else {
	    res.redirect('/users/login');
	}
});

module.exports = {
	router: router,
	currentUser: currentUser
}