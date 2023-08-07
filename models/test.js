"use strict";

const mongoose = require("mongoose");

const TestSchema = new mongoose.Schema({
	sensor: {
		type: mongoose.ObjectId,
		ref: "Sensor",
		required: true,
	},
	pictures: [
		{
			path: String,
			classification: Number,
		},
	],
	timers: [
		{
			name: String,
			time: Number,
		},
	],
	classification: Number,
});

const Test = mongoose.model("Test", TestSchema);

module.exports = Test;
