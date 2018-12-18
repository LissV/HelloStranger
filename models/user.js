var bcrypt = require('bcryptjs'),
    db = require('../database/database'),
    salt = bcrypt.genSaltSync(10);

module.exports.createUser = (res, req) => {
    var user_pswd = bcrypt.hashSync(req.body.password, salt);
    var query = "INSERT INTO users (username, email, passwd) VALUES('" + 
	req.body.username + "', '" + req.body.email + "', '" + user_pswd + "')";

    db.query(query).spread((result, metadata) => {
		console.log("Пользователь успешно зарегистрирован");
	}).catch(function(err){
		throw err;
		console.log("Сбой при регистрации");
	});
}
