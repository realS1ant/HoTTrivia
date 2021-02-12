const methods = {};

methods.protectedPlayer = (req, res, next) => {
    if (req.session.loggedIn === true) {
        if (req.session.userType === 'player') {
            next();
        } else {
            const error = new Error('Not authorized');
            next(error);
        }
    } else {
        const error = new Error('Not authorized');
        next(error);
    }
}

methods.protectedAdmin = (req, res, next) => {
    if (req.session.loggedIn === true) {
        if (req.session.userType === 'admin') {
            next();
        } else {
            const error = new Error('Not authorized');
            next(error);
        }
    } else {
        const error = new Error('Not authorized');
        next(error);
    }
}


module.exports = methods;