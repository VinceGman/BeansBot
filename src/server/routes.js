var express = require('express');
var router = express.Router();

//Middle ware that is specific to this router
router.use(function timeLog(req, res, next) {
    console.log('Time: ', Date.now());
    next();
});

router.get('/', function (req, res) {
    res.render('pages/home');
});

router.get('/spaceships', async function (req, res) {
    res.render('pages/spaceships', { ...(await require('../utility/palette').palette(require('../server/discord_client'), '797362418576916480')) });
});

module.exports = router;