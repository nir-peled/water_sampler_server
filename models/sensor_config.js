const mongoose = require('mongoose');

const portSchema = new mongoose.Schema({
	name: {
		type: String, 
		required: true
	}, 
	port: {
		type: Number, 
		required: true
	}
});

const ConfigSchema = new mongoose.Schema({
	hardware: {
		input_selectors: [portSchema], 
		output_selectors: [portSchema], 
		operands: [portSchema],
		interrupts: [{
			port: {
				type: portSchema,
				required: true
			}, 
			mode: String, 
			counter: Number,
			seek: String, 
			debounce: Number
		}]
	}, 
	plans: [{
		name: {
			type: String, 
			required: true
		},
		comments: String, 
		steps: [{
			name: {
				type: String, 
				required: true
			}, 
			interrupt: String,
			interval: {
				type: Number, 
				required: true
			},
			actions: [{
				port_name: String, 
				state: Boolean
			}]
		}]
	}]
});

// const SensorConfig = mongoose.model("SensorConfig", ConfigSchema);

// module.exports = SensorConfig;
module.exports = ConfigSchema;
