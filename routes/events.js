// Event pages
const express = require('express')
const router = express.Router()
const db = require('../config/db')
const addLog = require('../helpers/log')
var validate = require('../helpers/validate')
var auth = require('../middleware/auth')

const PER_PAGE = 6

async function getCategories() {
  var rows = await db.execute('SELECT * FROM categories ORDER BY name')
  return rows
}

// List events with search, filter and pages
router.get('/', async function (req, res, next) {
  try {
    let search = validate.clean(req.query.search)
    let category = validate.clean(req.query.category)
    let when = validate.clean(req.query.when)
    let page = parseInt(req.query.page)
    if (isNaN(page) || page < 1) page = 1

    let where = ' WHERE 1=1 '
    let params = []

    if (search != '') {
      where += ' AND (events.title LIKE ? OR events.venue LIKE ? OR events.description LIKE ?) '
      params.push('%' + search + '%', '%' + search + '%', '%' + search + '%')
    }
    if (category != '' && validate.isWholeNumber(category)) {
      where += ' AND events.category_id = ? '
      params.push(category)
    }
    if (when == 'upcoming') {
      where += ' AND events.event_date >= CURDATE() '
    } else if (when == 'past') {
      where += ' AND events.event_date < CURDATE() '
    }

    if (!req.session.user || req.session.user.role != 'admin') {
      where += " AND events.status = 'open' "
    }

    var countRows = await db.execute('SELECT COUNT(*) AS total FROM events' + where, params)
    let total = countRows[0].total
    let totalPages = Math.ceil(total / PER_PAGE)
    if (totalPages < 1) totalPages = 1
    if (page > totalPages) page = totalPages

    let offset = (page - 1) * PER_PAGE

    params.push(PER_PAGE)
    params.push(offset)

    // Use db.query here because of LIMIT
    var rows = await db.query(
      `SELECT events.*, categories.name AS category_name FROM events
       JOIN categories ON events.category_id = categories.id` + where +
      ' ORDER BY events.event_date < CURDATE(), events.event_date ASC LIMIT ? OFFSET ?',
      params
    )

    const categories = await getCategories()

    res.render('events/list', {
      title: 'Events',
      events: rows,
      categories: categories,
      search: search,
      category: category,
      when: when,
      page: page,
      totalPages: totalPages,
      total: total
    })
  } catch (err) {
    next(err)
  }
})

router.get('/new', auth.mustAdmin, async function (req, res, next) {
  try {
    const categories = await getCategories()
    res.render('events/form', {
      title: 'Add event',
      categories: categories,
      event: {
        status: 'open',
        price: '0.00'
      },
      errors: [],
      isEdit: false
    })
  } catch (err) {
    next(err)
  }
})

router.post('/', auth.mustAdmin, async function (req, res, next) {
  let data = {
    title: validate.clean(req.body.title),
    description: validate.clean(req.body.description),
    category_id: validate.clean(req.body.category_id),
    venue: validate.clean(req.body.venue),
    event_date: validate.clean(req.body.event_date),
    event_time: validate.clean(req.body.event_time),
    total_tickets: validate.clean(req.body.total_tickets),
    price: validate.clean(req.body.price),
    status: validate.clean(req.body.status),
    ai_id: validate.clean(req.body.ai_id),
    ai_choice: validate.clean(req.body.ai_choice)
  }

  let errors = validate.checkEvent(data)

  if (data.ai_choice != '' && req.body.ai_checked != 'yes') {
    errors.push('Please tick the box to say you checked the AI text.')
  }

  try {
    if (errors.length > 0) {
      const categories = await getCategories()
      return res.status(400).render('events/form', {
        title: 'Add event', categories: categories, event: data, errors: errors, isEdit: false
      })
    }

    var result = await db.execute(
      `INSERT INTO events (title, description, category_id, venue, event_date, event_time, total_tickets, price, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.title, data.description, data.category_id, data.venue, data.event_date, data.event_time,
      data.total_tickets, data.price, data.status, req.session.user.id]
    )

    await addLog(
      req.session.user.id, 'create', 'event', result.insertId, 'Added event: ' + data.title
    )

    await saveAiChoice(req, result.insertId, data.description)

    req.session.message = {
      type: 'success',
      text: 'Event added.'
    }
    res.redirect('/events/' + result.insertId)
  } catch (err) {
    next(err)
  }
})

// Save what the admin did with the AI text
async function saveAiChoice(req, eventId, finalText) {
  let aiId = validate.clean(req.body.ai_id)
  let aiChoice = validate.clean(req.body.ai_choice)

  if (aiId == '' || !validate.isWholeNumber(aiId)) {
    return
  }

  var rows = await db.execute('SELECT * FROM ai_suggestions WHERE id = ? AND user_id = ?', [aiId, req.session.user.id])
  if (rows.length == 0) return

  let drafts = JSON.parse(rows[0].suggestions)
  let status = 'rejected'
  let chosen = null

  var okChoice = false
  if (aiChoice != '' && validate.isWholeNumber(aiChoice)) {
    if (Number(aiChoice) >= 1 && Number(aiChoice) <= drafts.length) {
      okChoice = true
    }
  }

  if (okChoice) {
    chosen = Number(aiChoice)
    if (drafts[chosen - 1].trim() == finalText.trim()) {
      status = 'accepted'
    } else {
      status = 'edited'
    }
  }

  await db.execute(
    'UPDATE ai_suggestions SET event_id = ?, chosen_option = ?, final_text = ?, status = ? WHERE id = ?',
    [eventId, chosen, finalText, status, aiId]
  )
  var logText = 'AI draft ' + status + ' for event ' + eventId
  await addLog(req.session.user.id, 'ai ' + status, 'ai_suggestion', Number(aiId), logText)
}

router.get('/:id', async function (req, res, next) {
  if (!validate.isWholeNumber(req.params.id)) {
    return res.status(404).render('error', {
      title: 'Not found',
      message: 'Event not found.'
    })
  }

  try {
    var rows = await db.execute(
      `SELECT events.*, categories.name AS category_name,
         maker.name AS created_by_name, editor.name AS updated_by_name
       FROM events
       JOIN categories ON events.category_id = categories.id
       JOIN users AS maker ON events.created_by = maker.id
       LEFT JOIN users AS editor ON events.updated_by = editor.id
       WHERE events.id = ?`,
      [req.params.id]
    )

    if (rows.length == 0) {
      return res.status(404).render('error', {
        title: 'Not found',
        message: 'Event not found.'
      })
    }

    let event = rows[0]

    if (event.status == 'closed' && (!req.session.user || req.session.user.role != 'admin')) {
      return res.status(404).render('error', {
        title: 'Not found',
        message: 'Event not found.'
      })
    }

    // Count tickets left
    var sold = await db.execute(
      "SELECT SUM(quantity) AS used FROM ticket_requests WHERE event_id = ? AND status = 'approved'",
      [event.id]
    )
    var used = 0
    if (sold[0].used != null) {
      used = Number(sold[0].used)
    }
    let ticketsLeft = event.total_tickets - used

    var counts = {
      pending: 0,
      approved: 0,
      rejected: 0,
      cancelled: 0
    }
    if (req.session.user && req.session.user.role == 'admin') {
      var rows2 = await db.execute(
        'SELECT status, COUNT(*) AS n FROM ticket_requests WHERE event_id = ? GROUP BY status',
        [event.id]
      )
      for (var i = 0; i < rows2.length; i++) {
        counts[rows2[i].status] = rows2[i].n
      }
    }

    var myRequest = null
    if (req.session.user && req.session.user.role != 'admin') {
      var mine = await db.execute(
        "SELECT * FROM ticket_requests WHERE event_id = ? AND user_id = ? AND status IN ('pending', 'approved')",
        [event.id, req.session.user.id]
      )
      if (mine.length > 0) {
        myRequest = mine[0]
      }
    }

    var today = new Date().toISOString().slice(0, 10)
    var isPast = false
    if (event.event_date < today) {
      isPast = true
    }

    res.render('events/show', {
      title: event.title,
      event: event,
      ticketsLeft: ticketsLeft,
      counts: counts,
      myRequest: myRequest,
      isPast: isPast,
      errors: [],
      old: {}
    })
  } catch (err) {
    next(err)
  }
})

router.post('/:id/request', auth.mustLogin, async function (req, res, next) {
  if (!validate.isWholeNumber(req.params.id)) {
    return res.status(404).render('error', {
      title: 'Not found',
      message: 'Event not found.'
    })
  }

  let data = {
    quantity: validate.clean(req.body.quantity),
    note: validate.clean(req.body.note)
  }

  try {
    var rows = await db.execute('SELECT * FROM events WHERE id = ?', [req.params.id])
    if (rows.length == 0) {
      return res.status(404).render('error', {
        title: 'Not found',
        message: 'Event not found.'
      })
    }
    let event = rows[0]

    let errors = validate.checkTicket(data)

    if (event.status != 'open') {
      errors.push('This event is closed.')
    }

    let today = new Date().toISOString().slice(0, 10)
    if (event.event_date < today) {
      errors.push('This event is already finished.')
    }

    var sold = await db.execute(
      "SELECT SUM(quantity) AS used FROM ticket_requests WHERE event_id = ? AND status = 'approved'",
      [event.id]
    )
    var used = 0
    if (sold[0].used != null) {
      used = Number(sold[0].used)
    }
    let ticketsLeft = event.total_tickets - used

    if (Number(data.quantity) > ticketsLeft) {
      errors.push('Only ' + ticketsLeft + ' tickets left.')
    }

    // One open request per event
    var mine = await db.execute(
      "SELECT id FROM ticket_requests WHERE event_id = ? AND user_id = ? AND status IN ('pending', 'approved')",
      [event.id, req.session.user.id]
    )
    if (mine.length > 0) {
      errors.push('You already have a request for this event. See My tickets.')
    }

    if (errors.length > 0) {
      var full = await db.execute(
        `SELECT events.*, categories.name AS category_name,
           maker.name AS created_by_name, editor.name AS updated_by_name
         FROM events
         JOIN categories ON events.category_id = categories.id
         JOIN users AS maker ON events.created_by = maker.id
         LEFT JOIN users AS editor ON events.updated_by = editor.id
         WHERE events.id = ?`,
        [event.id]
      )
      return res.status(400).render('events/show', {
        title: event.title, event: full[0], ticketsLeft: ticketsLeft, errors: errors, old: data
      })
    }

    var result = await db.execute(
      'INSERT INTO ticket_requests (event_id, user_id, quantity, note) VALUES (?, ?, ?, ?)',
      [event.id, req.session.user.id, data.quantity, data.note]
    )
    await addLog(req.session.user.id, 'create', 'ticket_request', result.insertId,
      'Asked for ' + data.quantity + ' tickets for event ' + event.id)

    req.session.message = {
      type: 'success',
      text: 'Request sent. The admin will check it soon.'
    }
    res.redirect('/tickets')
  } catch (err) {
    next(err)
  }
})

router.get('/:id/edit', auth.mustAdmin, async function (req, res, next) {
  try {
    var rows = await db.execute('SELECT * FROM events WHERE id = ?', [req.params.id])
    if (rows.length == 0) {
      return res.status(404).render('error', {
        title: 'Not found',
        message: 'Event not found.'
      })
    }
    const categories = await getCategories()
    let event = rows[0]
    event.event_time = String(event.event_time).slice(0, 5)

    res.render('events/form', {
      title: 'Edit event', categories: categories, event: event, errors: [], isEdit: true
    })
  } catch (err) {
    next(err)
  }
})

router.post('/:id/edit', auth.mustAdmin, async function (req, res, next) {
  var data = {
    id: req.params.id,
    title: validate.clean(req.body.title),
    description: validate.clean(req.body.description),
    category_id: validate.clean(req.body.category_id),
    venue: validate.clean(req.body.venue),
    event_date: validate.clean(req.body.event_date),
    event_time: validate.clean(req.body.event_time),
    total_tickets: validate.clean(req.body.total_tickets),
    price: validate.clean(req.body.price),
    status: validate.clean(req.body.status),
    ai_id: validate.clean(req.body.ai_id),
    ai_choice: validate.clean(req.body.ai_choice)
  }

  var errors = validate.checkEvent(data)
  if (data.ai_choice != '' && req.body.ai_checked != 'yes') {
    errors.push('Please tick the box to say you checked the AI text.')
  }

  try {
    var rows = await db.execute('SELECT id FROM events WHERE id = ?', [req.params.id])
    if (rows.length == 0) {
      return res.status(404).render('error', {
        title: 'Not found',
        message: 'Event not found.'
      })
    }

    if (errors.length > 0) {
      const categories = await getCategories()
      return res.status(400).render('events/form', {
        title: 'Edit event', categories: categories, event: data, errors: errors, isEdit: true
      })
    }

    await db.execute(
      `UPDATE events SET title = ?, description = ?, category_id = ?, venue = ?, event_date = ?,
        event_time = ?, total_tickets = ?, price = ?, status = ?, updated_by = ?
       WHERE id = ?`,
      [data.title, data.description, data.category_id, data.venue, data.event_date, data.event_time,
      data.total_tickets, data.price, data.status, req.session.user.id, req.params.id]
    )
    await addLog(
      req.session.user.id, 'update', 'event', Number(req.params.id), 'Edited event: ' + data.title
    )
    await saveAiChoice(req, Number(req.params.id), data.description)

    req.session.message = {
      type: 'success',
      text: 'Event saved.'
    }
    res.redirect('/events/' + req.params.id)
  } catch (err) {
    next(err)
  }
})

router.post('/:id/delete', auth.mustAdmin, async function (req, res, next) {
  try {
    var rows = await db.execute('SELECT title FROM events WHERE id = ?', [req.params.id])
    if (rows.length == 0) {
      return res.status(404).render('error', {
        title: 'Not found',
        message: 'Event not found.'
      })
    }

    await db.execute('DELETE FROM events WHERE id = ?', [req.params.id])
    await addLog(
      req.session.user.id, 'delete', 'event', Number(req.params.id), 'Deleted event: ' + rows[0].title
    )

    req.session.message = {
      type: 'success',
      text: 'Event deleted.'
    }
    res.redirect('/events')
  } catch (err) {
    next(err)
  }
})

module.exports = router
