'use strict';


function signUpUser(username, password) {

	var settings = {
	  url: '../users/sign-up',
	  method: 'POST',
	  data: JSON.stringify({username: username, password: password}),
	  contentType: 'application/json',
	  dataType: 'json',
	  error: function(res) {
	  	var message = res.responseJSON.message;
	  	$('.js-message').html(message);
 		}
	};

	$.ajax(settings)
		.done(function (response) {
			$('.js-message').html('Success! Signing in.');
			setTimeout(function(){signInUser(username, password)}, 1000);
		})
}

function randomStr() {
	return ((Math.random() * 999999999999) + 111111111111).toString();
}

function populateDemoData() {

	var endDate = '2055-01-01';

	var demoData = {
		username: 'Demo' + randomStr(),
		password: 'demo',
		mostRecentBalance: {
			date: '2017-06-01',
			amount: 3000
		},
		firstName: 'Demo',
		adjustmentEntries: [{
			id: randomStr(),
			name: 'Rent',
			type: 'Expense',
			amount: 2800,
			periodUnit: 1,
			periodType: 'month',
			startDate: moment().date(1),
			endDate: endDate
			},{
			id: randomStr(),
			name: 'Salary',
			type: 'Income',
			amount: 1800,
			periodUnit: 2,
			periodType: 'week',
			startDate: '2017-06-09',
			endDate: endDate
			},{
			id: randomStr(),
			name: 'Groceries',
			type: 'Expense',
			amount: 150,
			periodUnit: 1,
			periodType: 'week',
			startDate: '2017-06-11',
			endDate: endDate
			}
		]};

	return demoData;

}

function createNewDemoUser() {

	var demoData = populateDemoData();

	var settings = {
	  url: '../users/sign-up',
	  method: 'POST',
	  data: JSON.stringify(demoData),
	  contentType: 'application/json',
	  dataType: 'json',
	  error: function(res) {
	  	var message = res.responseJSON.message;
	  	$('.js-message').html(message);
 		}
	};

	$.ajax(settings)
		.done(function (response) {
			signInDemoUser(demoData.username, demoData.password);
		})
}

function signInUser(username, password) {

	var settings = {
	  url: "../users/login",
	  method: "GET",
	  headers: {
	    'content-type': "application/json",
	    authorization: "Basic " + btoa(username + ':' + password)
	  }
	};

	$.ajax(settings).done(function (response) {
			if (response.user) {
				location.href = '/dashboard/';
			}
			else {
				$('.js-message').html('Server error.');
			}
	});
}

function signInDemoUser(username, password) {

	var settings = {
	  url: "../users/login",
	  method: "GET",
	  headers: {
	    'content-type': "application/json",
	    authorization: "Basic " + btoa(username + ':' + password)
	  }
	};

	$.ajax(settings).done(function (response) {
			if (response.user) {
				location.href = '/dashboard/';
			}
			else {
				$('.js-message').html('Server error.');
			}
	});
	
}

function watchDemoClick() {
	$('.js-demo').click(function(event) {
		event.preventDefault();
		event.stopPropagation();
		createNewDemoUser();
	})
}


function watchSignUp() {
	$('.sign-up-form').submit(function(event) {
		event.preventDefault();
		var username = $('#username').val();
		var password = $('#password').val();
		var passwordConfirm = $('#passwordConfirm').val();
		if (password === passwordConfirm) {
			signUpUser(username, password);
		}
		else {
			$('.js-message').html('"Confirm Password" does not match');
		}

	})
}

$(watchDemoClick());

$(watchSignUp());