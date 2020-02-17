const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const logger = require('morgan');
const session = require('express-session');
const cors = require('cors');
const MySQLStore = require('express-mysql-session')(session); // mysql session store
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
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: false,
        secure: false,
        maxAge: 1000 * 60 * 60 * 24 * 365,
    },
    store: new MySQLStore({
        host: process.env.DATABASE_HOST,
        user: 'dualis',
        password: 'NqsOXy7P6Wtuwew1',
        database: 'dualis'
    }) // Change the express session store
}));

app.use('/backend/login', loginRouter);
app.use('/backend/logout', logoutRouter);
app.use('/backend/modules', modulesRouter);

module.exports = app;
