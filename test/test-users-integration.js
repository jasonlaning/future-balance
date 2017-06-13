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

function seedUserData() {
	const username = 'testuser';
	const password = 'password';
	const seedData = [];

	for (let i=1; i<=10; i++) {
		seedData.push(generateUserData());
	}

	// set one record with known username and password for testing log in
	seedData[5].username = username;
	seedData[5].password = password;
	const hashedPassword = bcrypt.hash(password, 10);
	return hashedPassword
		.then(_hashedPassword => {
			seedData[5].password = _hashedPassword;
			console.warn('\n Seeding database');
			return User.create(seedData);
		})
}

function generateEntryType() {
	const entryTypes = ['Expense', 'Income'];
	return entryTypes[Math.floor(Math.random() * entryTypes.length)];
}

function generatePeriodType() {
	const periodTypes = ['day', 'week', 'month', 'year'];
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
	console.warn('Deleting database\n');
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
				})
		});
	});

	describe('GET endpoint for user session', function() {

		it('should return user that is signed in', function() {
			let agent = chai.request.agent(app);
			return agent
				.get('/users/login') // first have to log in
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

	describe('GET endpoint to sign out', function() {

		it('should sign out the user and redirect', function() {
			let agent = chai.request.agent(app);
			return agent
				.get('/users/login') // first have to log in
				.auth('testuser', 'password')
				.then(() => {				
					return agent.get('/users/logout')
						.then(res => {
							res.should.have.status(200);
							res.redirects.should.have.lengthOf(1);							
						})					
				});
		});
	});

	describe('POST endpoint to create new user', function() {

		it('should create a new user', function() {

			let testUsername = 'testuser2010';
			let testPassword = 'password123';
			
			return chai.request(app)
				.post('/users/sign-up')
				.send({username: testUsername, password: testPassword})
				.then(res => {							
					res.should.have.status(201);
					res.body.user.username.should.equal(testUsername);
					res.body.user.should.include.keys(
					'username', 'firstName', 'lastName', 'mostRecentBalance', 'adjustmentEntries');			
					User.findOne({username: testUsername})
						.then(user => {
							user.should.exist;
							user.username.should.equal(testUsername);
						})
				})
		});
	});
	
	describe('POST endpoint to add a new adjustment entry', function() {

		it('should add a new adjustment entry', function() {
			let agent = chai.request.agent(app);
			let username = 'testuser';
			let password = 'password';
			let testEntry = {
        					name: 'Giant Burrito',
        					type: 'Expense',
        					amount: 1000,
        					periodUnit: 1,
        					periodType: 'month',
        					startDate: '20170115',
        					endDate: '20250101'
        					};
			return agent
				.get('/users/login') // first have to log in
				.auth(username, password)
				.then(() => {				
					return agent
						.post('/users/me/adjustment-entry')
						.send(testEntry)
						.then(res => {
							res.should.have.status(201);
							let newId = res.body.id;
							let resEntries = res.body.user.adjustmentEntries;
							let resEntry;
							resEntries.forEach((entry) => {
								if (entry.id === newId) {
									resEntry = entry; // finds updated entry in response
								}
							});
							resEntry.name.should.equal(testEntry.name);
							resEntry.type.should.equal(testEntry.type);
							resEntry.amount.should.equal(testEntry.amount);
							resEntry.periodUnit.should.equal(testEntry.periodUnit);
							resEntry.periodType.should.equal(testEntry.periodType);
							resEntry.startDate.should.equal(testEntry.startDate);
							resEntry.endDate.should.equal(testEntry.endDate);						
						})
						.then(() => {
							return User
								.findOne({username: username}, {adjustmentEntries: {$elemMatch: { name: testEntry.name}}})
								.then(user => {
									let newEntry = user.adjustmentEntries[0];
					
									newEntry.name.should.equal(testEntry.name);
									newEntry.type.should.equal(testEntry.type);
									newEntry.amount.should.equal(testEntry.amount);
									newEntry.periodUnit.should.equal(testEntry.periodUnit);
									newEntry.periodType.should.equal(testEntry.periodType);
									newEntry.startDate.should.equal(testEntry.startDate);
									newEntry.endDate.should.equal(testEntry.endDate);
								})
						});					
				});
		});
	});

	describe('PUT endpoint to edit most recent balance', function() {

		let testChanges = {
			mostRecentBalance: {
				date: '2017-05-01',
				amount: 20000
			}
        		}

		it('should save changes to most recent balance', function() {
			let agent = chai.request.agent(app);
			return agent
				.get('/users/login') // first have to log in
				.auth('testuser', 'password')
				.then(() => {				
					return agent
						.put('/users/me/most-recent-balance')
						.send(testChanges)
						.then(res => {
							res.should.have.status(200);
							res.body.user.mostRecentBalance.date.should.equal(testChanges.mostRecentBalance.date);
							res.body.user.mostRecentBalance.amount.should.equal(testChanges.mostRecentBalance.amount);
						})
						.then(() => {
							return User
								.findOne({username: 'testuser'})
								.then(user => {
									user.mostRecentBalance.date.should.equal(testChanges.mostRecentBalance.date);
									user.mostRecentBalance.amount.should.equal(testChanges.mostRecentBalance.amount);
								})
						});					
				});
		});
	});

	describe('PUT endpoint to edit adjustment entry', function() {

		it('should save changes to the adjustment entry', function() {
			let agent = chai.request.agent(app);
			let testEntry = {
		        name: 'Rollercoaster',
		        type: 'Expense',
		        amount: 123456,
		        periodUnit: 2,
		        periodType: 'year',
		        startDate: '20170501',
		        endDate: '20250101'
        				}
			return agent
				.get('/users/login') // first have to log in
				.auth('testuser', 'password')
				.then((res) => {
					testEntry.id = res.body.user.adjustmentEntries[0].id; // gets id of entry to change				
					return agent
						.put('/users/me/adjustment-entry')
						.send(testEntry)
						.then(res => {
							let resEntry = res.body.user.adjustmentEntries[0]
							res.should.have.status(200);
							resEntry.name.should.equal(testEntry.name);
							resEntry.type.should.equal(testEntry.type);
							resEntry.amount.should.equal(testEntry.amount);
							resEntry.periodUnit.should.equal(testEntry.periodUnit);
							resEntry.periodType.should.equal(testEntry.periodType);
							resEntry.startDate.should.equal(testEntry.startDate);
							resEntry.endDate.should.equal(testEntry.endDate);
							return User
								.findOne({username: 'testuser'})
								.then(user => {
									let entry = user.adjustmentEntries[0];
									entry.name.should.equal(testEntry.name);
									entry.type.should.equal(testEntry.type);
									entry.amount.should.equal(testEntry.amount);
									entry.periodUnit.should.equal(testEntry.periodUnit);
									entry.periodType.should.equal(testEntry.periodType);
									entry.startDate.should.equal(testEntry.startDate);
									entry.endDate.should.equal(testEntry.endDate);
								})		
						});			
				});
		});
	});

	describe('DELETE endpoint for user account', function() {

		it('should delete the user account', function() {
			let agent = chai.request.agent(app);
			return agent
				.get('/users/login') // first have to log in
				.auth('testuser', 'password')
				.then(() => {				
					return agent
						.delete('/users/me')
						.then(res => {
							res.should.have.status(200);
							return User
								.findOne({username: 'testuser'})
								.then(res => {
									should.not.exist(res);
								})
						})					
				});
		});
	});

	describe('DELETE endpoint for adjustment entry', function() {

		it('should delete the adjustment entry', function() {
			let agent = chai.request.agent(app);
			return agent
				.get('/users/login') // first have to log in
				.auth('testuser', 'password')
				.then((res) => {
					let testEntry = res.body.user.adjustmentEntries[1];				
					return agent
						.delete('/users/me/adjustment-entry')
						.send({id: testEntry.id})
						.then(res => {
							let resEntries = res.body.user.adjustmentEntries;
							let deletedEntry = null;
							resEntries.forEach((entry) => {
								if (entry.id === testEntry.id) {
									deletedEntry = entry;
								}
							});

							res.should.have.status(200);
							should.not.exist(deletedEntry);
						})
						.then (() => {
							return User
								.findOne({username: 'testuser'})
								.then(user => {
									let entries = user.adjustmentEntries;
									let deletedEntry = null;
									entries.forEach((entry) => {
										if (entry.id === testEntry.id) {
											deletedEntry = entry;
										}
									});
									should.not.exist(deletedEntry);
								});
						});						
				});
		});
	});	

});