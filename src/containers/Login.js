import React, {Component} from "react";
import Logger from "../Logger";
import {Redirect} from "react-router-dom";

export default class Login extends Component {

	state = {
		redirect: "",
		username: "",
		password: ""
	};

	constructor(props) {
		super(props);
		this.logger = new Logger("Login");
	}

	onSubmit = e => {
		e.preventDefault();
		this.logger.log("Submitting form data", this.state);
		fetch("/login", {
			method: "POST",
			headers: {
				'Content-Type': 'application/json;charset=utf-8'
			},
			body: JSON.stringify(this.state)
		}).then(result => {
			if (result.status === 200) {
				this.props.onLoginSuccess();
				this.setState({redirect: "/r"})
			}
		})
	};

	render() {
		const {redirect} = this.state;
		if (redirect) {
			return (
				<Redirect to={redirect}/>
			)
		}
		return (
			<div className={"component-login"}>
				<form onSubmit={this.onSubmit}>
					<label><span>Username</span><input onChange={e => this.setState({username: e.target.value})}/></label>
					<label><span>Password</span><input type={"password"} onChange={e => this.setState({password: e.target.value})}/></label>
					<input type={"submit"} value={"Login"}/>
				</form>
			</div>
		)
	}
}
