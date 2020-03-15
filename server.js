const express = require('express');
const path = require('path');
const fs = require('fs');
const http = require('http');
const https = require('https');
const sio = require('socket.io');
const favicon = require('serve-favicon');
const compression = require('compression');

const app = express(),
	options = {
		key: fs.readFileSync(__dirname + '/rtc-video-room-key.pem'),
		cert: fs.readFileSync(__dirname + '/rtc-video-room-cert.pem')
	},
	port = process.env.PORT || 3000,
	server = process.env.NODE_ENV === 'production' ?
		http.createServer(app).listen(port, () => console.log("Server started on port", port)) :
		https.createServer(options, app).listen(port, () => console.log("Server started on port", port)),
	io = sio(server);

// compress all requests
app.use(compression());

app.use(express.static(path.join(__dirname, 'dist')));

// Parse URL-encoded bodies (as sent by HTML forms)
app.use(express.urlencoded());

// Parse JSON bodies (as sent by API clients)
app.use(express.json());

// Access the parse results as request.body
app.post('/login', (req, res) => {
	const {username, password} = req.body;
	console.log("Authenticating...", username, password);
	if (username === "laura" && password === "loradilaura") {
		res.send(200);
	} else {
		res.send(401);
	}
});

app.use((req, res) => res.sendFile(__dirname + '/dist/index.html'));

app.use(favicon('./dist/favicon.ico'));

// Switch off the default 'X-Powered-By: Express' header
app.disable('x-powered-by');

io.sockets.on('connection', socket => {
	let room = '';

	// sending to all clients in the room (channel) except sender
	socket.on('message', message => {
		console.log("Sending message to room", room, message);
		socket.broadcast.to(room).emit('message', message)
	});

	socket.on('find', () => {
		const url = socket.request.headers.referer.split('/');
		room = url[url.length - 1];

		console.log("Handling event 'find' for room", room);
		const sr = io.sockets.adapter.rooms[room];

		if (sr === undefined) {
			// no room with such name is found so create it
			console.log("Creating room id:", room);
			socket.join(room);
			socket.emit('create');
		} else if (sr.length === 1) {
			console.log("Joining room id:", room);
			socket.emit('join');
		} else { // max two clients
			console.log("Room is full...", room);
			socket.emit('full', room);
		}
	});
	socket.on('messages', data => {
		data.sid = socket.id;
		// sending to all clients in the room (channel) except sender
		console.log("Authenticating to room", room, data);
		socket.broadcast.to(room).emit('approve', data);
	});
	socket.on('accept', id => {
		io.sockets.connected[id].join(room);
		// sending to all clients in 'game' room(channel), include sender
		console.log("Accepting to room", room);
		io.in(room).emit('bridge');
	});
	socket.on('reject', () => {
		console.log("Rejecting user from room", room);
		socket.emit('full')
	});
	socket.on('leave', () => {
		// sending to all clients in the room (channel) except sender
		console.log("Leaving from room", room);
		socket.broadcast.to(room).emit('hangup');
		socket.leave(room);
	});
});
