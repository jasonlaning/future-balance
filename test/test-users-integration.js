const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const should = chai.should();

const {User} = require('../users/models');
const {app, runServer, closeServer} = require('../server');
const {TEST_DATABASE_URL} = require('../config');

chai.use(chaiHttp);


function seedUserData() {	
	let username = 'testuser';
	let password = 'password';
	let hashedPassword = bcrypt.hash(password, 10);
	return hashedPassword
		.then(hashedPassword => {
			let seedData = {username: username, password: hashedPassword};
			return User.create(seedData);
		})
}

function tearDownDb() {
	console.warn('Deleting database');
	return mongoose.connection.dropDatabase();
}

describe('Users API resource', function() {
	before(function() {
		return runServer(TEST_DATABASE_URL);
	});

	beforeEach(function() {
		return seedUserData();
	});

	afterEach(function() {
		return tearDownDb();
	});

	after(function() {
		return closeServer();
	});

	describe('GET endpoint to log in user', function() {

		it('should log in user and return a cookie', function() {
			let res;
			let agent = chai.request.agent(app);
			return agent
				.get('/users/login')
				.auth('testuser', 'password')
				.then(_res => {				
					res = _res;
					res.should.have.status(200);
					res.body.user.username.should.equal('testuser');
					res.body.user.should.include.keys(
						'username', 'firstName', 'lastName', 'mostRecentBalance', 'adjustmentEntries');
					res.should.have.cookie;
				})
		});
	});

	describe('GET endpoint for logged-in user', function() {

		it('should return user data for logged in user', function() {
			let res;
			let agent = chai.request.agent(app);
			return agent
				.get('/users/login')
				.auth('testuser', 'password')
				.then(_res => {				
					res = _res;
					return agent.get('/users')
						.then(res => {
							res.should.have.status(200);
							res.body.user.username.should.equal('testuser');
							res.body.user.should.include.keys(
								'username', 'firstName', 'lastName', 'mostRecentBalance', 'adjustmentEntries');
						})
				})
		});
	});

});