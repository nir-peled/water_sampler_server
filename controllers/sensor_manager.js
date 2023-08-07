"user strict";

const express = require("express");
const multer = require("multer");

/*
 * the sensor manager manages the connections with the sensor units
 * currently it's a dummy
 */
class SensorManager {
	#server;
	#updates;
	#app;
	#upload;
	#uri;
	#port;
	constructor(server, config) {
		this.#server = server;
		this.#app = express();
		this.#upload = multer({ dest: "../images" });
		this.#uri = config.uri;
		this.#port = config.port;
		this.#setup_app();
	}

	async config_sensor(sensor_name, config_data) {
		console.log(`configure sensor ${sensor_name} with config: `); // debug
		console.log(JSON.stringify(config_data)); // debug
		if (!this.#updates[sensor_name]) this.#updates[sensor_name] = {};

		this.#updates[sensor_name].config = config_data;
	}

	async start_manual_test(sensor_name) {
		console.log(`start manual test of ${sensor_name}`); // debug
		if (!this.#updates[sensor_name]) this.#updates[sensor_name] = {};

		this.#updates[sensor_name].manual_start = true;
	}

	#setup_app() {
		this.#app.use(express.json());

		this.#app.get("/updates", (request, response) => {
			let sensor_name = request.query.sensor_name;
			let sensor_updates = this.#updates[sensor_name];
			if (!sensor_updates) return response.json({});

			this.#updates[sensor_name] = null;
			response.json(sensor_updates ? sensor_updates : {});
		}); // get updates

		this.#app.post(
			"/test",
			this.#upload.array("images"),
			(request, response) => {
				let sensor_name = request.body.sensor_name;
				let test_data = request.body.test_data;
				let picture_paths = request.files.map((file) => file.path);

				this.#server
					.database()
					.add_test(sensor_name, test_data, picture_paths)
					.then(() => response.status(200).send("OK"))
					.catch((err) => {
						console.log(err); // debug
						response.status(500).send(err);
					});
			}
		); // post test
	}

	start() {
		this.#app.listen(this.#port, () => {
			console.log(`server listening on ${this.full_url()}`);
		});
	}

	full_url() {
		return "http://" + this.#uri + ":" + this.#port;
	}
}

module.exports = SensorManager;
