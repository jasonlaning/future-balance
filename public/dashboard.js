'use strict';

function renderDashboard(adjustmentData) {
	var dashboardHTML = '<div class="row row-heading"><div class="col-2"><div class="dashboard-header-box bolded">Type</div></div>' +
						'<div class="col-4"><div class="dashboard-header-box bolded">Name</div></div>' +
						'<div class="col-2"><div class="dashboard-header-box bolded">Amount</div></div>' +
						'<div class="col-2"><div class="dashboard-header-box bolded">Period</div></div>' +
						'<div class="col-2"><div class="dashboard-header-box bolded">Start Date</div></div>' +
						'<div class="col-2"><div class="dashboard-header-box bolded">End Date</div></div>' +
						'</div>';

	adjustmentData.adjustmentEntries.forEach(function(entry) {
		dashboardHTML += '<div class="row row-item"><div class="col-2"><div class="dashboard-entry-box">' + 
						'<div class="edit-button">Edit</div><div class="delete-button">Remove</div>' + entry.type + '</div></div>' +
						'<div class="col-4"><div class="dashboard-entry-box">' + entry.name + '</div></div>' +
						'<div class="col-2"><div class="dashboard-entry-box">' + entry.amount + '</div></div>' +
						'<div class="col-2"><div class="dashboard-entry-box">' + entry.periodUnit + ' ' + entry.periodType + '</div></div>' +
						'<div class="col-2"><div class="dashboard-entry-box">' + moment(entry.startDate).format('L') + '</div></div>' +
						'<div class="col-2"><div class="dashboard-entry-box">' + moment(entry.endDate).format('L') + '</div></div>' +
						'</div>';
	})

	$('#js-container').html(dashboardHTML);

}

renderDashboard(MOCK_ADJUSTMENTS);