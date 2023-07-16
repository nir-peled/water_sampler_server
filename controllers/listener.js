'use strict';

const express = require('express');
const cors = require("cors");
const path = require("path");
const cookieParser = require("cookie-parser");
const URL = require("url");

const OK = 200;
const UNAUTHORIZED = 406;
const BAD_REQ = 400;
const SERVER_ERR = 500;

var app;

class Listener {
	#server;
	#uri;
	#port;
	#app;
	#database;
	#sensor_manager;
	constructor(server, uri, port) {
		this.#server = server;
		this.#database = server.database();
		this.#sensor_manager = server.sensor_manager();
		this.#uri = uri;
		this.#port = port;
		this.#app = express();
		app = this.#app;

		this.#setup_app();
	}

	#setup_app() {
		app.set("view engine", "pug");
		app.set("views", path.join(__dirname, "../views"));

		app.use( cors({origin: this.full_url()}) );
		app.use( express.static(path.join(__dirname, "../views")) );
		app.use( express.urlencoded({ extended: true }) );
		app.use(cookieParser())
		app.use(express.json());

		// token authentication middleware
		app.use(async (request, response, next) => {
			console.log(`request to ${request.originalUrl}`); // debug
			let token = request.cookies.user_token;
			if (token) {
				console.log(`request with token`); // debug
				try {
					let user_data = await this.auth().verify(token);
					request.user_data = user_data;
					response.locals.user_data = user_data;
				}
				catch (error) {
					console.log(error)
				}
			}

			if (request.query.error_message){
				console.log(`error message found: ${request.query.error_message}`); // debug
				response.locals.error_message = request.query.error_message
			}

			next();
		}); // use 

		app.get("/", (request, response) => {
			console.log("main page"); // debug
			response.render("index");
		}); // default page

		this.#setup_user_crud();
		this.#setup_sensor_managing();
	} // end setup_app

	#setup_user_crud() {
		app.get("/signup", (request, response) => {
			console.log("signup page"); // debug
			response.render("signup");
		});

		app.post("/signup", (request, response) => {
			console.log("post signup"); // debug
			console.log(JSON.stringify(request.body)); // debug
			let {username, password, role} = request.body;
			this.auth().register(username, password, role)
			.then((user) => {
				// response.status(200).send(`Successful signup: ${user.username}`);
				response.redirect("/");
			}) // then
			.catch((err) => {
				console.log(err); // debug
				response.locals.error_message = "Could not register user";
				response.status(BAD_REQ);
				this.#redirect(response, "/", {
					error_message: `Could Not register User ${username}`
				});
			}); // catch
		}); // signup

		app.get("/login", (request, response) => {
			console.log("get login"); // debug
			if (request.user_data)
			{
				console.log(`user ${request.user_data.username} is already logged in`);
				response.redirect("/");
			}
			else
				response.render("login");
		}); // get login

		app.post("/login", (request, response) => {
			console.log("post login"); // debug
			console.log(JSON.stringify(request.body)); // debug

			let {username, password} = request.body;

			this.auth().login(username, password)
			.then((user_data) => {
				let {user, token} = user_data;

				response.cookie("user_token", token, {
					httpOnly: true, 
					maxAge: this.auth().max_age_sec() * 1000
				});
				response.redirect("/");
			}) // then
			.catch((err) => {
				console.log(err); // debug
				response.status(BAD_REQ);
				this.#redirect(response, "/", {
					error_message: `Could Not Login User ${username}`
				});
			}); // catch
		}); // post login

		app.post("/logout", (request, response) => {
			console.log("post logout"); // debug
			response.clearCookie("user_token");
			response.redirect("/")
		}); // post logout

		app.get("/users", (request, response) => {
			console.log("get users"); // debug
			this.#database.get_user_list().then((users) => {
				response.render("user_list", {users});
			})
			.catch((err) => {
				console.log(err); // debug
				response.status(SERVER_ERR);
				this.#redirect(response, "/", {
					error_message: `Could Not Read Users`
				});
			}); // catch
		}); // get users

		app.get("/user/update/:username", (request, response) => {
			console.log("get update user"); // debug
			let username = request.params.username
			let user = this.#database.get_user(username);
			if (!user)
				response.redirect("/users");
			else
				response.render("edit_user", {username, edited_user:user});
		});

		app.post("/user/update/:username", (request, response) => {
			let curr_user = request.user_data;
			if (!curr_user || curr_user.role !== "admin")
				return this.send_unautorized(response, curr_user);

			let user_details = request.body;
			user_details.username = request.params.username;
			this.auth().update_user(user_details)
			.then((user) => {
				response.redirect("/users");
			})
			.catch((err) => {
				console.log(err); // debug
				response.status(BAD_REQ);
				this.#redirect(response, "/", {
					error_message: `Could Not Update User ${username}`
				});
			}); // catch
		}); // post user/update

		app.post("/user/delete/:username", (request, response) => {
			let curr_user = request.user_data;
			if (!curr_user || curr_user.role !== "admin")
				return this.send_unautorized(response, curr_user);

			let username = request.params.username;
			this.auth().delete_user(username)
			.then(() => {
				// response.status(200).send(`deleted user ${username}`);
				response.redirect("/users");
			})
			.catch((err) => {
				console.log(err); // debug
				response.status(BAD_REQ);
				this.#redirect(response, "/", {
					error_message: `Could Not Delete User ${username}`
				});
			});
		}); // post user/delete
	} // end setup_user_crud

	#setup_sensor_managing() {
		app.use("/sensors", (request, response, next) => {
			if (!request.user_data)
				this.#send_unautorized(response);
			else
				next();
		}); // use sensors

		app.get("/sensors/all", (request, response) => {
			console.log("get all sensors"); // debug
			this.#database.get_sensor_list()
			.then((sensors) => 
				response.render("sensors_list", {sensors})
			).catch((err) => {
				console.log(err); // debug
				response.status(SERVER_ERR);
				this.#redirect(response, "/", {
					error_message: "Could Not Get Sensors"
				});
			}); // catch
		}); // get sensors all

		// unused
		/*
		app.get("/sensors/:sensor_name", (request, response) => {
			let sensor_name = request.params.sensor_name;
			this.#database.get_sensor(sensor_name)
			.then((sensor_data) => response.render("sensor_page", {sensor_data})
			).catch((err) => {
				response.status(SERVER_ERR);
				this.#redirect(response, "/sensors/all", {
					error_message: `Unable to view sensor ${sensor_name}`
				});
			})
		}); // get sensors single
		*/
		/*
		app.get("/sensors/:sensor_name/config", (request, response) => {
			if (!request.user_data || request.user_data.role != "admin")
				return this.#send_unautorized(response, request.user_data, "/sensors");

			let sensor_name = request.params.sensor_name;
			this.#database.get_sensor_config(sensor_name)
			.then((sensor_config) =>
			 response.render("sensor_config_view", {sensor_config})
			).catch((err) => {
				console.log(err); // debug
				response.status(SERVER_ERR);
				this.#redirect(response, "/sensors/all", {
					error_message: `Unable to view sensor config of ${sensor_name}`
				});
			}); // catch
		}); // get sensor config
		*/
		app.post("/sensors/:sensor_name/config", (request, response) => {
			if (request.user_data.role != "admin")
				return this.#send_unautorized(response, request.user_data, "/sensors");

			let config_data = request.body;
			let sensor_name = request.params.sensor_name;

			this.#sensor_manager.config_sensor(sensor_name, config_data)
			.then(() =>
				this.#database.set_sensor_config(sensor_name, config)
			).then(() => {
				response.status(OK);
				this.#redirect(response, `/sensors/${sensor_name}`, {
					error_message: `Sensor ${sensor_name} configured successfully`
				});
			})
			.catch((err) => {
				console.log(err); // debug
				response.status(SERVER_ERR);
				this.#redirect(response, `/sensors/${sensor_name}`, {
					error_message: `Unable to configure Sensor ${sensor_name}`
				});
			});
		}); // post sensor config

		app.post("/sensor/:sensor_name/manual", (request, response) => {
			let sensor_name = request.params.sensor_name;
			this.#sensor_manager.start_manual_test(sensor_name)
			.then(() => { 
				response.status(OK);
				this.#redirect(response, "/sensors/all", {
					error_message: `Sensor '${sensor_name}' started manually`
				});
			}).catch((err) => {
				console.log(err); // debug
				response.status(SERVER_ERR);
				this.#redirect(response, `/sensors/${sensor_name}`, {
					error_message: `Could not manually start sensor '${sensor_name}'`
				});
			});
		});
		
	}

	start() {
		app.listen(this.#port, () => {
			console.log(`server listening on ${this.full_url()}`);
		});
	}

	full_url() {
		return "http://" + this.#uri + ":" + this.#port;
	}

	auth() {
		return this.#server.authenticator();
	}

	#send_unautorized(response, user, return_page) {
		response.status(406);
		if (!return_page)
			return_page = "/";
		this.#redirect(response, return_page, {
			error_message: "You must be an autorized user to perform this action!"
		});
	}

	#redirect(response, destination, params) {
		response.redirect(URL.format({
			pathname: destination, 
			query: params
		}));
	}
}

module.exports = Listener;
