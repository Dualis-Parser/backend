const express = require('express');
const request = require("request");
const XLSX = require('xlsx');

const router = express.Router();
const moment = require('moment');

const sortSemesters = semesters => {
    const convToFullYear = (years) => {
        years[1] = years[0].slice(0, 2) + years[1];
        return years;
    };
    const zip = (...rows) => [...rows[0]].map((_, c) => rows.map(row => row[c]));

    const studyYears = semesters
        .map(semester => semester.split(' ')[1].split('/'))
        .map(years => years.length === 2 ? convToFullYear(years) : years)
        .map(years => years.map(year => +year));

    return zip(semesters, studyYears)
        // sort semesters descending
        .sort((a, b) => a[1][0] < b[1][0] ? 1 : a[1][0] > b[1][0] ? -1 : a[1].length === 2 ? -1 : b[1].length === 2 ? 1 : 0)
        .map(semester => semester[0]) // remove semester integer years
        // create pair of two arrays to have one year in one array
        .reduce((all, one, i) => {
            const ch = Math.floor(i / 2);
            all[ch] = [].concat((all[ch] || []), one);
            return all;
        }, []);
};

router.get('/', function (req, res) {
    if (!(req.session.loggedIn && req.session.username && req.session.password)) {
        res.sendStatus(401);
        return;
    }


    if (!req.session.moduleData || !req.session.moduleData.data || !req.session.lastUpdate || moment().subtract(2, 'minutes').isSameOrAfter(req.session.lastUpdate)) {
        req.session.lastUpdate = moment();

        const requestOptions = {
            url: `https://api.gahr.dev/dualis/user/${encodeURIComponent(req.session.username)}`,
            headers: {
                "Private-Token": req.session.password
            }
        };
        request.get(requestOptions, function (err, resp, body) {
            if (err) {
                res.status(err.statusCode || 503).json({data: false});
                return;
            }
            req.session.moduleData = JSON.parse(body);

            if (!req.session.moduleData.data) {
                res.sendStatus(500);
                return;
            }
            req.session.moduleData.data.cache = Math.round(moment.duration(moment().diff(req.session.lastUpdate)).asSeconds());
            req.session.moduleData.data.semesterFilter = req.session.semesterFilter;

            req.session.moduleData.data.semesters = sortSemesters(req.session.moduleData.data.semesters);

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

    const getYearFromSemesters = (toSearch) => {
        let year = NaN;
        const semesters = req.session.moduleData.data.semesters;
        semesters.forEach((yearSemesters, i) => yearSemesters.includes(toSearch.split(',')[0]) ? year = semesters.length - i : year);

        return year;
    };

    let modules = req.session.moduleData.data.modules.map(module => [module.module_no, module.module_name, getYearFromSemesters(module.semesters), parseInt(module.credits), module.final_grade]);
    modules = modules.filter(m => !m[4].match(/(not set yet)|(noch nicht gesetzt)/))
        .sort((a, b) =>
            a[2] - b[2] || a[0].localeCompare(b[0])
        ); // sort, primary year, secondary module_no

    // insert empty row after year change
    let indicesToAdd = [];
    let lastYear = 1;
    modules.forEach((row, i) => {
        if (row[2] !== lastYear) {
            lastYear = row[2];
            indicesToAdd.push(i);
        }
    });

    indicesToAdd.forEach((add, i) => modules.splice(add + i, 0, [""])); // addition if i necessary, we add an element so the actual index moves);
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

router.post("/filter", (req, res) => {
    if (!(req.session.loggedIn && req.session.username && req.session.password)) {
        res.sendStatus(401);
        return;
    }

    req.session.semesterFilter = req.body;
    res.json({code:200, description: "OK"});
});

module.exports = router;
