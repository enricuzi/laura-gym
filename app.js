const http = require('http');
const express = require("express");
const app = express();

// app.use(bodyParser.json());
app.use(express.static('static'));


const hostname = '127.0.0.1';
const port = 3000;

app.get('/', function (req, res) {
	res.render("index")
});

app.listen(3000, function () {
	console.log('Listening on port 3000')
});
