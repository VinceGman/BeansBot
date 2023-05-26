require('dotenv').config();
require('./src/server/discord_client'); // initialize discord client

var express = require('express');
var app = express();

app.set('view engine', 'ejs');

app.use(require('./src/server/routes'));

app.listen(process.env.PORT, function () {
    // console.log('Online', process.env.PORT);
});