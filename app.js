const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const logger = require('morgan');
const session = require('express-session');
const cors = require('cors');

const loginRouter = require('./routes/login');
const logoutRouter = require('./routes/logout');
const modulesRouter = require('./routes/modules');

const app = express();

app.use(cors({credentials: true, origin: true}));
app.use(bodyParser.json({limit: "50mb"}));
app.use(bodyParser.urlencoded({limit: "50mb", extended: true, parameterLimit:50000}));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(session({ secret: 'keyboard cat', cookie: { maxAge: 3600000 * 24 * 365 }}));

app.use('/backend/login', loginRouter);
app.use('/backend/logout', logoutRouter);
app.use('/backend/modules', modulesRouter);

module.exports = app;
