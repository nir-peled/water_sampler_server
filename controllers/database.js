'user strict';

const mongoose = require('mongoose');

const ROLES = ["user", "admin"];

// model for User
const {User, Sensor, Test, Picture} = require("../models/models");

class Database {
	#models;
	#url;
	constructor(url) {
		this.#url = url;
	}

	async connect() {
		await mongoose.connect(this.#url, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
		});
		console.log("Database Connected"); // debug
	}

	// maybe don't?
	models() {
		return this.#models;
	}

	roles() {
		return roles;
	}

	async create_user(username, password, role=ROLES[0]) {
		let user = await User.create({
			username: username, 
			password: password, 
			role:role
		});
		await user.save();
		return user;
	}

	async get_user(username) {
		return await User.findOne({username}).catch(err => null);
	}

	async delete_user(username) {
		await User.deleteOne({username});
	}

	async get_user_list(filter={}) {
		let users = await User.find(filter,
		 {username:1, role:1}).exec().catch(err => null);
		return users;
	}

	async get_sensor_list(filter={}) {
		let sensors = await Sensor.find(filter).exec()
		.catch(err => null);
		return sensors;
	}

	async get_sensor(sensor_name) {
		return await Sensor.findOne({sensor_name}).catch(err => null);
	}
}

module.exports = Database;
