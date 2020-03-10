import React, {Component} from 'react';
import {connect} from 'react-redux';
import {Link} from 'react-router-dom';

class Home extends Component {

	render() {
		const {rooms, roomId, handleChange} = this.props;
		return (
			<div className="home">
				<div>
					<h1 itemProp="headline">Webrtc Video Room</h1>
					<p>Please enter a room name.</p>
					<input type="text" name="room" value={roomId} onChange={handleChange} pattern="^\w+$" maxLength="10" required autoFocus title="Room name should only contain letters or numbers."/>
					<Link className="primary-button" to={'/r/create/' + roomId}>Create</Link>
					<Link className="primary-button" to={'/r/join/' + roomId}>Join</Link>
					{rooms.length !== 0 && <div>Recently used rooms:</div>}
					{rooms.map(room => <Link key={room} className="recent-room" to={'/r/join/' + room}>{room}</Link>)}
				</div>
			</div>
		)
	}
}

const mapStateToProps = store => ({rooms: store.rooms});

export default connect(mapStateToProps)(Home);
