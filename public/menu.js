'use strict';


function watchForXClicks() {
	$('.nav-items-wrap, .x').one('click', function() {
			$('.nav-items-wrap').hide(0, function() {
			$('.x').hide(0, function() {
				$('.burger').show();
				watchForBurgerClicks();
			});
		});
	});
}

function watchForBurgerClicks() {
	$('.burger').one('click', function() {
		$(this).hide(0, function() {
			$('.x').show();
			$('.nav-items-wrap').show();
			watchForXClicks();
		});
	});
}

$(watchForBurgerClicks());