const express = require('express');
const path = require('path');
const fs = require('fs');
const http = require('http');
const https = require('https');
const sio = require('socket.io');
const favicon = require('serve-favicon');
const compression = require('compression');
const bodyParser = require('body-parser');

const app = express();

// compress all requests
app.use(compression());

app.use(express.static(path.join(__dirname, 'dist')));

// app.use((req, res) => res.sendFile(__dirname + '/dist/index.html'));

// app.use(favicon('./dist/favicon.ico'));

// Switch off the default 'X-Powered-By: Express' header
app.disable('x-powered-by');

app.use(bodyParser.json());       // to support JSON-encoded bodies

app.post('/login', (req, res) => {
	console.log("Executing login...",);
	const {username, password} = req.body;
	if (username === "laura" && password === "loradilaura") {
		res.send(200);
	} else {
		res.send(401);
	}
});

app.get("/", (req, res) => {
	res.sendFile(__dirname + '/dist/index.html')
});

const options = {
		key: fs.readFileSync(__dirname + '/rtc-video-room-key.pem'),
		cert: fs.readFileSync(__dirname + '/rtc-video-room-cert.pem')
	},
	port = process.env.PORT || 3000,
	// server = process.env.NODE_ENV === 'production' ?
	// 	http.createServer(app).listen(port) :
	// 	https.createServer(options, app).listen(port),
	server = https.createServer(options, app).listen(port, () => console.log("Server started on port", port)),
	io = sio(server);

io.sockets.on('connection', socket => {
	let room = '';

	// sending to all clients in the room (channel) except sender
	socket.on('message', message => {
		console.log("Sending message to room", room, message);
		socket.broadcast.to(room).emit('message', message)
	});

	socket.on('find', () => {
		const url = socket.request.headers.referer.split('/');
		const action = url[url.length - 2];
		room = url[url.length - 1];
		const sr = io.sockets.adapter.rooms[room];

		if (action === "create") {
			if (sr === undefined) {
				// no room with such name is found so create it
				console.log("Creating room id:", room);
				socket.join(room);
				socket.emit('create');
			} else {
				console.log("Room already exists", room);
				socket.emit('full', room);
			}
		} else {
			if (sr === undefined || sr.length > 1) {
				// max two clients
				console.log("Room is full...", room);
				socket.emit('full', room);
			} else {
				console.log("Joining room id:", room);
				socket.emit('join');
			}
		}
	});
	socket.on('auth', data => {
		data.sid = socket.id;
		// sending to all clients in the room (channel) except sender
		console.log("Authenticating to room", room, data);
		//socket.broadcast.to(room).emit('approve', data);
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
