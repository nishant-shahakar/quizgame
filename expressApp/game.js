var User = require('../models/userModel.js');

exports.get = function(req, res,next) {
    var user = req.session.user;
    req.session.regenerate(function (err) {
        req.session.user = user;
		res.render('game');     
    });
};
exports.set = function(req, res,next) {
  var user =JSON.parse(req.session.user);
    req.session.regenerate(function (err) {
    	user.host = req.body.host;
    	user.gameName = req.body.gameName;
        req.session.user =JSON.stringify(user);
        res.send(user);
    });  
};