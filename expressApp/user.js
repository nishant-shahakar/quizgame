var User = require('../models/userModel.js');

exports.get = function(req, res,next) {
	var user = JSON.parse(req.session.user);
	res.json(user);
};
exports.set = function(req, res,next) {
	var user = new User({
		username:req.body.username,
		password:req.body.password,
		email:req.body.email,
		fullName:req.body.fullname
	});
	user.save(function(err,newUser) {
    if (err){
    	return next(err);
    }
	res.send(user);
    });	
};

exports.login = function(req, res,next) {
	User.findOne({ username: req.body.username }, function (err, user) {
		if (err) { 
			 	res.sendStatus(500);
		  	return; 
		  }
		if (!user) { 
			 	res.sendStatus(403);
		  	return;  
		}
		user.verifyPassword(req.body.password, function(err, isMatch) {
			if (err) {
			 	res.sendStatus(500);
			  	return; 
			  }
			if (!isMatch) {
			 	res.sendStatus(403);
			  	return;	  	
			  } 
			req.session.user = JSON.stringify(user);
			res.send(user);     
		});
	});
};

exports.logout = function(req, res,next) {
	req.session.destroy();
    res.redirect('/');
};