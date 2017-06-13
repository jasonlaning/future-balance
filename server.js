const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const {router: usersRouter} = require('./users/router');

mongoose.Promise = global.Promise;

const {PORT, DATABASE_URL} = require('./config');

const app = express();

app.use('/spin', express.static(__dirname + '/node_modules/spin/'));

app.use('/moment', express.static(__dirname + '/node_modules/moment/'));

app.use(express.static('public'));

app.use(morgan('common'));

app.use('/users', usersRouter);

app.get('/', (req, res) => {
	res.sendFile(__dirname + '/public/index.html');
});

let server;

function runServer(databaseUrl, port=PORT) {
	return new Promise((resolve, reject) => {
		mongoose.connect(databaseUrl, err => {
			if (err) {
				return reject(err);
			}
			server = app.listen(port, () => {
				console.log(`Your app is listening on port ${port} and using database ${databaseUrl}`);
				resolve();
			})
			.on('error', err => {
				mongoose.disconnect();
				reject(err);
			});
		});
	});
}

function closeServer() {
	return mongoose.disconnect().then(() => {
		return new Promise((resolve, reject) => {
			console.log('Closing server');
			server.close(err => {
				if (err) {
					return reject(err);
				}
			resolve();
			});
		});
	});
}

if (require.main === module) {
	runServer(DATABASE_URL).catch(err => console.error(err));
};

module.exports = {app, runServer, closeServer};