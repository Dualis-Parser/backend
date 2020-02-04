const express = require('express');
const request = require("request");
const XLSX = require('xlsx');

const router = express.Router();
const moment = require('moment');

router.get('/', function (req, res) {
    if (!(req.session.loggedIn && req.session.username && req.session.password)) {
        res.sendStatus(401);
        return;
    }

    req.session.semesterFilter = (req.query.semesterFilter && req.query.semesterFilter !== "null") ? JSON.parse(req.query.semesterFilter) : req.session.semesterFilter;

    if (!req.session.moduleData || !req.session.lastUpdate || moment().subtract(2, 'minutes').isSameOrAfter(req.session.lastUpdate)) {
        console.log("Updating");
        req.session.lastUpdate = moment();

        request.get(`https://api.gahr.dev/dualis/user?username=${encodeURIComponent(req.session.username)}&password=${encodeURIComponent(req.session.password)}`, function (err, resp, body) {
            if (err) {
                res.status(err.statusCode || 503).json({data: false});
                return;
            }
            req.session.moduleData = JSON.parse(body);
            req.session.moduleData.data.cache = Math.round(moment.duration(moment().diff(req.session.lastUpdate)).asSeconds());
            req.session.moduleData.data.semesterFilter = req.session.semesterFilter;
            res.status(resp.statusCode).json(req.session.moduleData);
        });
    } else {
        req.session.moduleData.data.cache = Math.round(moment.duration(moment().diff(req.session.lastUpdate)).asSeconds());
        req.session.moduleData.data.semesterFilter = req.session.semesterFilter;
        res.json(req.session.moduleData);
    }
});

router.get('/export', (req, res) => {
    if (!(req.session.loggedIn && req.session.username && req.session.password)) {
        res.sendStatus(401);
        return;
    }

    let modules = req.session.moduleData.data.modules.map(module => [module.module_no, module.module_name, "", parseInt(module.credits), module.final_grade]);
    modules = modules.filter(m => !m[4].match(/(not set yet)|(noch nicht gesetzt)/)).sort((a, b) => a[0] > b [0] ? 1 : -1); // sort, same module number is not possible
    modules = [["Modul", "Fach", "Studienjahr", "Credits", "Note"], ...modules];

    const ws = XLSX.utils.aoa_to_sheet(modules);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Informatik");

    /* generate buffer */
    const buf = XLSX.write(wb, {type: 'buffer', bookType: "xlsx"});

    /* send to client */
    res.setHeader('Content-disposition', `attachment; filename=modules.xlsx`);
    res.setHeader('Content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
});

module.exports = router;
