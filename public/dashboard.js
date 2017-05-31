'use strict';

function renderDashboard(adjustmentData) {
	var dashboardHTML = '<div class="row"><div class="col-2 outlined"><div class="dashboard-box bolded">Type</div></div>' +
						'<div class="col-4 outlined"><div class="dashboard-box bolded">Name</div></div>' +
						'<div class="col-2 outlined"><div class="dashboard-box bolded">Amount</div></div>' +
						'<div class="col-2 outlined"><div class="dashboard-box bolded">Repeat Period</div></div>' +
						'<div class="col-2 outlined"><div class="dashboard-box bolded">Start Date</div></div>' +
						'<div class="col-2 outlined"><div class="dashboard-box bolded">End Date</div></div>' +
						'</div>';

	adjustmentData.adjustmentEntries.forEach(function(entry) {
		dashboardHTML += '<div class="row"><div class="col-2 outlined"><div class="dashboard-box">' + entry.type + '</div></div>' +
						'<div class="col-4 outlined"><div class="dashboard-box">' + entry.name + '</div></div>' +
						'<div class="col-2 outlined"><div class="dashboard-box">' + entry.amount + '</div></div>' +
						'<div class="col-2 outlined"><div class="dashboard-box">' + entry.periodUnit + ' ' + entry.periodType + '</div></div>' +
						'<div class="col-2 outlined"><div class="dashboard-box">' + moment(entry.startDate).format('L') + '</div></div>' +
						'<div class="col-2 outlined"><div class="dashboard-box">' + moment(entry.endDate).format('L') + '</div></div>' +
						'</div>';
	})

	$('main').html(dashboardHTML);

}

renderDashboard(MOCK_ADJUSTMENTS);