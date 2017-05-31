// mock data here, to delete later and replace with request to API

// database will keep a "type" that is either Expense or Income, but will return a negative or positive number
// based on the type

var MOCK_ADJUSTMENTS = {
	"mostRecentBalance": {
		amount: 1200,
		date: "20170528"
	},
	"adjustmentEntries": [
		{
			"id": "1111111",
			"name": "Mortgage",
			"type": "Expense",
			"amount": -2000,
			"periodUnit": 1,
			"periodType": "month(s)",
			"startDate": "20170101",
			"endDate": "20250101"
		},
		{
			"id": "2222222",
			"name": "Groceries",
			"type": "Expense",
			"amount": -100,
			"periodUnit": 1,
			"periodType": "week(s)",
			"startDate": "20170101",
			"endDate": "20250101"
		},
		{
			"id": "3333333",
			"name": "Utilities",
			"type": "Expense",
			"amount": -200,
			"periodUnit": 1,
			"periodType": "month(s)",
			"startDate": "20170115",
			"endDate": "20250101"
		},
		{
			"id": "1111111",
			"name": "Paper Route",
			"type": "Income",
			"amount": 50,
			"periodUnit": 1,
			"periodType": "week(s)",
			"startDate": "20170101",
			"endDate": "20250101"
		},
		{
			"id": "2222222",
			"name": "NYU Job",
			"type": "Income",
			"amount": 1800,
			"periodUnit": 2,
			"periodType": "week(s)",
			"startDate": "20161230",
			"endDate": "20250101"
		},
		{
			"id": "3333333",
			"name": "Granny Unit Rental",
			"type": "Income",
			"amount": 1000,
			"periodUnit": 1,
			"periodType": "month(s)",
			"startDate": "20170115",
			"endDate": "20250101"
		}
	]
};