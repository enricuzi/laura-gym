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
	}

	create() {
		this.logger.log("Setting bridge to create and user to host");
		this.props.media.setState({user: 'host', bridge: 'create'})
	};

	hideAuth() {
		this.logger.log("Setting bridge to connecting");
		this.props.media.setState({bridge: 'connecting'});
	}

	full() {
		this.logger.log("Setting bridge to full");
		this.props.media.setState({bridge: 'full'});
	}

	bridge(role) {
		this.logger.log("Initializing media with role", role);
		this.props.media.init();
	}

	join() {
		this.logger.log("Joining user guest");
		this.props.media.setState({user: 'guest', bridge: 'join'})
	}

	approve({message, sid}) {
		this.logger.log("Approving bridge...", message, sid);
		this.props.media.setState({bridge: 'approve'});
		this.setState({message, sid});
	}

	componentDidMount() {
		const socket = this.props.socket;
		this.logger.log('props', this.props);
		const {video, audio, roomId} = this.props;
		const url = "/r/join/" + roomId;
		this.setState({video, audio, url});

		socket.on('create', this.create.bind(this));
		socket.on('full', this.full.bind(this));
		socket.on('bridge', this.bridge.bind(this));
		socket.on('join', this.join.bind(this));
		socket.on('approve', this.approve.bind(this));

		this.logger.log("Emmitting find event");
		socket.emit('find');

		this.logger.log("Getting user media...");
		this.props.getUserMedia
			.then(stream => {
				this.logger.log("Setting stream...");
				this.localStream = stream;
				this.localStream.getVideoTracks()[0].enabled = this.state.video;
				this.localStream.getAudioTracks()[0].enabled = this.state.audio;
			});
	}

	handleInput(e) {
		const {value, dataset} = e.target;
		this.logger.log("Handling input value", value);
		this.setState({[dataset.ref]: value});
	}

	send(e) {
		e.preventDefault();
		this.logger.log("Sending authentication request", this.state);
		this.props.socket.emit('auth', this.state);
		this.hideAuth();
	}

	handleInvitation(e) {
		e.preventDefault();
		const ref = [e.target.dataset.ref];
		this.logger.log("Handling invitation", ref, this.state.sid);
		this.props.socket.emit(ref, this.state.sid);
		this.hideAuth();
	}

	toggleVideo() {
		this.logger.log("Toggling video stream");
		const video = this.localStream.getVideoTracks()[0].enabled = !this.state.video;
		this.setState({video: video});
		this.props.setVideo(video);
	}

	toggleAudio() {
		this.logger.log("Toggling audio stream");
		const audio = this.localStream.getAudioTracks()[0].enabled = !this.state.audio;
		this.setState({audio: audio});
		this.props.setAudio(audio);
	}

	handleHangup() {
		this.logger.log("Hanging up");
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
