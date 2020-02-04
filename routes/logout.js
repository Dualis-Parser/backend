const express = require('express');
const router = express.Router();

router.get('/', function (req, res, next) {
    req.session.destroy();
    res.json({code: 200, status: "OK"});
});

module.exports = router;
