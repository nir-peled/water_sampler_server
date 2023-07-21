'use strict';

const mongoose = require('mongoose');
const ConfigSchema = require('./sensor_config');

const SensorSchema = new mongoose.Schema({
	name: {
		type: String, 
		unique: true,
		required: true
	}, 
	location: {
		type: String, 
		required: true
	}, 
	status: {
		type: String, 
		required: true
	}, 
	config: ConfigSchema
});

const Sensor = mongoose.model("Sensor", SensorSchema);

module.exports = Sensor;
