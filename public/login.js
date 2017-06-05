'use strict';


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
			//$('main').html(response);
			if (response.user) {
				location.href = '/dashboard/';
			}

			console.log('response: ', response);
	});
}


function watchSubmit() {
	$('.log-in-form').submit(function(event) {
		event.preventDefault();
		console.log('here');
		var username = $('#username').val();
		var password = $('#password').val();
		signInUser(username, password);
	})
}

$(watchSubmit());