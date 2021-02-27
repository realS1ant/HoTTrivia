const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/admin/' });
const path = require('path');
const fs = require('fs');
const parse = require('csv-parse');
const AllowedEmail = require('../schemas/allowedEmail.js');

const { protectedAdmin, protectedPlayer } = require('./auth.js');

router.post('/login', (req, res, next) => {
    if (req.body.password === process.env.ADMIN_PASSWORD) {
        req.session.admin = true;
        req.session.player = false;
        res.status(200).json({
            success: true,
            loggedIn: true,
            admin: true,
            redirectTo: '/admin'
        });
    } else {
        req.session.admin = false;
        res.status(200).json({
            success: true,
            admin: false,
            loggedIn: false,
            message: 'Incorrect Password!'
        });
    }
});

router.post('/logout', (req, res, next) => {
    if (req.session.admin === true) {
        req.session.admin = false;
        req.session.player = false;
        res.status(200).json({
            success: true,
            redirectTo: '/'
        })
    }
});

router.post('/csvupload', protectedAdmin, upload.single('csv'), (req, res, next) => {
    console.dir(req.file);
    res.status(200).json({'testing': true});

    // const filename = req.file.filename;
    // console.log(__dirname);
    // console.log(path.dirname(require.main.filename));

    const fullpath = path.join(path.dirname(require.main.filename), req.file.path);
    console.log(fullpath);

    fs.readFile(fullpath, 'utf8', (err, data) => {
        if (err) {console.error(err); return;}
        console.log(data);

        parse(data.trim(), {columns: true}, (err, records) => {
            console.log(records);
            AllowedEmail.remove({}).then(() => {
                records.forEach(record => {
                    if (!isNaN(record.uses)) {
                        record.uses = Number(record.uses);
                    } else {
                        record.uses = 1;
                    }
                    if (typeof record.email === 'string' && record.email.length > 0) {
                        // record is a clean {email: String, uses: Number} object
                        const newAllowedEmail = new AllowedEmail({
                            email: record.email,
                            uses: record.uses
                        });
                        newAllowedEmail.save().then(doc => {

                        });
                    }
                });
                fs.rm(fullpath, (err) => {if (err) {console.error(err); return;} });
            });
        });
    });
});

module.exports = router;