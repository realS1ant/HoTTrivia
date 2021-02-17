const methods = {};

methods.protectedPlayer = (req, res, next) => {
    if (req.session.admin === true) {
        res.redirect('/admin');
    } else if (req.session.player === true) {
        next();
    } else {
        next(new Error('Not authorized'));
    }
}

methods.protectedAdmin = (req, res, next) => {
    if (req.session.admin === true) {
        next();
    } else {
        res.redirect('/admin/login');
    }
}

methods.validEmail = (email) => {
    return true;
}

module.exports = methods;