
var config;

$(document).ready(() => {
	let sensor_name = $("#sensor_name").val();
	create_config_page(sensor_name);

	$("#add-input-selector").click(() => 
		$("#input-selectors-list").append(add_new_port("input_selectors"))
	);
	$("#add-output-selector").click(() => 
		$("#output-selectors-list").append(add_new_port("output_selectors"))
	);
	$("#add-operand").click(() => 
		$("#operands-list").append(add_new_port("operands"))
	);
	$("#add-interrupt").click(() => 
		$("#operands-list").append(add_new_interrupt())
	);

	$("#save-config").click(() => {
		$.ajax(`/sensors/${sensor_name}/config.json`, {
			type: "POST", 
			data: JSON.stringify(config), 
			contentType: "application/json"
		}).done((data) => {
			alert("Configuration Saved");
			// window.location.href = "/sensors/all";
			window.location.href = data;
		}).fail((jqXHR, textStatus, errorThrown) => {
			console.log(errorThrown); // debug
			alert("Configuration Failed");
			$(".error-message").html(errorThrown);
		}); // ajax fail
	}); // save-config click
}); // document ready

function create_config_page(sensor_name) {
	$.getJSON(`/sensors/${sensor_name}/config.json`, (data) => {
		config = data;
		let hardware = config.hardware;

		hardware.input_selectors.forEach((port_data) => {
			$("#input-selectors-list").append(create_port_input(hardware.input_selectors, port_data));
		});
		hardware.output_selectors.forEach((port_data) => {
			$("#output-selectors-list").append(create_port_input(hardware.output_selectors, port_data));
		});
		hardware.operands.forEach((port_data) => {
			$("#operands-list").append(create_port_input(hardware.operands, port_data));
		});
		// $("#input-selectors-list").append(
		// 	hardware.input_selectors.map(create_port_input.bind(hardware.input_selectors))
		// );
		// $("#output-selectors-list").append(
		// 	hardware.output_selectors.map(create_port_input.bind(hardware.output_selectors))
		// );
		// $("#operands-list").append(
		// 	hardware.operands.map(create_port_input.bind(hardware.operands))
		// );
		$("#interrupts-list").append(
			hardware.interrupts.map(create_interrupt_input)
		);
		$("#plans-list").append(
			config.plans.map(create_plan_input)
		);
	}).fail((jqxhr, textStatus, error ) => {
		console.log(error); // debug
		$("#error-message").html(error);
	});
}

function add_new_port(collection) {
	let port_data = {name:"", port:0};
	config.hardware[collection].push(port_data);
	return create_port_input(config.hardware[collection], port_data);
}

function add_new_interrupt() {
	let interrupt_data = {
		port: {name:"", port:0}, 
		mode: "single", 
		seek: "rising", 
		counter: 0, 
		debounce: 10
	};
	config.interrupts.push(interrupt_data);
	return create_interrupt_input(interrupt_data);
}

function create_port_input(collection, port_data) {
	let item =  $("<li>", {class:"port-input list-group-item"});

	// Create the label and text input for "Name"
	$("<label>").text("Name: ").appendTo(item);
	$("<input>", {type: "text", value: port_data.name, class:"port-name"})
	.on('input', function() {
		port_data.name = $(this).val();
	}).appendTo(item);
	$("<br>").appendTo(item);

	// Create the label and number input for "Port"
	$("<label>").text("Port: ").appendTo(item);
	$("<input>", {type: "number", value: port_data.port, class:"port-num"})
	.on('input', function() {
		port_data.port = $(this).val();
	}).appendTo(item);
	$("<br>").appendTo(item);

	// Create the remove button
	$("<button>", {class: "ref-button item-remove-button"}).text("Remove").appendTo(item);
	$("<br>").appendTo(item);

	item.on("click", ".item-remove-button", function () {
		remove_from(collection, port_data);
		item.remove();
	});

	return item;
}

function create_interrupt_input(interrupt_data) {
	let item = create_port_input(null, interrupt_data.port)
	.removeClass("port-input").addClass("interrupt-input");
	$("<br>").appendTo(item);

	$("<label>").text("Seek Mode: ").appendTo(item);
	var seekModeSelect = $("<select>").on('change', function() {
		interrupt_data.seek = $(this).val();
	}).appendTo(item);
	$("<option>", {value: "rising"}).text("Rising").appendTo(seekModeSelect);
	$("<option>", {value: "falling"}).text("Falling").appendTo(seekModeSelect);
	$("<option>", {value: "both"}).text("Both").appendTo(seekModeSelect);
	seekModeSelect.val(interrupt_data.seek);
	$("<br>").appendTo(item);

	$("<label>").text("Mode: ").appendTo(item);
	var modeSelect = $("<select>").on('change', function() { 
		interrupt_data.mode = $(this).val();
	}).appendTo(item);
	$("<option>", {value: "single"}).text("Single").appendTo(modeSelect);
	$("<option>", {value: "counter"}).text("Counter").appendTo(modeSelect);
	modeSelect.val(interrupt_data.mode);
	$("<br>").appendTo(item);

	$("<label>").text("Counter To: ").appendTo(item);
	$("<input>", {type: "number", value: interrupt_data.counter})
	.on('input', function() {
		interrupt_data.counter = $(this).val();
	}).appendTo(item);
	$("<br>").appendTo(item);

	$("<label>").text("Debounce: ").appendTo(item);
	$("<input>", {type: "number", value: interrupt_data.debounce})
	.on('input', function() { 
		interrupt_data.debounce = $(this).val();
	}).appendTo(item);

	item.off("click", ".item-remove-button");
	item.on("click", ".item-remove-button", function () {
		remove_from(config.hardware.interrupts, interrupt_data)
		item.remove();
	});

	return item;
}

function create_step_input(steps, step_data) {
	let item =  $("<li>", {class:"step-input list-group-item"});

	$("<button>", {class: "ref-button item-add-button"}).text("Add Step")
	.click(function () {
		let new_step = {};
		let i = steps.indexOf(step_data);
		steps.splice(i, 0, new_step);
		item.before(create_step_input(steps, new_step));
	}).appendTo(item);
	$("<br>").appendTo(item);

	// step name
	$("<label>").text("Step Name: ").appendTo(item);
	$("<input>", {type: "text",value: step_data.name}).on('input', function(){
		step_data.name = $(this).val();
	}).appendTo(item);
	$("<br>").appendTo(item);

	// step interval
	$("<label>").text("Interval: ").appendTo(item);
	$("<input>", {type: "number", value: step_data.interval}).on('input', function () {
		step_data.interval = $(this).val();
	}).appendTo(item);
	$("<br>").appendTo(item);

	// step interrupt
	$("<label>").text("Interrupt: ").appendTo(item);
	let has_interrupt = step_data.interrupt && step_data.interrupt.length > 0;
	// step interrupt checkbox (ignore interrupt value if unchecked)
	$("<input>", {type: "checkbox", checked: has_interrupt, class: "step-interrupt-checkbox"})
	.change(function () {
		if ($(this).is(":checked"))
			step_data.interrupt = $(this).parent().children(".step-interrupt-name").val();
		else
			step_data.interrupt = null;
	})
	.appendTo(item);
	// step interrupt value (ignored if checkbox is unchecked)
	$("<input>", {type: "text", value: step_data.interrupt, class: "step-interrupt-name"})
	.on("input", function () {
		let interrupt_checkbox = $(this).parent().children(".step-interrupt-checkbox");
		if (interrupt_checkbox.is(":checked"))
			step_data.interrupt = $(this).val();
	})
	.appendTo(item);
	$("<br>").appendTo(item);

	// list of step actions
	$("<label>").text("Actions: ").appendTo(item);
	let action_list = $("<ul>").appendTo(item);
	if (step_data.actions && Array.isArray(step_data.actions)) {
		step_data.actions.forEach(function (action_data) {
			action_list.append(create_step_action_input(step_data.actions, action_data));
		});
	}

	$("<button>", {class: "ref-button"}).text("Add Action")
	.click(function () {
		let new_action = {port_name:"", state:false};

		if (!(step_data.actions instanceof Array))
			step_data.actions = [];
		step_data.actions.push(new_action);

		action_list.append(create_step_action_input(step_data.actions, new_action));
	}).appendTo(item);
	$("<br>").appendTo(item);

	$("<button>", {class: "ref-button item-remove-button"}).text("Remove Step").appendTo(item);
	$("<br>").appendTo(item);
	

	item.on("click", ".item-remove-button", function () {
		remove_from(steps, step_data);
		item.remove();
	});

	return item;
}

function create_step_action_input(actions, action_data) {
	var action_item = $("<li>", {class: "list-group list-group-flush"});

	$("<label>").text("Port: ").appendTo(action_item);
	$("<input>", {type: "text", value: action_data.port_name})
	.on('input', function() {
		action_data.port_name = $(this).val();
	}).appendTo(action_item);

	$("<label>").text("On/Off").appendTo(action_item);
	$("<input>", {type: "checkbox", checked: action_data.state})
	.change(function() {
		action_data.state = $(this).is(":checked");
	}).appendTo(action_item);
	$("<br>").appendTo(action_item);

	$("<button>", {class: "ref-button item-remove-button"})
	.text("Remove Action").appendTo(action_item);
	$("<br>").appendTo(action_item);

	action_item.on("click", ".item-remove-button", function () {
		remove_from(actions, action_data);
		action_item.remove();
	});

	return action_item;
}

function create_plan_input(plan_data) {
	var item = $("<li>", {class: "list-group-item"});
	$("<button>", {class: "ref-button item-remove-button"})
	.text("Remove Plan").appendTo(item);
	$("<br>").appendTo(item);
	item.on("click", ".item-remove-button", function () {
		remove_from(config.plans, plan_data);
		item.remove();
	});

	$("<label>").text("Plan Name: ").appendTo(item);
	$("<input>", {type: "text",value: plan_data.name}).on('input', function(){
		plan_data.name = $(this).val();
	}).appendTo(item);
	$("<br>").appendTo(item);

	$("<label>").text("Plan Comments: ").appendTo(item);
	$("<textarea>").text(plan_data.comments).on('input', function(){
		plan_data.comments = $(this).text();
	}).appendTo(item);
	$("<br>").appendTo(item);

	$("<label>").text("Steps: ").appendTo(item);
	let step_list = $("<ol>").appendTo(item);
	if (plan_data.steps && Array.isArray(plan_data.steps)) {
		plan_data.steps.forEach(function (step_data) {
			step_list.append(create_step_input(plan_data.steps, step_data));
			$("<br>").appendTo(step_list);
		});
	}
	$("<br>").appendTo(item);

	$("<button>", {class: "ref-button item-add-button"}).text("Add Step")
	.click(function () {
		let new_step = {};
		plan_data.steps.push(new_step);
		item.append(create_step_input(plan_data.steps, new_step));
	}).appendTo(item);
	$("<br>").appendTo(item);
	$("<br>").appendTo(item);

	return item;
}

function remove_from(collection, data) {
	if (collection)
	{
		let i = collection.indexOf(data);
		collection.splice(i, 1);
	}
}
