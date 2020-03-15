import React from 'react'
import {PropTypes} from 'prop-types';
import MediaContainer from './MediaContainer'
import Communication from '../components/Communication'
import store from '../store'
import {connect} from 'react-redux'
import Logger from "../Logger";

class CommunicationContainer extends React.Component {
	constructor(props) {
		super(props);
		this.logger = new Logger("CommunicationContainer");
		this.state = {
			sid: '',
			message: '',
			audio: true,
			video: true
		};
		this.handleInvitation = this.handleInvitation.bind(this);
		this.handleHangup = this.handleHangup.bind(this);
		this.handleInput = this.handleInput.bind(this);
		this.toggleVideo = this.toggleVideo.bind(this);
		this.toggleAudio = this.toggleAudio.bind(this);
		this.send = this.send.bind(this);
		this.onBridgeChanged = this.onBridgeChanged.bind(this);
	}

	hideAuth() {
		this.logger.log("Setting bridge to 'connecting'");
		this.onBridgeChanged({bridge: 'connecting'});
	}

	full() {
		const data = {bridge: 'full'};
		this.logger.log("Socket event 'full'", data);
		this.onBridgeChanged(data);
	}

	onBridgeChanged(data) {
		this.props.onBridgeChanged(data);
	}

	componentDidMount() {
		const socket = this.props.socket;
		this.logger.log('Component did mount, props', this.props);
		this.setState({video: this.props.video, audio: this.props.audio});

		socket.on('create', () => {
			const data = {user: 'host', bridge: 'create'};
			this.logger.log("Socket event 'create'", data);
			return this.onBridgeChanged(data)
		});
		socket.on('full', this.full);
		socket.on('bridge', role => {
			this.logger.log("Socket event 'bridge'", role);
			return this.props.media.init()
		});
		socket.on('join', () => {
			const data = {user: 'guest', bridge: 'join'};
			this.logger.log("Socket event 'join'", data);
			return this.onBridgeChanged(data)
		});
		socket.on('approve', ({message, sid}) => {
			this.logger.log("Socket event 'approve'");
			this.onBridgeChanged({bridge: 'approve'});
			this.setState({message, sid});
		});
		this.logger.log("Emitting event 'find'...");
		socket.emit('find');
		this.logger.log("Getting user media...");
		this.props.getUserMedia.then(stream => {
			this.logger.log("Setting localStream");
			this.localStream = stream;
			this.localStream.getVideoTracks()[0].enabled = this.state.video;
			this.localStream.getAudioTracks()[0].enabled = this.state.audio;
		});
	}

	handleInput(e) {
		this.setState({[e.target.dataset.ref]: e.target.value});
	}

	send(e) {
		e.preventDefault();
		this.logger.log("Send: emitting event 'messages'", this.state);
		this.props.socket.emit('messages', this.state);
		this.hideAuth();
	}

	handleInvitation(e) {
		e.preventDefault();
		this.logger.log("Handle invitation: emitting event", [e.target.dataset.ref], this.state.sid);
		this.props.socket.emit([e.target.dataset.ref], this.state.sid);
		this.hideAuth();
	}

	toggleVideo() {
		this.logger.log("Toggling video...");
		const video = this.localStream.getVideoTracks()[0].enabled = !this.state.video;
		this.setState({video: video});
		this.props.setVideo(video);
	}

	toggleAudio() {
		this.logger.log("Toggling audio...");
		const audio = this.localStream.getAudioTracks()[0].enabled = !this.state.audio;
		this.setState({audio: audio});
		this.props.setAudio(audio);
	}

	handleHangup() {
		this.logger.log("Hanging up...");
		this.props.media.hangup();
	}

	render() {
		return (
			<Communication
				{...this.state}
				toggleVideo={this.toggleVideo}
				toggleAudio={this.toggleAudio}
				send={this.send}
				handleHangup={this.handleHangup}
				handleInput={this.handleInput}
				handleInvitation={this.handleInvitation}/>
		);
	}
}

const mapStateToProps = store => ({video: store.video, audio: store.audio});
const mapDispatchToProps = dispatch => (
	{
		setVideo: boo => store.dispatch({type: 'SET_VIDEO', video: boo}),
		setAudio: boo => store.dispatch({type: 'SET_AUDIO', audio: boo})
	}
);

CommunicationContainer.propTypes = {
	socket: PropTypes.object.isRequired,
	getUserMedia: PropTypes.object.isRequired,
	audio: PropTypes.bool.isRequired,
	video: PropTypes.bool.isRequired,
	setVideo: PropTypes.func.isRequired,
	setAudio: PropTypes.func.isRequired,
	media: PropTypes.instanceOf(MediaContainer)
};
export default connect(mapStateToProps, mapDispatchToProps)(CommunicationContainer);
