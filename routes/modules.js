const express = require('express');
const request = require("request");
const router = express.Router();
const moment = require('moment');

router.get('/', function (req, res, next) {
    if (!(req.session.loggedIn && req.session.username && req.session.password)) {
        res.sendStatus(401);
        return;
    }

    req.session.semesterFilter = JSON.parse(req.query.semesterFilter) || req.session.semesterFilter;

    if (!req.session.moduleData || !req.session.lastUpdate || moment().subtract(2, 'minutes').isSameOrAfter(req.session.lastUpdate)) {
        console.log("Updating");
        req.session.lastUpdate = moment();

        request.get(`https://api.gahr.dev/dualis/user?username=${encodeURIComponent(req.session.username)}&password=${encodeURIComponent(req.session.password)}`, function (err, resp, body) {
            if (err) {
                res.status(err.statusCode || 503).json({data: false});
                return;
            }
            req.session.moduleData = JSON.parse(body);
            req.session.moduleData.data.cache = 0;
            req.session.moduleData.data.semesterFilter = req.session.semesterFilter;
            res.status(resp.statusCode).json(req.session.moduleData);
        });
    } else {
        req.session.moduleData.data.cache = Math.round(moment.duration(moment().diff(req.session.lastUpdate)).asSeconds());
        req.session.moduleData.data.semesterFilter = req.session.semesterFilter;
        res.json(req.session.moduleData);
    }
});

module.exports = router;
