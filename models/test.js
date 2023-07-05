'use strict';

const mongoose = require('mongoose');

const TestSchema = new mongoose.Schema({
	sensor: {
		type: mongoose.ObjectId, 
		ref: "Sensor",
		required: true
	}, 
	pictures: [{
		type: mongoose.ObjectId, 
		ref: "Picture"
	}], 
	classification: Number
});

const Test = mongoose.model("Test", TestSchema);
