'use strict';

const mongoose = require('mongoose');

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
	}
});

const Sensor = mongoose.model("Sensor", SensorSchema);
