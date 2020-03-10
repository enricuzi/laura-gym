import React, {Component} from 'react';
import {PropTypes} from 'prop-types';
import Logger from "../Logger";

class MediaBridge extends Component {

	constructor(props) {
		super(props);
		this.logger = new Logger("MediaContainer");
		this.state = {
			bridge: '',
			user: ''
		};
		this.onRemoteHangup = this.onRemoteHangup.bind(this);
		this.onMessage = this.onMessage.bind(this);
		this.sendData = this.sendData.bind(this);
		this.setupDataHandlers = this.setupDataHandlers.bind(this);
		this.setDescription = this.setDescription.bind(this);
		this.sendDescription = this.sendDescription.bind(this);
		this.hangup = this.hangup.bind(this);
		this.init = this.init.bind(this);
		this.setDescription = this.setDescription.bind(this);
		this.handleError = this.handleError.bind(this);
	}

	componentWillMount() {
		// chrome polyfill for connection between the local device and a remote peer
		window.RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection;
		this.props.media(this);
	}

	componentDidMount() {
		this.props.getUserMedia.then(stream => this.localVideo.srcObject = this.localStream = stream);
		this.props.socket.on('message', this.onMessage);
		this.props.socket.on('hangup', this.onRemoteHangup);
	}

	componentWillUnmount() {
		this.logger.log("Unmounting and romoving stream");
		this.props.media(null);
		if (this.localStream !== undefined) {
			this.localStream.getVideoTracks()[0].stop();
		}
		this.logger.log("Emitting leave event");
		this.props.socket.emit('leave');
	}

	onRemoteHangup() {
		const data = {user: 'host', bridge: 'host-hangup'};
		this.logger.log("Remote hangup, setting data", data);
		this.setState(data);
	}

	onMessage(message) {
		this.logger.log("Receiving message event", message);
		switch (message.type) {
			case "offer":
				// set remote description and answer
				this.logger.log("Sending remote offer description");
				this.peerConnection.setRemoteDescription(new RTCSessionDescription(message));
				this.peerConnection.createAnswer()
					.then(this.setDescription)
					.then(this.sendDescription)
					.catch(this.handleError); // An error occurred, so handle the failure to connect
				break;
			case "answer":
				// set remote description
				this.logger.log("Setting remote answer description");
				this.peerConnection.setRemoteDescription(new RTCSessionDescription(message));
				break;
			case "candidate":
				// add ice candidate
				this.logger.log("Adding ICE Candidate");
				this.peerConnection.addIceCandidate(
					new RTCIceCandidate({
						sdpMLineIndex: message.mlineindex,
						candidate: message.candidate
					})
				);
				break;
			default:
				this.logger.error("Unhandled message type", message.type);
		}
	}

	sendData(msg) {
		this.logger.log("Sending data", msg);
		this.dataChannel.send(JSON.stringify(msg))
	}

	// Set up the data channel message handler
	setupDataHandlers() {
		this.logger.log("Setting handlers onmaessage|onclose");
		this.dataChannel.onmessage = e => {
			var msg = JSON.parse(e.data);
			this.logger.log('received message over data channel:' + msg);
		};
		this.dataChannel.onclose = () => {
			this.remoteStream.getVideoTracks()[0].stop();
			this.logger.log('The Data Channel is Closed');
		};
	}

	setDescription(offer) {
		this.logger.log("Setting description", offer);
		this.peerConnection.setLocalDescription(offer);
	}

	// send the offer to a server to be forwarded to the other peer
	sendDescription() {
		const description = this.peerConnection.localDescription;
		this.logger.log("Sending description local description", description);
		this.props.socket.send(description);
	}

	hangup() {
		const data = {user: 'guest', bridge: 'guest-hangup'};
		this.logger.log("Hanging up and setting state", data);
		this.setState(data);
		this.logger.log("Closing peerConnection");
		this.peerConnection.close();
		this.logger.log("Emitting leave event");
		this.props.socket.emit('leave');
	}

	handleError(e) {
		this.logger.error(e);
	}

	init() {
		// wait for local media to be ready
		const attachMediaIfReady = () => {
			this.logger.log("Creating channel chat");
			this.dataChannel = this.peerConnection.createDataChannel('chat');
			this.setupDataHandlers();
			this.logger.log('attachMediaIfReady');
			this.peerConnection.createOffer()
				.then(this.setDescription)
				.then(this.sendDescription)
				.catch(this.handleError); // An error occurred, so handle the failure to connect
		};
		// set up the peer connection
		// this is one of Google's public STUN servers
		// make sure your offer/answer role does not change. If user A does a SLD
		// with type=offer initially, it must do that during  the whole session
		this.peerConnection = new RTCPeerConnection({iceServers: [{url: 'stun:stun.l.google.com:19302'}]});
		// when our browser gets a candidate, send it to the peer
		this.peerConnection.onicecandidate = e => {
			this.logger.log(e, 'onicecandidate');
			if (e.candidate) {
				this.logger.log("Sending candidate data...");
				this.props.socket.send({
					type: 'candidate',
					mlineindex: e.candidate.sdpMLineIndex,
					candidate: e.candidate.candidate
				});
			}
		};
		// when the other side added a media stream, show it on screen
		this.peerConnection.onaddstream = e => {
			this.logger.log('onaddstream', e);
			this.remoteStream = e.stream;
			this.remoteVideo.srcObject = this.remoteStream = e.stream;
			this.logger.log("Setting state bride established");
			this.setState({bridge: 'established'});
		};
		this.peerConnection.ondatachannel = e => {
			// data channel
			this.dataChannel = e.channel;
			this.setupDataHandlers();
			this.sendData({
				peerMediaStream: {
					video: this.localStream.getVideoTracks()[0].enabled
				}
			});
			//sendData('hello');
		};
		// attach local media to the peer connection
		this.logger.log("Setting peerConnection track with localStream");
		this.localStream.getTracks().forEach(track => this.peerConnection.addTrack(track, this.localStream));
		// call if we were the last to connect (to increase
		// chances that everything is set up properly at both ends)
		if (this.state.user === 'host') {
			this.logger.log("User is host...attaching media callback");
			this.props.getUserMedia.then(attachMediaIfReady);
		}
	}

	render() {
		return (
			<div className={`media-bridge ${this.state.bridge}`}>
				<video className="remote-video" ref={(ref) => this.remoteVideo = ref} autoPlay></video>
				<video className="local-video" ref={(ref) => this.localVideo = ref} autoPlay muted></video>
			</div>
		);
	}
}

MediaBridge.propTypes = {
	socket: PropTypes.object.isRequired,
	getUserMedia: PropTypes.object.isRequired,
	media: PropTypes.func.isRequired
};
export default MediaBridge;
