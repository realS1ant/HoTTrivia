const express = require('express');
const app = express();
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session');
//const cookieSession = require('cookie-session');
const MongoStore = require('connect-mongo')(session);
require('dotenv').config();

//.ENV checks
let missingEnvVars = '';
[
    'PORT',
    'MONGO_HOST',
    'MONGO_USER',
    // 'MONGO_PW',
    // 'MONGO_DB',
    'SESSION_SECRET'
].forEach(envVar => {
    if (typeof process.env[envVar] === 'undefined') {
        missingEnvVars += envVar + ' ';
    }
});
if (missingEnvVars.length > 0) {
    console.log('ERROR: Missing env vars ' + missingEnvVars);
    process.exit(1);
}

//All mongoose-related code
let mongooseConnectionString = '';
if (process.env.MONGO_USER && process.env.MONGO_PW) {
    mongooseConnectionString = 'mongodb+srv://' + process.env.MONGO_USER + ':' + process.env.MONGO_PW + '@' + process.env.MONGO_HOST + '/' + process.env.MONGO_DB + '?retryWrites=true';
} else {
    mongooseConnectionString = 'mongodb+srv://' + process.env.MONGO_HOST + '/' + process.env.MONGO_DB + '?retryWrites=true';
}

mongoose.connect(mongooseConnectionString, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Mongoose connected to ' + process.env.MONGO_HOST + '/' + process.env.MONGO_DB);
}).catch(err => {
    console.error('Mongoose connection error:');
    console.error(err);
    process.exit(1);
});

const database = mongoose.connection;

//Middlewares
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

const sess = {
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: new MongoStore({ mongooseConnection: database }),
    cookie: {
        maxAge: 86400000 // 86400000 ms = 1 day (1 * 24 * 60 * 60 * 1000)
    }
};
if (process.env.ENV === 'production') {
    app.set('trust proxy', 1);
    sess.cookie.secure = true;
}
app.use(session(sess));

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    if (req.method === 'OPTIONS') {
        // amend with all allowed HTTP methods
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
        return res.status(200).json({});
    }
    next();
});

//Routes
app.use('/play', require('./routes/game.js'));
app.use('/', require('./routes/login.js'));

//Error handling
app.use((req, res, next) => {
    const error = new Error('Not found');
    error.status = 404;
    next(error);
});

app.use((error, req, res, next) => {
    res.status(error.status || 500);
    console.log(error.message);
    if (error.status === 404) {
        const resOptions = {};
        resOptions.originalUrl = req.originalUrl;
        if (req.session.loggedIn) {
            if (req.session.userType === 'student') {
                resOptions.loggedIn = true;
                resOptions.userType = 'student';
            } else if (req.session.userType === 'admin') {
                resOptions.loggedIn = true;
                resOptions.userType = 'admin';
            } else {
                resOptions.loggedIn = false;
            }
        } else {
            resOptions.loggedIn = false;
        }
        res.render('errors/404.ejs', resOptions);
    } else if (error.status === 401 || error.message === 'Not authorized') {
        res.render('errors/401.ejs');
    } else {
        res.render('errors/500.ejs');
    }
});

//Starting express app
const port = process.env.PORT || 5000;
const host = process.env.HOST || 'http://localhost';
app.listen(port, () => console.log(`URL: ${host}:${port}`));