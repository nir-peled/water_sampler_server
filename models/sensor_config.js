const mongoose = require('mongoose');

const ConfigSchema = new mongoose.Schema({
	hardware: {
		input_selectors: {
			type: Map, 
			of: Number
		}, 
		output_selectors: {
			type: Map, 
			of: Number
		}, 
		interrupts: {
			type: Map, 
			of: {
				port: {
					type: Number, 
					required: true
				}, 
				mode: String, 
				seek: String, 
				debounce: Number
			}
		}
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
			actions: {
				type: Map, 
				of: {type: Map, of: Boolean}, 
				required: true
			}
		}]
	}]
});

const SensorConfig = mongoose.model("SensorConfig", ConfigSchema);

module.exports = SensorConfig;
