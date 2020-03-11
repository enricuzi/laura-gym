import React, {Component} from 'react';
import {connect} from 'react-redux';
import {Link} from 'react-router-dom';
import Login from "../containers/Login";
import Logout from "../containers/Logout";

class Home extends Component {

	state = {
		isAuth: false,
		showLogin: false
	};

	render() {
		const {isAuth, showLogin} = this.state;
		const {roomId, handleChange} = this.props;
		return (
			<div className="home">
				<div>
					<h1 itemProp="headline">Webrtc Video Room</h1>
					<p>Please enter a room name.</p>
					<input type="text" name="room" value={roomId} onChange={handleChange} pattern="^\w+$" maxLength="10" required autoFocus title="Room name should only contain letters or numbers."/>
					{isAuth ? <Link className="primary-button" to={'/r/create/' + roomId}>Create</Link> : null}
					<Link className="primary-button" to={'/r/join/' + roomId}>Join</Link>
					{!isAuth ? <p onClick={() => this.setState({showLogin: true})}>Login</p> : <Logout onLogoutSuccess={() => this.setState({isAuth: false})}/>}
					{showLogin ? <Login onLoginSuccess={() => this.setState({isAuth: true, showLogin: false})}/> : null}
				</div>
			</div>
		)
	}
}

const mapStateToProps = store => ({rooms: store.rooms});

export default connect(mapStateToProps)(Home);
