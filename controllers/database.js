"user strict";

const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs/promises");

const ROLES = ["user", "admin"];

// model for User
const { User, Sensor, Test, Picture } = require("../models/models");

class Database {
	#models;
	#url;
	constructor(config) {
		this.#url = config.url;
		this.#images = config.image_folder;
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

	async create_user(username, password, role = ROLES[0]) {
		let user = await User.create({
			username: username,
			password: password,
			role: role,
		});
		await user.save();
		return user;
	}

	async get_user(username) {
		return await User.findOne({ username }).catch((err) => null);
	}

	async delete_user(username) {
		await User.deleteOne({ username });
	}

	async get_user_list(filter = {}) {
		let users = await User.find(filter, { username: 1, role: 1 })
			.exec()
			.catch((err) => null);
		return users;
	}

	async get_sensor_list(filter = {}) {
		let sensors = await Sensor.find(filter)
			.exec()
			.catch((err) => null);
		return sensors;
	}

	async get_sensor(sensor_name, filter = {}) {
		return await Sensor.findOne({ name: sensor_name }, filter)
			.exec()
			.catch((err) => null);
	}

	async set_sensor_config(sensor_name, config) {
		console.log(`saving config for sensor ${sensor_name}`); // debug
		console.log(JSON.stringify(config)); // debug

		let sensor = await this.get_sensor(sensor_name);
		if (!sensor) throw Error(`sensor \"${sensor_name}\" not found`);

		sensor.config = config;
		await sensor.save();
		return sensor;
	}

	async add_test(sensor_name, test_data, image_paths) {
		let sensor = await this.get_sensor(sensor_name);
		if (!sensor) throw Error(`sensor \"${sensor_name}\" not found`);

		let test_id = test._id;
		let new_paths = [];

		for (let i in image_paths) {
			let file_path = image_paths[i];

			let file_extention = path.extname(file_path).toLowerCase();
			let new_path = `${this.#images}/${test_id}/${i}${file_extention}`;
			await fs.rename(file_path, new_path);

			new_paths.push({ path: new_path });
		}

		let test = await Test.create({
			sensor: sensor._id,
			pictures: new_paths,
			timers: test_data.timers,
			date: test_data.date,
		});
		await test.save();
	}
}

module.exports = Database;
