const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const moment = require('moment');

mongoose.Promise = global.Promise;

const userSchema = mongoose.Schema({
	username: {
		type: String,
		required: true,
		unique: true
	},
	password: {
		type: String,
		required: true
	},
	firstName: {type: String, default: ""},
	lastName: {type: String, default: ""},
	mostRecentBalance: {
		date: {type: String, default: moment().format('YYYY-MM-DD')},
		amount: {type: Number, default: 0}
	},
	adjustmentEntries: {type: Array, default: []}
});

userSchema.methods.apiRepr = function() {
	return {
		username: this.username || '',
		firstName: this.firstName || '',
		lastName: this.lastName || '',
		mostRecentBalance: this.mostRecentBalance,
		adjustmentEntries: this.adjustmentEntries
	};
}

userSchema.methods.validatePassword = function(password) {
	return bcrypt.compare(password, this.password);
}

userSchema.statics.hashPassword = function(password) {
	return bcrypt.hash(password, 10);
}

const User = mongoose.model('User', userSchema);

module.exports = {User};