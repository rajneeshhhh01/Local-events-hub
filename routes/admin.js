// Admin pages
const express = require('express')
const router = express.Router()
const db = require('../config/db')
const addLog = require('../helpers/log')
var validate = require('../helpers/validate')
var auth = require('../middleware/auth')

router.use(auth.mustAdmin)

// Dashboard
router.get('/', async function (req, res, next) {
  try {
    var a = await db.execute('SELECT COUNT(*) AS n FROM events')
    var b = await db.execute('SELECT COUNT(*) AS n FROM events WHERE event_date >= CURDATE()')
    var c = await db.execute("SELECT COUNT(*) AS n FROM ticket_requests WHERE status = 'pending'")
    var d = await db.execute('SELECT COUNT(*) AS n FROM users')

    var logs = await db.execute(
      `SELECT activity_log.*, users.name AS user_name FROM activity_log
       LEFT JOIN users ON activity_log.user_id = users.id
       ORDER BY activity_log.id DESC LIMIT 6`
    )

    var pending = await db.execute(
      `SELECT ticket_requests.*, events.title AS event_title, users.name AS user_name
       FROM ticket_requests
       JOIN events ON ticket_requests.event_id = events.id
       JOIN users ON ticket_requests.user_id = users.id
       WHERE ticket_requests.status = 'pending'
       ORDER BY ticket_requests.created_at DESC LIMIT 5`
    )

    var nextEvents = await db.execute(
      `SELECT * FROM events WHERE event_date >= CURDATE()
       ORDER BY event_date ASC LIMIT 5`
    )

    res.render('admin/dashboard', {
      title: 'Admin',
      counts: {
        events: a[0].n,
        upcoming: b[0].n,
        pending: c[0].n,
        users: d[0].n
      },
      logs: logs,
      pending: pending,
      nextEvents: nextEvents
    })
  } catch (err) {
    next(err)
  }
})

// Users
router.get('/users', async function (req, res, next) {
  try {
    var rows = await db.execute(
      `SELECT users.id, users.name, users.email, users.role, users.created_at,
        (SELECT COUNT(*) FROM ticket_requests WHERE ticket_requests.user_id = users.id) AS request_count
       FROM users ORDER BY users.created_at DESC`
    )
    res.render('admin/users', {
      title: 'Users',
      users: rows
    })
  } catch (err) {
    next(err)
  }
})

router.post('/users/:id/role', async function (req, res, next) {
  try {
    let role = validate.clean(req.body.role)
    if (role != 'admin' && role != 'user') {
      req.session.message = {
        type: 'error',
        text: 'Wrong role.'
      }
      return res.redirect('/admin/users')
    }
    // Admin can not change own role
    if (Number(req.params.id) == req.session.user.id) {
      req.session.message = {
        type: 'error',
        text: 'You can not change your own role.'
      }
      return res.redirect('/admin/users')
    }

    var result = await db.execute('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id])
    if (result.affectedRows == 0) {
      req.session.message = {
        type: 'error',
        text: 'User not found.'
      }
      return res.redirect('/admin/users')
    }

    await addLog(
      req.session.user.id, 'change role', 'user', Number(req.params.id), 'Role set to ' + role
    )
    req.session.message = {
      type: 'success',
      text: 'Role changed.'
    }
    res.redirect('/admin/users')
  } catch (err) {
    next(err)
  }
})

router.post('/users/:id/delete', async function (req, res, next) {
  try {
    if (Number(req.params.id) == req.session.user.id) {
      req.session.message = {
        type: 'error',
        text: 'You can not delete yourself.'
      }
      return res.redirect('/admin/users')
    }

    var ev = await db.execute('SELECT COUNT(*) AS n FROM events WHERE created_by = ?', [req.params.id])
    if (ev[0].n > 0) {
      req.session.message = {
        type: 'error',
        text: 'This user made events. Change the role instead.'
      }
      return res.redirect('/admin/users')
    }

    await db.execute('DELETE FROM users WHERE id = ?', [req.params.id])
    await addLog(
      req.session.user.id, 'delete', 'user', Number(req.params.id), 'User deleted'
    )
    req.session.message = {
      type: 'success',
      text: 'User deleted.'
    }
    res.redirect('/admin/users')
  } catch (err) {
    next(err)
  }
})

// Categories
router.get('/categories', async function (req, res, next) {
  try {
    var rows = await db.execute(
      `SELECT categories.*, (SELECT COUNT(*) FROM events WHERE events.category_id = categories.id) AS event_count
       FROM categories ORDER BY name`
    )
    res.render('admin/categories', {
      title: 'Categories',
      categories: rows,
      errors: []
    })
  } catch (err) {
    next(err)
  }
})

router.post('/categories', async function (req, res, next) {
  try {
    let name = validate.clean(req.body.name)
    let errors = validate.checkCategory(name)

    var same = await db.execute('SELECT id FROM categories WHERE name = ?', [name])
    if (same.length > 0) errors.push('This category already exists.')

    if (errors.length > 0) {
      var rows = await db.execute(
        `SELECT categories.*, (SELECT COUNT(*) FROM events WHERE events.category_id = categories.id) AS event_count
         FROM categories ORDER BY name`
      )
      return res.status(400).render('admin/categories', {
        title: 'Categories',
        categories: rows,
        errors: errors
      })
    }

    var result = await db.execute('INSERT INTO categories (name) VALUES (?)', [name])
    await addLog(
      req.session.user.id, 'create', 'category', result.insertId, 'Added category: ' + name
    )
    req.session.message = {
      type: 'success',
      text: 'Category added.'
    }
    res.redirect('/admin/categories')
  } catch (err) {
    next(err)
  }
})

router.post('/categories/:id/delete', async function (req, res, next) {
  try {
    var ev = await db.execute('SELECT COUNT(*) AS n FROM events WHERE category_id = ?', [req.params.id])
    if (ev[0].n > 0) {
      req.session.message = {
        type: 'error',
        text: 'This category has events. You can not delete it.'
      }
      return res.redirect('/admin/categories')
    }
    await db.execute('DELETE FROM categories WHERE id = ?', [req.params.id])
    await addLog(
      req.session.user.id, 'delete', 'category', Number(req.params.id), 'Category deleted'
    )
    req.session.message = {
      type: 'success',
      text: 'Category deleted.'
    }
    res.redirect('/admin/categories')
  } catch (err) {
    next(err)
  }
})

// Activity log
router.get('/log', async function (req, res, next) {
  try {
    let page = parseInt(req.query.page)
    if (isNaN(page) || page < 1) page = 1
    let perPage = 20

    let type = validate.clean(req.query.type)
    let where = ''
    let params = []
    if (type != '') {
      where = ' WHERE activity_log.item_type = ? '
      params.push(type)
    }

    var countRows = await db.execute('SELECT COUNT(*) AS total FROM activity_log' + where, params)
    let totalPages = Math.ceil(countRows[0].total / perPage)
    if (totalPages < 1) {
      totalPages = 1
    }
    if (page > totalPages) page = totalPages

    params.push(perPage)
    params.push((page - 1) * perPage)

    var rows = await db.query(
      `SELECT activity_log.*, users.name AS user_name FROM activity_log
       LEFT JOIN users ON activity_log.user_id = users.id` + where +
      ' ORDER BY activity_log.id DESC LIMIT ? OFFSET ?',
      params
    )

    res.render('admin/log', {
      title: 'Activity log',
      logs: rows,
      page: page,
      totalPages: totalPages,
      type: type
    })
  } catch (err) {
    next(err)
  }
})

router.get('/ai-log', async function (req, res, next) {
  try {
    var rows = await db.execute(
      `SELECT ai_suggestions.*, users.name AS user_name, events.title AS event_title
       FROM ai_suggestions
       LEFT JOIN users ON ai_suggestions.user_id = users.id
       LEFT JOIN events ON ai_suggestions.event_id = events.id
       ORDER BY ai_suggestions.id DESC LIMIT 50`
    )
    for (let i = 0; i < rows.length; i++) {
      try {
        rows[i].drafts = JSON.parse(rows[i].suggestions)
      } catch (e) {
        rows[i].drafts = []
      }
    }
    res.render('admin/ai-log', {
      title: 'AI log',
      rows: rows
    })
  } catch (err) {
    next(err)
  }
})

module.exports = router
