const express = require('express');
const router = express.Router();
const request = require('request');

router.post('/', function (req, res, next) {
    if (req.session.loggedIn && req.session.username && req.session.password) {
        res.status(200).json({data: true});
        return;
    }
    if (!req.body.username || !req.body.password) {
        res.status(401).json({data: false});
        return;
    }
    const requestOptions = {
        url: `https://api.gahr.dev/dualis/user/validate/${encodeURIComponent(req.body.username)}`,
        headers: {
            "Private-Token": req.body.password
        }
    };
    request.get(requestOptions, function (err, resp, body) {
        if (err) {
            res.status(503).json({data: false});
            return;
        }
        const result = JSON.parse(resp.body);
        if (result.code === 200 && result.data) {
            req.session.username = req.body.username;
            req.session.password = req.body.password;
            req.session.loggedIn = true;

            res.status(200).json({data: true});
        } else if (!result.data) {
            res.status(401).json({data: false});
        } else {
            res.status(result.code).json({data: false});
        }
    });
});

module.exports = router;
