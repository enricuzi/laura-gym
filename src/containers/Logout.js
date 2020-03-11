import React, {Component} from "react";

export default class Logout extends Component {

	render() {
		return (
			<div className={"component-logout"}>
				<p onClick={() => this.props.onLogoutSuccess()}>Logout</p>
			</div>
		);
	}
}
