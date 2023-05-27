require('./src/utility/setup').setup();

var express = require('express');
var app = express();

app.set('view engine', 'ejs');

app.use(require('./src/server/routes'));

app.listen(process.env.PORT);