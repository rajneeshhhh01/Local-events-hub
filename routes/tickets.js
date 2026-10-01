// Ticket request pages
const express = require('express')
const router = express.Router()
const db = require('../config/db')
const addLog = require('../helpers/log')
var validate = require('../helpers/validate')
var auth = require('../middleware/auth')

router.use(auth.mustLogin)

// User sees own requests, admin sees all
router.get('/', async function (req, res, next) {
  try {
    let status = validate.clean(req.query.status)
    let search = validate.clean(req.query.search)
    let page = parseInt(req.query.page)
    if (isNaN(page) || page < 1) page = 1
    let perPage = 10

    let where = ' WHERE 1=1 '
    let params = []

    if (req.session.user.role != 'admin') {
      where += ' AND ticket_requests.user_id = ? '
      params.push(req.session.user.id)
    }

    let okStatus = ['pending', 'approved', 'rejected', 'cancelled']
    if (okStatus.includes(status)) {
      where += ' AND ticket_requests.status = ? '
      params.push(status)
    }

    if (search != '') {
      where += ' AND (events.title LIKE ? OR users.name LIKE ?) '
      params.push('%' + search + '%', '%' + search + '%')
    }

    let fromPart = ` FROM ticket_requests
      JOIN events ON ticket_requests.event_id = events.id
      JOIN users ON ticket_requests.user_id = users.id
      LEFT JOIN users AS editor ON ticket_requests.updated_by = editor.id `

    var countRows = await db.execute('SELECT COUNT(*) AS total' + fromPart + where, params)
    let total = countRows[0].total
    let totalPages = Math.ceil(total / perPage)
    if (totalPages < 1) {
      totalPages = 1
    }
    if (page > totalPages) page = totalPages

    params.push(perPage)
    params.push((page - 1) * perPage)

    var rows = await db.query(
      `SELECT ticket_requests.*, events.title AS event_title, events.event_date,
        events.event_time, events.venue, events.price,
        users.name AS user_name, users.email AS user_email, editor.name AS updated_by_name` +
      fromPart + where + ' ORDER BY ticket_requests.created_at DESC LIMIT ? OFFSET ?',
      params
    )

    // Count each status for the tabs
    var tabWhere = ''
    var tabParams = []
    if (req.session.user.role != 'admin') {
      tabWhere = ' WHERE user_id = ? '
      tabParams.push(req.session.user.id)
    }
    var tabRows = await db.execute('SELECT status, COUNT(*) AS n FROM ticket_requests' + tabWhere + ' GROUP BY status', tabParams)
    var tabs = {
      all: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      cancelled: 0
    }
    for (var i = 0; i < tabRows.length; i++) {
      tabs[tabRows[i].status] = tabRows[i].n
      tabs.all = tabs.all + tabRows[i].n
    }

    let pageTitle = 'My tickets'
    if (req.session.user.role == 'admin') {
      pageTitle = 'Ticket requests'
    }

    res.render('tickets/list', {
      title: pageTitle,
      requests: rows,
      tabs: tabs,
      status: status,
      search: search,
      page: page,
      totalPages: totalPages,
      total: total
    })
  } catch (err) {
    next(err)
  }
})

async function getRequest(req) {
  if (!validate.isWholeNumber(req.params.id)) return null

  var rows = await db.execute(
    `SELECT ticket_requests.*, events.title AS event_title, events.event_date, events.total_tickets
     FROM ticket_requests JOIN events ON ticket_requests.event_id = events.id
     WHERE ticket_requests.id = ?`,
    [req.params.id]
  )
  if (rows.length == 0) return null

  // User can only change own request
  if (req.session.user.role != 'admin' && rows[0].user_id != req.session.user.id) {
    return null
  }
  return rows[0]
}

router.get('/:id/edit', async function (req, res, next) {
  try {
    let ticket = await getRequest(req)
    if (!ticket) {
      return res.status(404).render('error', {
        title: 'Not found',
        message: 'Request not found.'
      })
    }
    if (ticket.status != 'pending') {
      req.session.message = {
        type: 'error',
        text: 'You can only edit a pending request.'
      }
      return res.redirect('/tickets')
    }
    res.render('tickets/edit', {
      title: 'Edit request',
      ticket: ticket,
      errors: []
    })
  } catch (err) {
    next(err)
  }
})

router.post('/:id/edit', async function (req, res, next) {
  try {
    let ticket = await getRequest(req)
    if (!ticket) {
      return res.status(404).render('error', {
        title: 'Not found',
        message: 'Request not found.'
      })
    }
    if (ticket.status != 'pending') {
      req.session.message = {
        type: 'error',
        text: 'You can only edit a pending request.'
      }
      return res.redirect('/tickets')
    }

    let data = {
      quantity: validate.clean(req.body.quantity),
      note: validate.clean(req.body.note)
    }
    let errors = validate.checkTicket(data)

    if (errors.length > 0) {
      ticket.quantity = data.quantity
      ticket.note = data.note
      return res.status(400).render('tickets/edit', {
        title: 'Edit request',
        ticket: ticket,
        errors: errors
      })
    }

    await db.execute(
      'UPDATE ticket_requests SET quantity = ?, note = ?, updated_by = ? WHERE id = ?',
      [data.quantity, data.note, req.session.user.id, ticket.id]
    )
    await addLog(
      req.session.user.id, 'update', 'ticket_request', ticket.id, 'Changed to ' + data.quantity + ' tickets'
    )

    req.session.message = {
      type: 'success',
      text: 'Request saved.'
    }
    res.redirect('/tickets')
  } catch (err) {
    next(err)
  }
})

router.post('/:id/cancel', async function (req, res, next) {
  try {
    let ticket = await getRequest(req)
    if (!ticket) {
      return res.status(404).render('error', {
        title: 'Not found',
        message: 'Request not found.'
      })
    }
    if (ticket.status != 'pending') {
      req.session.message = {
        type: 'error',
        text: 'You can only cancel a pending request.'
      }
      return res.redirect('/tickets')
    }

    await db.execute(
      "UPDATE ticket_requests SET status = 'cancelled', updated_by = ? WHERE id = ?",
      [req.session.user.id, ticket.id]
    )
    await addLog(
      req.session.user.id, 'cancel', 'ticket_request', ticket.id, 'Request cancelled'
    )

    req.session.message = {
      type: 'success',
      text: 'Request cancelled.'
    }
    res.redirect('/tickets')
  } catch (err) {
    next(err)
  }
})

router.post('/:id/status', auth.mustAdmin, async function (req, res, next) {
  try {
    let ticket = await getRequest(req)
    if (!ticket) {
      return res.status(404).render('error', {
        title: 'Not found',
        message: 'Request not found.'
      })
    }

    let newStatus = validate.clean(req.body.status)
    if (newStatus != 'approved' && newStatus != 'rejected') {
      req.session.message = {
        type: 'error',
        text: 'Wrong status.'
      }
      return res.redirect('/tickets')
    }

    // Check tickets left before approve
    if (newStatus == 'approved') {
      var sold = await db.execute(
        "SELECT SUM(quantity) AS used FROM ticket_requests WHERE event_id = ? AND status = 'approved' AND id != ?",
        [ticket.event_id, ticket.id]
      )
      var used = 0
      if (sold[0].used != null) {
        used = Number(sold[0].used)
      }
      let left = ticket.total_tickets - used
      if (ticket.quantity > left) {
        req.session.message = {
          type: 'error',
          text: 'Not enough tickets. Only ' + left + ' left.'
        }
        return res.redirect('/tickets')
      }
    }

    await db.execute(
      'UPDATE ticket_requests SET status = ?, updated_by = ? WHERE id = ?',
      [newStatus, req.session.user.id, ticket.id]
    )
    await addLog(
      req.session.user.id, newStatus, 'ticket_request', ticket.id, 'Request ' + newStatus
    )

    req.session.message = {
      type: 'success',
      text: 'Request ' + newStatus + '.'
    }
    res.redirect('/tickets')
  } catch (err) {
    next(err)
  }
})

// Delete request (admin)
router.post('/:id/delete', auth.mustAdmin, async function (req, res, next) {
  try {
    let ticket = await getRequest(req)
    if (!ticket) {
      return res.status(404).render('error', {
        title: 'Not found',
        message: 'Request not found.'
      })
    }
    await db.execute('DELETE FROM ticket_requests WHERE id = ?', [ticket.id])
    await addLog(
      req.session.user.id, 'delete', 'ticket_request', ticket.id, 'Request deleted'
    )

    req.session.message = {
      type: 'success',
      text: 'Request deleted.'
    }
    res.redirect('/tickets')
  } catch (err) {
    next(err)
  }
})

module.exports = router
