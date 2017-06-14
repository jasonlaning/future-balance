'use strict';

var REPORT = {
	nextRenderDate: moment().date(1), // initialize to first day of current month
	adjustments: {},
	balances: {}
};

function getAdjustments(callbackFn) {

	var settings = {
	  url: "../users/me",
	  method: "GET",
	  headers: {
	    'content-type': "application/json"
	  }
	};

	var opts = {opacity: 0.05};
	var target = document.getElementById('js-loader');
    var spinner = new Spinner(opts).spin(target);

    $('#js-loader').append('<p class="spinner-message"><i>generating report</i></p>');

	$.ajax(settings).done(function(response) {
		if (response.user) {
			REPORT.mostRecentBalance = response.user.mostRecentBalance;
			callbackFn(response.user);
		}
		else {
			window.location = response.redirect;
		}
	});
}

function calculateAdjustments(adjustmentsData) {

	REPORT.mostRecentBalance = adjustmentsData.mostRecentBalance;
	var adjustments = adjustmentsData.adjustmentEntries;
	var dateCounter = moment(adjustmentsData.mostRecentBalance.date);
	var toDate = moment().add(1, 'years');
	var today = moment();

	console.log(adjustmentsData);

	console.log('datecounter before ', dateCounter);

	console.log('today before ', today);

	for (dateCounter; dateCounter.isBefore(moment(toDate).add(1, 'days')); dateCounter.add(1, 'days')) {
		adjustments.forEach(function(adj) {
			var adjStart = moment(adj.startDate);
			var adjEnd = moment(adj.endDate);
			if (dateCounter.isAfter(moment(adjStart.clone()).subtract(1, 'days')) && dateCounter.isBefore(moment(adjEnd).add(1, 'days'))) {
				if ((adj.periodType === 'month') && (adjStart.format('D') === dateCounter.format('D')) && ((dateCounter.diff(adjStart, 'months')) % adj.periodUnit === 0)) {
					if (REPORT.adjustments[dateCounter.format('YYYY-MM-DD')]) {
						REPORT.adjustments[dateCounter.format('YYYY-MM-DD')].push(adj);
					}
					else {
						REPORT.adjustments[dateCounter.format('YYYY-MM-DD')] = [adj];
					}
				}
				console.log('week compare: ', dateCounter, adj.Start);
				if ((adj.periodType === 'week') && (adjStart.format('ddd') === dateCounter.format('ddd')) && ((dateCounter.diff(adjStart, 'weeks')) % adj.periodUnit === 0)) {
					if (REPORT.adjustments[dateCounter.format('YYYY-MM-DD')]) {
						REPORT.adjustments[dateCounter.format('YYYY-MM-DD')].push(adj);
					}
					else {
						REPORT.adjustments[dateCounter.format('YYYY-MM-DD')] = [adj];
					}
				}
			}

		});

	}
	console.log(REPORT.adjustments);
	calculateForecast(REPORT.adjustments);
}


function calculateForecast(adjustments) {

	var toDate = moment().add(1, 'years');
	var dateCounter = moment(REPORT.mostRecentBalance.date);
	var currentBalance = REPORT.mostRecentBalance.amount;
	var balanceChanged;

	if (!dateCounter || typeof(currentBalance) !== 'number') {
		$('main').html('No data for report.');
	}

	else {

		for (dateCounter; dateCounter.isBefore(moment(toDate).add(1, 'days')); dateCounter.add(1, 'days')) {
			var adjustments = REPORT.adjustments[dateCounter.format('YYYY-MM-DD')];
			if (adjustments) {
				var newBalance = currentBalance;
				adjustments.forEach(function(adj) {
					if (adj.type === 'Income') {
						newBalance += adj.amount;
					} else {
						newBalance -= adj.amount;
					}
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
			REPORT.balances[dateCounter.format('L')] = {
				amount: currentBalance, 
				changeType: balanceChanged
			};
		}
		renderForecast(REPORT.balances);
	}
}

function roundNumber(number, decimalPlaces) {
	decimalPlaces = Math.abs(parseInt(decimalPlaces)) || 0;
	var multiplier = Math.pow(10, decimalPlaces);
	return (Math.round(number * multiplier) / multiplier).toFixed(2);
}

function renderForecast(forecastData) {

	var forecastHtml = '';
	var dateCounter = REPORT.nextRenderDate;
	var totalMonths = 12; // months to render at one time
	var currentMonth = '';
	var weekDays = moment.weekdays();
	var weekDaysShort = moment.weekdaysShort();
	var today = moment().format('YYYY-MM-DD'); //removed .format('L')
	var isToday = '';
	var monthDays;
	var weekdayCounter;
	var firstWeekdayOfMonth;

	// set html for detail pop-up for dates that have adjustments

	var detailHtml = '<div class="detail">(detail)</div>';

	var changeTypeHtml = {
		'balance-same': 'balance-same">',
		'balance-increased': 'balance-increased">' + detailHtml,
		'balance-decreased': 'balance-decreased">' + detailHtml
	}

	for (var monthcounter = 1; monthcounter <= totalMonths; monthcounter++) {

		currentMonth = dateCounter.format('MMMM');
	
		monthDays = dateCounter.daysInMonth();

		// make month header and start row for days-of-week header
		forecastHtml += '<header class="row month-row">' + 
			'<div class="col-14"><div class="date-box"><h2>' + currentMonth + 
			' ' + dateCounter.format('YYYY') + '</h2></div></div></header>' +
			'<div class="row days-header">';

		// make days-of-week header for the month
		for (var i = 0; i < 7; i++) {
			forecastHtml += '<div class="col-2"><div class="date-box ' +
			weekDaysShort[i] + '">' + weekDaysShort[i]  + '</div></div>'
		};

		// end days-of-week header row and start new row
		forecastHtml += '</div><div class="row report-row">';

		weekdayCounter = 0;
		firstWeekdayOfMonth = dateCounter.date(1).format('dddd');

		// make empty date boxes until first of month
		while (weekDays[weekdayCounter] !== firstWeekdayOfMonth) {
			forecastHtml += '<div class="col-2"><div class="date-box empty ' + 
			weekDays[weekdayCounter] + '"></div></div>';
			weekdayCounter++;
		}

		var dayOfWeek;
		var changeTypeTag = '';
		var thisAmount;

		// make boxes for every day in month                                                    moment error bet 180 and 209?
		for (var i = 1; i <= monthDays; i++) {

			if (dateCounter.format('YYYY-MM-DD') === today) {
				isToday = 'today';
			} else if (dateCounter.isBefore(today)) {
				isToday = 'before-today';
			} else {
				isToday = '';
			};

			dayOfWeek = dateCounter.format('dddd');
			// start a new row on Sundays
			if (dayOfWeek === 'Sunday' && i != 1) {
				forecastHtml += '<div class="row report-row">'
			};

			var todayForecastData = {};

			if (forecastData[dateCounter.format('L')]) {
				todayForecastData = forecastData[dateCounter.format('L')];
			} else {
				todayForecastData = {
					amount: '',
					changeType: 'balance-same'
				}
			};

			thisAmount = todayForecastData.amount;

			if ((thisAmount % 1) !== 0) {
				thisAmount = roundNumber(thisAmount, 2);
			}
			console.log(thisAmount);

			changeTypeTag = changeTypeHtml[todayForecastData.changeType];

			forecastHtml += '<div class="col-2"><div entry-date="' + dateCounter.format('YYYY-MM-DD') + '" ' +
				'class="date-box ' + dateCounter.format('dddd') + ' ' + isToday + ' ' +
				changeTypeTag + '<div class="date-num">' + dateCounter.format('D') +
				'</div><div class="balance">' + thisAmount + '</div></div></div>';

			// end row if Saturday
			if (dayOfWeek === 'Saturday'){
				forecastHtml += '</div>';
			}
			

			dateCounter = dateCounter.add(1, 'days');
		}

		// if month doesn't end on saturday, fill week with blank boxes
		if (dayOfWeek !== 'Saturday') {
			// find weekday index of last day rendered
			var counter = 0;
			weekDays.forEach(function(day) {
				if (dayOfWeek == day) {
					weekdayCounter = counter;
				}
				counter++;
			});		

			// increment to next day to be rendered
			weekdayCounter++;

			while (weekdayCounter < 7) {
				forecastHtml += '<div class="col-2"><div class="date-box empty ' + 
				weekDays[weekdayCounter] + '"></div></div>';
				weekdayCounter++;
			}
			$('.spinner').remove();
			$('.spinner-message').remove();
			forecastHtml += '</div>'; // end the last week row of the month
		}

	}

	REPORT.nextRenderDate = dateCounter;

	$('main').html(forecastHtml);

}

function renderDetail(thisDateBox) {

	var date = thisDateBox.attr('entry-date');
	var detailHtml = '<div class="pop-window-background">' +
		'<div class="pop-window ">' +
		'<div class="detail-pop"><h2>Details for ' + moment(date).format('MMM Do, YYYY') + '</h2><ol>';

	REPORT.adjustments[date].forEach(function(adj) {
		detailHtml += '<li>' + adj.name + ' (' + adj.type + '), $' + adj.amount + '</li>';
	})

	detailHtml += '</ol></div></div></div>';

	thisDateBox.append(detailHtml);

	$('main').one('click', '.pop-window-background', function(event) {
		event.stopPropagation();
		$('.pop-window-background').remove();
		watchForDetailClicks();
	});
}

function getAdjustmentsAndCalculateAdjustments() {
	$('.js-loader').toggleClass('hide');
	getAdjustments(calculateAdjustments);
}

function watchForDetailClicks() {
	$('main').one('click', '.balance-increased, .balance-decreased', function(event) {
		event.stopPropagation();
		//$(this).off();
		//$('main').off();
		renderDetail($(this));

	})

	/*$('main').on('mouseleave', '.col-2 .balance-increased', function(event) {
		event.stopProgagation();
		$(this).find('.detail-pop').toggleClass('hide');
	})*/
}

$(watchForDetailClicks());

$(getAdjustmentsAndCalculateAdjustments());