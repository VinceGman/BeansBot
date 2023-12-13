var express = require('express');
var router = express.Router();

//Middle ware that is specific to this router
router.use(function timeLog(req, res, next) {
    console.log('Time: ', Date.now());
    next();
});

router.get('/', async function (req, res) {
    res.render('pages/home', { ...(await require('../utility/palette').palette(require('../server/discord_client'), '1126661700867854366')) });
});

router.get('/sleepyheads', async function (req, res) {
    res.render('pages/sleepyheads', { ...(await require('../utility/palette').palette(require('../server/discord_client'), '1152397744678391918')) });
});

module.exports = router;