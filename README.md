# FutureBalance #

Tracks repeating expenses and income and generates a calendar report that predicts daily account balances. 

Live version: [https://future-balance.herokuapp.com/](https://future-balance.herokuapp.com/)
(free hosting and server sleeps, so may take a few seconds to wake up)
## Features ##

Users can:

- Try a demo account (unique instances of pre-populated sample entries)
- Create unique user account with username and password; login/logout
- Create, edit, save, and delete income and expenses
- Save name, type (income or expense), repeating unit and period (weeks/months), starting and ending dates
- Create, edit, save, and delete a new balance amount and date from which future balances will be calculated
- View report generated by saved income and expenses that predicts future balances based on saved income and expense data
- View details on calendar days that have an income or expense event in order to see what the events were

## Screenshots ##

![](https://raw.githubusercontent.com/jasonlaning/future-balance/master/public/images/screenshots.jpg)

## Users API ##

root path: /users

- '/login' 

	- GET for user to log in
		- required in req body:
			- { username: String, password: String }

- '/logout'

	- GET for user to sign out
		- destroys session, redirects to root

- '/sign-up'

	- POST to create new user account
		- required in req body:
			- { username: String, password: String }

- '/me'

	- GET to retrieve user data
		- protected, requires login/session cookie
		- returns:
			- { 
			- username: String,
			- firstName: String,
			- lastName: String,
			- mostRecentBalance: {
				- amount: Number,
				- date: String
				- }
			- adjustmentEntries: Array of objects:
				- { 
				- id: String,
				- name: String,
				- type: String (Expense or Income),
				- amount: Number,
				- periodUnit: Number,
				- periodType: String (week or month),
				- startDate: Date,
				- endDate: Date
				- }

				
	- DELETE to delete user
		- protected, requires login/session cookie
		- redirects to root
				
- '/me/username'

	- PUT to edit username
		- protected, rquires login/session cookie
		- required in req body: {username: String}

- '/me/most-recent-balance'

	- PUT to edit most recent balance
		- protected, requires login/session cookie
		- required in req body:
			- {
			- mostRecent Balance: {
				- amount: Number,
				- date: String
				- }
			- }
		- returns updated user data (see '/me' GET for format)
		

- '/me/adjustment-entry

	- POST for adding new entry
		- protected, requires login/session cookie
		- required fields in req body: name, type, amount, periodUnit, startDate, endDate
		- returns updated user data and new entry (see '/me' GET for format)

	- PUT for editing entry
		- protected, requires login/session cookie
		- required in req body: same fields at POST
		- returns updated user data (see '/me' GET for format)
	
	- DELETE for deleting entry
		- protected, requires login/session cookie
		- required in req body: {id: String}
		- returns updated user data (see '/me' GET for format)


## Tech ##

Back end: Node.js and Express with Mongo database and Mongoose; Mocha and Chai for testing

Front end: jQuery, Moment.js for dates, HTML5, CSS, and vanilla js

