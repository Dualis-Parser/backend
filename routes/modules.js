const express = require('express');
const request = require("request");
const router = express.Router();

router.get('/', function (req, res, next) {
    if (!(req.session.loggedIn && req.session.username && req.session.password)) {
        res.sendStatus(401);
        return;
    }
    console.log("Auth");
    request.get(`https://api.gahr.dev/dualis/user?username=${encodeURIComponent(req.session.username)}&password=${encodeURIComponent(req.session.password)}`, function (err, resp, body) {
        if (err) {
            res.status(err.statusCode || 503).json({data: false});
            return;
        }
        res.status(resp.statusCode).json(JSON.parse(body));
    });

});

module.exports = router;
