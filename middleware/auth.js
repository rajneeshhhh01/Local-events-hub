// User must be logged in
function mustLogin(req, res, next) {
  if (!req.session.user) {
    req.session.message = {
      type: 'error',
      text: 'Please log in first.'
    };
    return res.redirect('/login');
  }
  next();
}

// User must be admin
function mustAdmin(req, res, next) {
  if (!req.session.user) {
    req.session.message = {
      type: 'error',
      text: 'Please log in first.'
    };
    return res.redirect('/login');
  }
  if (req.session.user.role != 'admin') {
    return res.status(403).render('error', {
      title: 'No access',
      message: 'Only admin can open this page.'
    });
  }
  next();
}

// User must be logged out
function mustLogout(req, res, next) {
  if (req.session.user) {
    return res.redirect('/events');
  }
  next();
}

module.exports = {
  mustLogin: mustLogin,
  mustAdmin: mustAdmin,
  mustLogout: mustLogout
};
