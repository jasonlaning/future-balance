'use strict';

var state = {
	lastRenderedDate: moment().subtract(1, 'days'),
	adjustments: {},
	balances: {}
};

function getAdjustments(callbackFn) {

	//setTimeout(function(){ callbackFn(MOCK_ADJUSTMENTS)}, 100);
	var settings = {
	  url: "../users/",
	  method: "GET",
	  headers: {
	    'content-type': "application/json"
	  }
	};

	$.ajax(settings).done(function(response) {
		console.log("response is: ", response.user);
		if (response.user) {
			state.mostRecentBalance = response.user.mostRecentBalance;
			console.log('state.mostRecentBalance ', state.mostRecentBalance);
			callbackFn(response.user);
		}
		else {
			window.location = response.redirect;
		}
	});
}

function calculateAdjustments(adjustmentsData) {

	state.mostRecentBalance = adjustmentsData.mostRecentBalance;
	var adjustments = adjustmentsData.adjustmentEntries;//MOCK_ADJUSTMENTS.adjustmentEntries;
	var dateCounter = moment(adjustmentsData.mostRecentBalance.date);//moment(MOCK_ADJUSTMENTS.mostRecentBalance.date);
	var toDate = moment().add(1, 'years');
	var today = moment();

	for (dateCounter; dateCounter.isBefore(moment(toDate).add(1, 'days')); dateCounter.add(1, 'days')) {
		adjustments.forEach(function(adj) {
			var adjStart = moment(adj.startDate);
			//console.log(adjStart.format('D'));
			var adjEnd = moment(adj.endDate);
			if (dateCounter.isAfter(moment(adjStart.clone()).subtract(1, 'days')) && dateCounter.isBefore(moment(adjEnd).add(1, 'days'))) {
				if ((adj.periodType === 'month(s)') && (adjStart.format('D') === dateCounter.format('D')) && ((dateCounter.diff(adj.Start, 'months')) % adj.periodUnit === 0)) {
					if (state.adjustments[dateCounter]) {
						state.adjustments[dateCounter].push(adj);
					}
					else {
						state.adjustments[dateCounter] = [adj];
					}
				}
				if ((adj.periodType === 'week(s)') && (adjStart.format('ddd') === dateCounter.format('ddd')) && ((dateCounter.diff(adj.Start, 'weeks')) % adj.periodUnit === 0)) {
					if (state.adjustments[dateCounter]) {
						state.adjustments[dateCounter].push(adj);
					}
					else {
						state.adjustments[dateCounter] = [adj];
					}
				}
			}

		});

	}

	calculateForecast(state.adjustments);
}


function calculateForecast(adjustments) {

	var toDate = moment().add(1, 'years');
	var dateCounter = moment(state.mostRecentBalance.date);//moment(MOCK_ADJUSTMENTS.mostRecentBalance.date);
	var currentBalance = state.mostRecentBalance.amount;//MOCK_ADJUSTMENTS.mostRecentBalance.amount;
	var balanceChanged;

	if (!dateCounter || !currentBalance) {
		$('main').html('No data for report.');
	}

	else {

		for (dateCounter; dateCounter.isBefore(moment(toDate).add(1, 'days')); dateCounter.add(1, 'days')) {
			var adjustments = state.adjustments[dateCounter];
			if (adjustments) {
				var newBalance = currentBalance;
				adjustments.forEach(function(adj) {
					newBalance += adj.amount;
				})
				// check to see if gain or loss
				if (newBalance > currentBalance) {
					balanceChanged = 'balance-increased';
				}
				else {
					balanceChanged = 'balance-decreased';
				}
				currentBalance = newBalance
			}
			else {
				balanceChanged = 'balance-same';
			}
			state.balances[dateCounter.format('L')] = {
				amount: currentBalance, 
				changeType: balanceChanged
			};
		}
		renderForecast(state.balances);
	}
}

function renderForecast(forecastData) {

	var forecastHTML = '';
	var dateCounter = moment();
	var toDate = moment().add(8, 'weeks');

	console.log(forecastData);
	console.log(forecastData[dateCounter]);

	// display a row (week) at a time:
	var forecastHTML = '<div class="row report-row">';
	var daysRendered = 1;
	for (dateCounter; dateCounter.isBefore(moment(toDate)); dateCounter.add(1, 'days')) {
		if ((daysRendered - 1) % 7 === 0) {
			forecastHTML += '<div class="row report-row">'; // start new row after every 7 days
		}

		forecastHTML += '<div class="col-2"><div class="date-box ' + forecastData[dateCounter.format('L')].changeType + '"><div class="date-month">' +
						dateCounter.format('MMM') + '</div><div class="date-num">' + dateCounter.format('D') +
						'</div><div class="day-of-week">' +	dateCounter.format('dd') + '</div><span class="balance">' + forecastData[dateCounter.format('L')].amount + '</span></div></div>';
		
		if (daysRendered % 7 === 0) {
			forecastHTML += '</div>'; //ends row after 7 days
		}
		daysRendered++;

	}
	if (daysRendered % 7 !== 0) {
	forecastHTML += '</div>;' // ends the row after 7 days
	}

	state.lastRenderedDate = state.lastRenderedDate.add(daysRendered, 'days');


	$('main').html(forecastHTML);

}

function getAdjustmentsAndCalculateAdjustments() {
	getAdjustments(calculateAdjustments);
}

$(function() {
	getAdjustmentsAndCalculateAdjustments();
})