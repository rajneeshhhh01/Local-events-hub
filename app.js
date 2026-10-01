// Main server file
require('dotenv').config()
const express = require('express')
const session = require('express-session')
const helmet = require('helmet')
const bcrypt = require('bcryptjs')
var path = require('path')

const db = require('./config/db')
const addLog = require('./helpers/log')
var validate = require('./helpers/validate')
var auth = require('./middleware/auth')
var csrf = require('./middleware/csrf')

var app = express()
var PORT = process.env.PORT || 3000

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

app.use(helmet())

app.use(express.urlencoded({
  extended: false
}))
app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 2
  }
}))

app.use(csrf.makeToken)

// Show dates in a nice way
app.locals.showDate = function (d) {
  if (!d) return ''
  var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  var parts = String(d).slice(0, 10).split('-')
  return Number(parts[2]) + ' ' + months[Number(parts[1]) - 1] + ' ' + parts[0]
}

app.locals.showDateTime = function (d) {
  if (!d) return ''
  var text = String(d)
  return app.locals.showDate(text) + ', ' + text.slice(11, 16)
}

// Send user and message to every page
app.use(function (req, res, next) {
  res.locals.user = null
  if (req.session.user) {
    res.locals.user = req.session.user
  }

  res.locals.flash = null
  if (req.session.message) {
    res.locals.flash = req.session.message
    req.session.message = null
  }

  res.locals.path = req.path
  next()
})

// Check the form token on every POST
app.use(csrf.checkToken)

app.get('/', async function (req, res, next) {
  try {
    var rows = await db.execute(
      `SELECT events.*, categories.name AS category_name FROM events
       JOIN categories ON events.category_id = categories.id
       WHERE events.event_date >= CURDATE() AND events.status = 'open'
       ORDER BY events.event_date ASC LIMIT 3`
    )
    res.render('home', {
      title: 'Home',
      events: rows
    })
  } catch (err) {
    next(err)
  }
})

app.get('/register', auth.mustLogout, function (req, res) {
  res.render('register', {
    title: 'Register',
    errors: [],
    old: {}
  })
})

app.post('/register', auth.mustLogout, async function (req, res, next) {
  let data = {
    name: validate.clean(req.body.name),
    email: validate.clean(req.body.email).toLowerCase(),
    password: req.body.password || '',
    confirm: req.body.confirm || ''
  }

  let errors = validate.checkRegister(data)

  if (errors.length > 0) {
    return res.status(400).render('register', {
      title: 'Register',
      errors: errors,
      old: data
    })
  }

  try {
    var found = await db.execute('SELECT id FROM users WHERE email = ?', [data.email])
    if (found.length > 0) {
      return res.status(400).render('register', {
        title: 'Register',
        errors: ['This email is already used.'],
        old: data
      })
    }

    const hash = await bcrypt.hash(data.password, 10)
    var result = await db.execute(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [data.name, data.email, hash, 'user']
    )
    await addLog(result.insertId, 'register', 'user', result.insertId, 'New account made')

    req.session.message = {
      type: 'success',
      text: 'Account made. Please log in.'
    }
    res.redirect('/login')
  } catch (err) {
    next(err)
  }
})

app.get('/login', auth.mustLogout, function (req, res) {
  res.render('login', {
    title: 'Log in',
    errors: [],
    old: {}
  })
})

app.post('/login', auth.mustLogout, async function (req, res, next) {
  var email = validate.clean(req.body.email).toLowerCase()
  var password = req.body.password || ''

  let errors = validate.checkLogin({
    email: email,
    password: password
  })
  if (errors.length > 0) {
    return res.status(400).render('login', {
      title: 'Log in',
      errors: errors,
      old: {
        email: email
      }
    })
  }

  try {
    var rows = await db.execute('SELECT * FROM users WHERE email = ?', [email])

    if (rows.length == 0) {
      return res.status(401).render('login', {
        title: 'Log in',
        errors: ['Email or password is wrong.'],
        old: {
          email: email
        }
      })
    }

    let user = rows[0]
    let ok = await bcrypt.compare(password, user.password_hash)
    if (!ok) {
      await addLog(user.id, 'login failed', 'user', user.id, 'Wrong password')
      return res.status(401).render('login', {
        title: 'Log in',
        errors: ['Email or password is wrong.'],
        old: {
          email: email
        }
      })
    }

    // Make a new session after login
    req.session.regenerate(async function (err) {
      if (err) return next(err)

      req.session.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
      req.session.message = {
        type: 'success',
        text: 'Welcome, ' + user.name + '!'
      }
      await addLog(user.id, 'login', 'user', user.id, 'Logged in')

      if (user.role == 'admin') {
        res.redirect('/admin')
      } else {
        res.redirect('/events')
      }
    })
  } catch (err) {
    next(err)
  }
})

app.post('/logout', auth.mustLogin, async function (req, res) {
  await addLog(req.session.user.id, 'logout', 'user', req.session.user.id, 'Logged out')
  req.session.destroy(function () {
    res.redirect('/login')
  })
})

app.use('/events', require('./routes/events'))
app.use('/tickets', require('./routes/tickets'))
app.use('/admin', require('./routes/admin'))
app.use('/', require('./routes/help'))

// Page not found
app.use(function (req, res) {
  res.status(404).render('error', {
    title: 'Not found',
    message: 'Sorry, this page does not exist.'
  })
})

app.use(function (err, req, res, next) {
  console.log('ERROR:', err)
  res.status(500).render('error', {
    title: 'Something went wrong',
    message: 'Sorry, we have a problem. Please try again later.'
  })
})

app.listen(PORT, function () {
  console.log('Server running on http://localhost:' + PORT)
})
