'use strict';

const mongoose = require('mongoose');

const PictureSchema = new mongoose.Schema({
	path: {
		type: String, 
		unique: true,
		required: true
	},
	test: mongoose.ObjectId,
	classification: Number
});

const Picture = mongoose.model("Picture", PictureSchema);

module.exports = Picture;
