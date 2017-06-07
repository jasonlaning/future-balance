const {BasicStrategy} = require('passport-http');
const express = require('express');
const jsonParser = require('body-parser').json();
const passport = require('passport');
const uuid = require('uuid');

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
		})
		.catch(err => console.log('Invalid username or password'))
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
		res.json({redirect: '/login.html', message: 'Please sign in'});
	}
}

// GET for user to sign in
router.get('/login',
	passport.authenticate('basic', {session: true, failureRedirect: '/login.html'}),
		(req, res) => {
			res.json({user: req.user.apiRepr(), message: 'Sign in successful'});
		}
);

// GET (protected, must be signed-in already and have session cookie)
router.get('/me', loggedIn, (req, res, next) => {
  	res.json({user: req.user.apiRepr()});
	}
);

// GET for user to sign out
router.get('/logout', (req, res) => {
	req.session.destroy(function (err) {
  		res.redirect('/');
  	});
});

// POST for creating new user account
router.post('/sign-up', (req, res) => {
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

	return User
		.find({username})
		.count()
		.exec()
		.then(count => {
			if (count > 0) {
				return res.status(422).json({message: 'Username already taken'});
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
			return res.status(201).json({user: user.apiRepr(), message: 'New account created! Please sign in'});
		})
		.catch(err => {
			res.status(500).json({message: 'Internal server error'});
		});
});

// POST (password protected, must have session cookie) for adding a new adjustment entry
router.post('/me/adjustment-entry', loggedIn, (req, res) => {
	if (!req.body) {
		return res.status(400).json({message: 'No request body'});
	}

	const requiredFields = ['name', 'type', 'amount', 'periodUnit', 'periodType', 'startDate', 'endDate'];

	for (let i = 0; i < requiredFields.length; i++) {
		const field = requiredFields[i];
		if(!(field in req.body)) {
			return res.status(422).json({message: `Missing field: ${field}`});
		};
	}

	let {name, type, amount, periodUnit, periodType, startDate, endDate} = req.body;

	if (typeof name !== 'string') {
		return res.status(422).json({message: 'Incorrect field type: name'});
	}

	name = name.trim();

	if (name ==='') {
		return res.status(422).json({message: 'Incorrect field length: name'});
	}

	if (typeof amount !== 'number') {
		return res.status(422).json({message: 'Incorrect field type: amount'});
	}

	if (typeof periodUnit !== 'number') {
		return res.status(422).json({message: 'Incorrect field type: amount'});
	}

	//return User.adjustmentEntries.push(req.body);
	const newAdjustment = {
		id: uuid.v1(),
		name: req.body.name,
		type: req.body.type,
		amount: req.body.amount,
		periodUnit: req.body.periodUnit,
		periodType: req.body.periodType,
		startDate: req.body.startDate,
		endDate: req.body.endDate
	}

	return User
		.update({username: req.user.username}, {$push: {adjustmentEntries: newAdjustment}})
		.then(user => res.status(204).json({user: req.user.apiRepr()}).end())
		.catch(err => res.status(500).json({message: 'Internal server error'}));
});

// PUT (password protected, must have session cookie) for editing user data 
// includes: account info or most recent balance
router.put('/me', loggedIn, (req, res) => {

	const updated = {};
	const updateableFields = ['firstName', 'lastName', 'password', 'mostRecentBalance'];
	updateableFields.forEach(field => {
		if (field in req.body) {
			updated[field] = req.body[field];
		}
	});

	User
		.findByIdAndUpdate(req.user.id, {$set: updated}, {new: true})
		.then(updatedUser => res.status(201).json(req.updatedUser.apiRepr()))
		.catch(err => res.status(500).json({message: 'Error, update failed'}));
});

// PUT for editing adjustment entries, cookie required
router.put('/me/adjustment-entry', loggedIn, (req, res) => {

	User
		.update({username: req.user.username, 'adjustmentEntries.id': req.body.id}, 
				{$set: {'adjustmentEntries.$': req.body}}, {new: true})
		.then(message => res.status(201).json(message).end())
		.catch(err => res.status(500));
});

// DELETE user account (password protected, must have session cookie)
router.delete('/me', loggedIn, (req, res) => {
	User
		.findByIdAndRemove(req.user.id)
		.exec()
		.then(user => res.status(204).json({redirect: '/'}).end())
		.catch(err => res.status(500).json({message: 'Internal server error'}));
});

// DELETE adjustment entry (password protected)
router.delete('/me/adjustment-entry', loggedIn, (req, res) => {
	User
		.update({username: req.user.username}, 
				{$pull: {adjustmentEntries: {id: req.body.id}}})
		.then(user => res.status(204).end())
		.catch(err => res.status(500).json({message: 'Internal server error'}));
})

router.use('*', function(req, res) {
	res.status(404).json({message: 'Not Found'});
});

module.exports = {router};