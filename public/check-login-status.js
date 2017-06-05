'use strict';

function checkIfLoggedIn() {

	var settings = {
	  url: "../users/",
	  method: "GET",
	  headers: {
	    'content-type': "application/json"
	  }
	};

	$.ajax(settings).done(function(response) {
		if (response.redirect === '/login.html') {
			window.location = response.redirect;
		}
		else {
			window.location = '/dashboard/';
		}
	});
}

function watchLogIn() {
	$('.nav-button').click(function(event) {
		event.preventDefault();
		console.log('ahoy');
		checkIfLoggedIn();
	});
}

$(watchLogIn);