'use strict';

const Listener = require('./listener');
const Database = require('./database');
const Authenticator = require('./authenticator');
const SensorManager = require('./sensor_manager');
const config = require('../configs/server.config');

class Server {
	#listener;
	#database;
	#authenticator;
	#sensor_manager;
	constructor(config) {
		this.#database = new Database(config.database_url);
		this.#listener = new Listener(this, config.uri, config.port);
		this.#authenticator = null;
		this.#sensor_manager = new SensorManager(this);
	}

	async start() {
		await this.#database.connect()
		if (!this.#authenticator)
			this.#authenticator = new Authenticator(this.#database);
		this.#listener.start();
	}

	database() {
		return this.#database;
	}

	authenticator() {
		return this.#authenticator;
	}

	sensor_manager() {
		return this.#sensor_manager;
	}

	create_authenticator() {
		this.#authenticator = new Authenticator(this.#database);
	}
}

var server = new Server(config);
server.start();
