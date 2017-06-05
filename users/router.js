const {BasicStrategy} = require('passport-http');
const express = require('express');
const jsonParser = require('body-parser').json();
const passport = require('passport');

const {User} = require('./models');

const router = express.Router();

router.use(jsonParser);

const basicStrategy = new BasicStrategy((username, password, callback) => {
	let user;
	User
		.findOne({username: username})
		.exec()
		.then(_user => {
			user = _user;
			if (!user) {
				return callback(null, false, {message: 'Incorrect username'});
			}
			return user.validatePassword(password);
		})
		.then(isValid => {
			if (!isValid) {
				return callback(null, false, {message: 'Incorrect password'});
			}
			else {
				return callback(null, user);
			}
		});
});

router.use(require('express-session')({ 
  secret: 'something something',
  resave: false,
  saveUninitialized: false 
}));

passport.use(basicStrategy);
router.use(passport.initialize());

router.use(passport.session());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

function loggedIn(req, res, next) {
	if (req.user) {
		next();
	} else {
		res.send({redirect: '/login.html'});
	}
}

router.get('/login',
  passport.authenticate('basic', {session: true}),
  (req, res) => {
  	res.json({user: req.user.apiRepr()});
	}
);

router.post('/login',
  passport.authenticate('basic', {session: true}),
  (req, res) => {
  	res.json({user: req.user.apiRepr()});
	}
);

router.get('/', loggedIn, function(req, res, next) {
  	res.json({user: req.user.apiRepr()});
	}
);

router.post('/test', (req, res) => {
	if (!req.body) {
		return res.status(400).json({message: 'No request body'});
	}
	if (!('username' in req.body)) {
		return res.status(422).json({message: 'Missing field: username'});
	}

	let {username, password, firstName, lastName, mostRecentBalance, adjustmentEntries} = req.body;

	if (typeof username !== 'string') {
		return res.status(422).json({message: 'Incorrect field type: username'});
	}

	username = username.trim();

	if (username ==='') {
		return res.status(422).json({message: 'Incorrect field length: username'});
	}

	if (!(password)) {
		return res.status(422).json({message: 'Missing field: password'});
	}

	if (typeof password !== 'string') {
		return res.status(422).json({message: 'Incorrect field type: password'});
	}

	password = password.trim();

	if (password === '') {
		return res.status(422).json({message: 'Incorrect field length: password'});
	}

	// check for existing user
	return User
		.find({username})
		.count()
		.exec()
		.then(count => {
			if (count > 0) {
				return res.status(422).json({message: 'username already taken'});
			}
			return User.hashPassword(password);
		})
		.then(hash => {
			return User
				.create({
					username: username,
					password: hash,
					firstName: firstName,
					lastName: lastName,
					mostRecentBalance: mostRecentBalance,
					adjustmentEntries: adjustmentEntries
				});
		})
		.then(user => {
			return res.status(201).json(user.apiRepr());
		})
		.catch(err => {
			res.status(500).json({message: 'Internal server error'});
		});
});

module.exports = {router};