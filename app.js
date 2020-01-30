const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const logger = require('morgan');
const session = require('cookie-session');
const cors = require('cors');

const loginRouter = require('./routes/login');
const logoutRouter = require('./routes/logout');
const modulesRouter = require('./routes/modules');

const app = express();

app.use(cors({credentials: true, origin: true}));
app.use(bodyParser.json({limit: "50mb"}));
app.use(bodyParser.urlencoded({limit: "50mb", extended: true, parameterLimit: 50000}));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());

app.use(session({
    name: 'session',
    secret: "keyboard cat",
    // Cookie Options
    maxAge: 24 * 60 * 60 * 1000 * 365 // 1 year
}));

app.use('/backend/login', loginRouter);
app.use('/backend/logout', logoutRouter);
app.use('/backend/modules', modulesRouter);

module.exports = app;
