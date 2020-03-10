import React, {Component} from 'react';
import MediaContainer from './MediaContainer'
import CommunicationContainer from './CommunicationContainer'
import {connect} from 'react-redux'
import store from '../store'
import io from 'socket.io-client'
import Logger from "../Logger";

class RoomPage extends Component {

	constructor(props) {
		super(props);
		this.logger = new Logger("RoomPage");
		this.getUserMedia = navigator.mediaDevices.getUserMedia({
			audio: true,
			video: true
		}).catch(e => alert('getUserMedia() error: ' + e.name));
		this.socket = io.connect();
	}

	componentDidMount() {
		this.props.addRoom();
		this.logger.log("Current room id:", this.props.roomId)
	}

	render() {
		const {roomId, isAuth} = this.props;
		// if (!isAuth) window.location.href = "/";
		return (
			<div>
				<MediaContainer media={media => this.media = media} socket={this.socket} getUserMedia={this.getUserMedia}/>
				<CommunicationContainer socket={this.socket} media={this.media} getUserMedia={this.getUserMedia} roomId={roomId}/>
			</div>
		);
	}
}

const mapStateToProps = store => ({rooms: new Set([...store.rooms])});
const mapDispatchToProps = (dispatch, ownProps) => ({
	addRoom: () => store.dispatch({type: 'ADD_ROOM', room: ownProps.match.params.room})
});
export default connect(mapStateToProps, mapDispatchToProps)(RoomPage);
