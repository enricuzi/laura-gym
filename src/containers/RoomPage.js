import React, {Component} from 'react';
import MediaContainer from './MediaContainer'
import CommunicationContainer from './CommunicationContainer'
import {connect} from 'react-redux'
import store from '../store'
import io from 'socket.io-client'

class RoomPage extends Component {

	state = {
		bridge: ""
	};

	constructor(props) {
		super(props);
		this.getUserMedia = navigator.mediaDevices.getUserMedia({
			audio: true,
			video: true
		}).catch(e => alert('getUserMedia() error: ' + e.name));
		this.socket = io.connect();
		this.onBridgeChanged = this.onBridgeChanged.bind(this);
	}

	componentDidMount() {
		this.props.addRoom();
	}

	onBridgeChanged(data) {
		this.setState({bridge: data.bridge});
		this.media.setState(data);
	}

	render() {
		return (
			<div className={this.state.bridge}>
				<MediaContainer media={media => this.media = media} socket={this.socket} getUserMedia={this.getUserMedia} onBridgeChanged={this.onBridgeChanged}/>
				<CommunicationContainer socket={this.socket} media={this.media} getUserMedia={this.getUserMedia} onBridgeChanged={this.onBridgeChanged}/>
			</div>
		);
	}
}

const mapStateToProps = store => ({rooms: new Set([...store.rooms])});
const mapDispatchToProps = (dispatch, ownProps) => ({
	addRoom: () => store.dispatch({type: 'ADD_ROOM', room: ownProps.match.params.room})
});
export default connect(mapStateToProps, mapDispatchToProps)(RoomPage);
