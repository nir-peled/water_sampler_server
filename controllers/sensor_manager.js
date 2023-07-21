

/*
 * the sensor manager manages the connections with the sensor units
 * currently it's a dummy
*/
class SensorManager {
	#server;
	constructor(server) {
		this.#server = server;
	}

	async config_sensor(sensor_name, config_data) {
		console.log(`configure sensor ${sensor_name} with config: `);
		console.log(JSON.stringify(config_data));
	}

	async start_manual_test(sensor_name) {
		console.log(`start manual test of ${sensor_name}`);
	}
}

module.exports = SensorManager;
