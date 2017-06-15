'use strict';

var DASH_USER = {};

function updateDASH_USER(fetchedUser) {

	var keys = Object.keys(fetchedUser);

	for (var i = 0; i < keys.length; i++) {
		DASH_USER[keys[i]] = fetchedUser[keys[i]];
	}

	return DASH_USER;
}

function getUser(callbackFn) {

	var settings = {
	  url: '../users/me',
	  method: 'GET',
	  headers: {
	    'content-type': 'application/json'
	  }
	};

	$.ajax(settings).done(function(response) {
		if (response.user) {	
			callbackFn(updateDASH_USER(response.user));
		}
		else {
			window.location = response.redirect;
		}
	});
}

function sendUserData(userData, endPoint, method) {
	
	var settings = {
		url: endPoint,
		method: method,
		data: JSON.stringify(userData),
		contentType: 'application/json',
		dataType: 'json',
		error: function(res) {
			var message = res.responseJSON.message;
			$('.js-message').html(message);
			}
	};

	$.ajax(settings)
		.done(function (response) {
			closePopWindow();
			getUser(renderDashboard);
		})
}

function deleteEntry(entryId, endPoint) {

	var settings = {
		url: endPoint,
		method: 'DELETE',
		data: JSON.stringify({id: entryId}),
		contentType: 'application/json',
		dataType: 'json',
		error: function(res) {
			var message = res.responseJSON.message;
			}
	};

	$.ajax(settings)
		.done(function (response) {
			closePopWindow();
			getUser(renderDashboard);
		})
}

function renderDashboard(user) {

	var headerHtml = '<div class="row row-heading"><div class="col-2"><div class="dashboard-header-box">Type</div></div>' +
						'<div class="col-6"><div class="dashboard-header-box" entry-name="name">Name</div></div>' +
						'<div class="col-2"><div class="dashboard-header-box">Amount</div></div>' +
						'<div class="col-4"><div class="dashboard-header-box"></div></div>' +
						'</div>';

	// display 'Demo' for demo username
	var username;

	if (DASH_USER.firstName === 'Demo') {
		username = 'Demo';
	} else {
		username = DASH_USER.username
	}

	var dashboardHtml = '<header><div class="row top-row">' +
		'<div class="settings-box"><p><span class="settings">Account: </span><span class="username">' + 
		username + '</span></p>' +
		'<p>Last Balance Set:<span class="last-balance"> $' + DASH_USER.mostRecentBalance.amount + 
		'</span><span class="js-previous-balance"> (<a href="#" title="set new">set&nbsp;new</a>)</span><br />' +
		'<span class="previous-bal-date">on ' + DASH_USER.mostRecentBalance.date + 
		'</span></p></div>' +
		'<div class="add-item-box"><div class="plus-sign" title="Add New Item"></div>' +
		'<div class="add-item" title="Add New Item">New Item</div></div></div></header>';

	var entries = user.adjustmentEntries;

	var dayOrdinal;
	var pluralType;

	if (entries.length > 0) {
		user.adjustmentEntries.forEach(function(entry) {

			if (entry.periodUnit > 1) {
				pluralType = 'every ' + entry.periodUnit + ' ' + entry.periodType + 's';
			} else {
				pluralType = 'every ' + entry.periodType;
			}

			if (entry.periodType === 'week') {
				dayOrdinal = moment(entry.startDate).format('dddd') + 's';
			}

			if (entry.periodType === 'month') {
				dayOrdinal = 'the ' + moment(entry.startDate).format('Do');
			}

			dashboardHtml += headerHtml +
				'<div class="row row-item" title="Edit or Delete Entry" entry-type="' + entry.type + '" adj-entry-id="' + entry.id + '">' +
				'<div class="col-2"><div class="dashboard-entry-box" entry-name="type" amount-type="' + entry.type + '">' + 
				'<div class="entry-type">' + entry.type + '</div></div></div>' +
				'<div class="col-6"><div class="dashboard-entry-box" entry-name="name"><p entry-name="name">' + 
				entry.name + '</p><p entry-name="date-range">(' + moment(entry.startDate).format('L') +
				' - ' + moment(entry.endDate).format('L') + ')</p></div></div>' +
				'<div class="col-2"><div class="dashboard-entry-box" entry-name="amount" amount-type="' + entry.type + '">$' + entry.amount + '</div></div>' +
				'<div class="col-4"><div class="dashboard-entry-box" entry-name="period">' + pluralType + ' on ' + dayOrdinal + '</div></div>' +
				'</div>';
		})
	} else {
		dashboardHtml += '<div class="col-14 no-entries">' +
			'Add a new income or expense to get started. ' +
			'View "Report" to see your future balances.</div>';
	}

	$('#js-container').html(dashboardHtml);
}

function renderEditEntryForm (entryId) {

	var entry = $.grep(DASH_USER.adjustmentEntries, function(entry){ return entry.id === entryId});
	entry = entry[0];

	var windowHtml = '<div class="pop-window-background">' +
		'<div class="pop-window">' +
		'<form class="edit-adj-form">' +
		'<label for="name">Name</label>' +
		'<input type="text" name="name" id="name" value="' + entry.name + '" required>' +
		'<label for="type">Expense or Income</label>';

	if (entry.type === 'Expense') {
		windowHtml += '<p><input type="radio" name="type" value="Expense" checked="checked"> Expense' +
			'<input type="radio" name="type" value="Income"> Income</p>';
	} else {			
		windowHtml += '<p><input type="radio" name="type" value="Expense"> Expense' +
		'<input type="radio" name="type" value="Income" checked="checked"> Income</p>';
	}

	windowHtml += '<label for="amount">Amount</label>' +
		'<input type="number" name="amount" id="amount" min="0" value="' + entry.amount + '" required>' +
		'<label for="period-unit">Repeats every</label>' +
		'<input type="number" name="periodUnit" id="period-unit" min="1" value="' + entry.periodUnit + '" required> ' +
		'<select id="period-type" name="periodType">';

	var types = ['week', 'month']; // add day(s) and year(s) functionality later

	types.forEach(function(t) {
		if (t === entry.periodType) {
			windowHtml += '<option value="' + t + '"" selected>' + t + '(s)</option>';
		} else {
			windowHtml += '<option value="' + t + '"">' + t + '(s)</option>';
		}
	});

	windowHtml += '</select>' +	
		'<label for="start-date">Start Date</label>' +
		'<input type="date" name="startDate" id="start-date" value="' + 
		moment(entry.startDate).format('YYYY-MM-DD') + '" required>' +
		'<label for="end-date">End Date</label>' +
		'<input type="date" name="endDate" id="end-date" value="' + moment(entry.endDate).format('YYYY-MM-DD') + '" required>' +
		'<button id="save">Save</button>' +
		'<button id="cancel">Cancel</button>' +
		'<button id="delete">Delete</button>' +		
		'<div class="message-box">' +
		'<span class="js-message"></span>' +
		'</div></form></div></div>';

	$('.js-pop-window').html(windowHtml);
	watchForEditEntryFormClicks(entryId);
}

function closePopWindow() {
	$('.js-pop-window').html('');
	$('.js-pop-window').off();
}

function renderNewEntryForm() {

	var today = moment().format('YYYY-MM-DD');

	var formHtml = '<div class="pop-window-background"><div class="pop-window">' +
		'<form class="new-adj-form"><label for="name">Name</label><input type="text" ' +
		'name="name" id="name" placeholder="Name for item" required><label for="type">' +
		'Expense or Income</label><p><input type="radio" name="type" value="Expense" checked="checked">' +
		' Expense<input type="radio" name="type" value="Income"> Income</p>' +
		'<label for="amount">Amount</label><input type="number" name="amount" min="0" id="amount" ' +
		'placeholder="$" required><label for="period-unit">Repeats every</label><input type="number" ' +
		'name="periodUnit" id="period-unit" value="1" min="1" required> <select id="period-type" name="periodType">' +
  		'<option value="week">week(s)</option>' +
  		'<option value="month" selected>month(s)</option>' +
  		'</select><label for="start-date">Start Date</label>' +
		'<input type="date" name="startDate" id="start-date" ' +
		'value="' + today + '"><label for="end-date">End Date</label><input type="date" name="endDate" ' +
		'id="end-date" value="2055-01-01">' +
		'<button id="save">Save</button>' +
		'<button id="cancel" value="cancel">Cancel</button><div class="message-box">' +
		'<span class="js-message"></span></div></form></div></div>';

		$('.js-pop-window').html(formHtml);

		watchForNewEntryFormClicks();
}

function renderNewBalanceForm() {

	var today = moment().format('YYYY-MM-DD');

	var formHtml = '<div class="pop-window-background"><div class="pop-window small-pop">' +
		'<form class="new-adj-form"><h2>Set New Balance</h2>' +
		'<label for="amount">Amount</label><input type="number" ' +
		'name="amount" id="amount" ' +
		'value="' + DASH_USER.mostRecentBalance.amount + '" required><label for="recent-balance-date">' +
		'Date</label><input type="date" name="date" ' +
		'id="date" value="' + today + '">' +
		'<button id="save">Save</button>' +
		'<button id="cancel" value="cancel">Cancel</button><div class="message-box">' +
		'<span class="js-message"></span></div></form></div></div>';

		$('.js-pop-window').html(formHtml);

		watchForNewBalanceFormClicks();
}

function renderConfirmEntryDelete(entryId) {

	var entryIndex = 0;
	var found;
	DASH_USER.adjustmentEntries.forEach(function(entry) {
		if (entryId === entry.id) {
			found = true;
		} else if (!found) {
			entryIndex++;
		}
	})

	var formHtml = '<div class="pop-window-background"><div class="pop-window confirm-delete">' +
		'<form class="new-adj-form"><h2>Confirm Delete?</h2>' +
		'<p>You are about to delete <b>' + DASH_USER.adjustmentEntries[entryIndex].name + '</b></p>' +
		'<button id="cancel" value="cancel">Cancel</button>' +
		'<button id="delete" value="delete">Delete</button><div class="message-box">' +
		'<span class="js-message"></span></div></form></div></div>';

		$('.js-pop-window').html(formHtml);

		watchForConfirmEntryDelete(entryId);

}

function watchForNewEntryFormClicks() {

	var endPoint = '../users/me/adjustment-entry';
	var method = 'POST';

	$('.new-adj-form').submit(function(event) {
		event.stopPropagation();
		event.preventDefault();
	});
	
	$('.js-pop-window').on('click', '#cancel', function(event) {
		event.stopPropagation();
		event.preventDefault();
		closePopWindow();
	});

	$('.js-pop-window').on('click', '#save', function(event) {
		event.stopPropagation();
		event.preventDefault();

		var formData = $('.new-adj-form').serializeArray();
		var newEntry = {};

		formData.forEach(function(o) {
			if (o.name === 'amount' || o.name === 'periodUnit') {
				newEntry[o.name] = Math.abs(o.value * 1);
			} else {
			newEntry[o.name] = o.value;
			}
		});

		sendUserData(newEntry, endPoint, method);
	})

}

function watchForNewBalanceFormClicks() {
	var endPoint = '../users/me/most-recent-balance';

	var method = "PUT";

	$('.new-adj-form').submit(function(event) {
		event.stopPropagation();
		event.preventDefault();
	});

	$('.js-pop-window').on('click', '#cancel', function(event) {
		event.stopPropagation();
		event.preventDefault();
		closePopWindow();
	});


	$('.js-pop-window').on('click', '#save', function(event) {
		event.stopPropagation();
		event.preventDefault();

		var formData = $('.new-adj-form').serializeArray();
		var newEntry = {};

		formData.forEach(function(o) {
			if (o.name === 'amount') {
				newEntry[o.name] = Math.abs(o.value * 1);
			} else {
			newEntry[o.name] = o.value;
			}
		});

		newEntry = { mostRecentBalance: {
			amount: newEntry.amount,
			date: newEntry.date
		}}

		sendUserData(newEntry, endPoint, method);
	})

}

function watchForConfirmEntryDelete(entryId) {

	var endPoint = '../users/me/adjustment-entry';
	var method = "PUT";

	$('.js-pop-window').on('click', '#cancel', function(event) {
		event.stopPropagation();
		event.preventDefault();
		closePopWindow();
	});

	$('.js-pop-window').on('click', '#delete', function(event) {
		event.stopPropagation();
		event.preventDefault();
		deleteEntry(entryId, endPoint);
	})
}

function watchForEditEntryFormClicks(entryId) {

	var endPoint = '../users/me/adjustment-entry';

	var method = "PUT";

	$('.edit-adj-form').submit(function(event) {
		event.stopPropagation();
		event.preventDefault();
	});
	
	$('.js-pop-window').on('click', '#cancel', function(event) {
		event.stopPropagation();
		event.preventDefault();
		closePopWindow();
	});

	$('.js-pop-window').on('click', '#delete', function(event) {
		event.stopPropagation();
		event.preventDefault();
		closePopWindow();
		renderConfirmEntryDelete(entryId);
	})

	$('.js-pop-window').on('click', '#save', function(event) {
		event.stopPropagation();
		event.preventDefault();

		var formData = $('.edit-adj-form').serializeArray();
		var newEntry = {};
		newEntry.id = entryId;

		formData.forEach(function(o) {
			if (o.name === 'amount' || o.name === 'periodUnit') {
				newEntry[o.name] = Math.abs(o.value * 1);
			} else {
			newEntry[o.name] = o.value;
			}
		});

		sendUserData(newEntry, endPoint, method);
	})

}

function watchForAddNewClicks() {
	$('#js-container').on('click', '.plus-sign, .add-item', function(event) {
		event.stopPropagation();
		event.preventDefault();
		renderNewEntryForm();
	});
}

function watchForSetNewBalance() {
	$('#js-container').on('click', '.js-previous-balance', function(event) {
		event.stopPropagation();
		event.preventDefault();
		renderNewBalanceForm();
	});
}


function watchForRowClicks() {
	$('#js-container').on('click', '.row-item', function(event) {
	event.stopPropagation();
	event.preventDefault();
	var entryId = $(this).attr('adj-entry-id');
	renderEditEntryForm(entryId);
	});
}

$(watchForAddNewClicks());

$(watchForSetNewBalance());

$(watchForRowClicks());

$(getUser(renderDashboard));
