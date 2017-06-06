const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const faker = require('faker');
const bcrypt = require('bcryptjs');

const should = chai.should();

const {User} = require('../users/models');
const {app, runServer, closeServer} = require('../server');
const {TEST_DATABASE_URL} = require('../config');

chai.use(chaiHttp);


/*function seedUserData() {	
	let username = 'testuser';
	let password = 'password';
	let hashedPassword = bcrypt.hash(password, 10);
	hashedPassword
		.then(_hashedPassword => {
			let seedData = {username: username, password: _hashedPassword};
			return User.create(seedData);
		})
}*/

function seedUserData() {
	const username = 'testuser';
	const password = 'password';
	const seedData = [];

	for (let i=1; i<=10; i++) {
		seedData.push(generateUserData());
	}

	// set one record to known username and password for logging in
	seedData[5].username = username;
	seedData[5].password = password;
	const hashedPassword = bcrypt.hash(password, 10);

	return hashedPassword
		.then(_hashedPassword => {
			seedData[5].password = _hashedPassword;
			return User.create(seedData);
		})
}

function generateEntryType() {
	const entryTypes = ['Expense', 'Income'];
	return entryTypes[Math.floor(Math.random() * entryTypes.length)];
}

function generatePeriodType() {
	const periodTypes = ['day(s)', 'week(s)', 'month(s)', 'year(s)'];
	return periodTypes[Math.floor(Math.random() * periodTypes.length)];
}

function generatePeriodUnit() {
	min = Math.ceil(1);
	max = Math.floor(10);
	return Math.floor(Math.random() * (max - min)) + min;
}

function generateAdjustmentEntry() {
	return {
		id: faker.random.uuid(),
		name: faker.random.word(),
		type: generateEntryType(),
		amount: faker.finance.amount(),
		periodUnit: generatePeriodUnit(),
		periodType: generatePeriodType(),
		startDate: faker.date.recent(),
		endDate: '20250101'
	}
}

function generateUserData() {
	return {
		username: faker.internet.userName(),
		password: faker.internet.password(),
		firstName: faker.name.firstName(),
		lastName: faker.name.lastName(),
		mostRecentBalance: {
			date: faker.date.recent(),
			amount: faker.finance.amount()
		},
		adjustmentEntries: [generateAdjustmentEntry(), 
			generateAdjustmentEntry(), generateAdjustmentEntry()]
	}
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

	
	describe('GET endpoint for signing in', function() {

		it('should sign in user and return user account', function() {
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

	describe('GET endpoint for user session', function() {

		it('should return user that is signed in', function() {
			let agent = chai.request.agent(app);
			return agent
				.get('/users/login')
				.auth('testuser', 'password')
				.then(() => {				
					return agent.get('/users/me')
						.then(res => {
							res.should.have.status(200);
							res.body.user.username.should.equal('testuser');
							res.body.user.should.include.keys(
								'username', 'firstName', 'lastName', 'mostRecentBalance', 'adjustmentEntries');
						})					
				});
		});
	});

	// POST for creating new user account


	

});

