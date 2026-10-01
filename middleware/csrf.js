// Stop fake form posts (CSRF)
const crypto = require('crypto')

// Make a secret token for each session
function makeToken(req, res, next) {
  if (req.session.csrfToken == undefined) {
    req.session.csrfToken = crypto.randomBytes(24).toString('hex')
  }
  res.locals.csrfToken = req.session.csrfToken
  next()
}

// Check the token on every POST
function checkToken(req, res, next) {
  if (req.method != 'POST') {
    next()
    return
  }

  var token = req.body._csrf
  if (token == undefined) {
    token = req.headers['x-csrf-token']
  }

  if (token != undefined && token == req.session.csrfToken) {
    next()
  } else {
    res.status(403).render('error', {
      title: 'Form expired',
      message: 'Your form is old. Please go back, reload the page and try again.'
    })
  }
}

module.exports = {
  makeToken: makeToken,
  checkToken: checkToken
}
