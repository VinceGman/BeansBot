require('./src/utility/setup').setup();

var express = require('express');
var app = express();

// Redirect HTTP to HTTPS
app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https') {
        return res.redirect('https://' + req.headers.host + req.url);
    }
    next();
});

app.set('view engine', 'ejs');

app.use(require('./src/server/routes'));

app.listen(process.env.PORT);