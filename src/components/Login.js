import React, {Component} from "react";

export default class Login extends Component {

	state = {
		username: "",
		password: "",
		isAuth: false
	};

	constructor(props) {
		super(props);
		this.onSubmit = this.onSubmit.bind(this);
		this.logout = this.logout.bind(this);
	}

	onSubmit(e) {
		e.preventDefault();
		console.log("Submitting login...", this.state);
		fetch('/login', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(this.state)
		}).then(response => {
			this.setState({isAuth: response.status === 200})
		});
	}

	logout(e) {
		console.log("Logging out");
		this.setState({isAuth: false})
	}

	render() {
		const {username, password, isAuth} = this.state;
		if (isAuth) {
			return (
				<div className={"component-login"}>
					<button onClick={this.logout}>Logout</button>
				</div>
			)
		}
		return (
			<div className={"component-login"}>
				<form onSubmit={this.onSubmit}>
					<label>
						<span>Username</span>
						<input value={username} onChange={e => this.setState({username: e.target.value})}/>
					</label>
					<label>
						<span>Password</span>
						<input value={password} onChange={e => this.setState({password: e.target.value})}/>
					</label>
					<input type={"submit"} value={"Login"}/>
				</form>
			</div>
		)
	}
}
