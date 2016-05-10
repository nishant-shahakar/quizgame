var express = require('express');
var router = express.Router();
var user = require('./user.js');
var game = require('./game.js');



var restrict =function(req,res,next){
	if(req.session.user) return next();
	res.redirect('/');
}

router.get('/',function(req,res){
	if(req.session.user) return res.redirect('/game');
	res.render("index");
});

router.route('/users')
	.get(restrict,user.get)
	.post(user.set);

router.route('/login')
	.post(user.login);

router.route('/logout')
	.get(user.logout);
	
router.route('/game')
	.get(restrict,game.get)
	.post(restrict,game.set);



module.exports = router;
