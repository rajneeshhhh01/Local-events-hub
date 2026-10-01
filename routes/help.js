// Help page and API for the help bot and AI
const express = require('express')
const router = express.Router()
const db = require('../config/db')
const addLog = require('../helpers/log')
var helpBot = require('../helpers/helpBot')
var aiWriter = require('../helpers/aiWriter')
var validate = require('../helpers/validate')

router.get('/help', function (req, res) {
  res.render('help', {
    title: 'Help',
    faqList: helpBot.faqList
  })
})

// Help bot API
router.post('/api/help', function (req, res) {
  let question = validate.clean(req.body.question)

  if (question.length == 0) {
    return res.status(400).json({
      error: 'Please type a question.'
    })
  }
  if (question.length > 300) {
    return res.status(400).json({
      error: 'Question is too long.'
    })
  }

  let result = helpBot.askBot(question)
  res.json(result)
})

// AI writing helper API, admin only
router.post('/api/ai/describe', async function (req, res) {
  if (!req.session.user || req.session.user.role != 'admin') {
    return res.status(403).json({
      error: 'Only admin can use this.'
    })
  }

  let info = {
    title: validate.clean(req.body.title).slice(0, 120),
    category: validate.clean(req.body.category).slice(0, 60),
    venue: validate.clean(req.body.venue).slice(0, 150),
    date: validate.clean(req.body.date).slice(0, 10),
    price: validate.clean(req.body.price).slice(0, 10),
    keywords: validate.clean(req.body.keywords).slice(0, 200)
  }

  if (info.title.length < 3) {
    return res.status(400).json({
      error: 'Please type the event title first.'
    })
  }

  let drafts = aiWriter.makeDrafts(info)
  let titles = aiWriter.makeTitles(info)

  try {
    let inputText = info.title + ' | ' + info.category + ' | ' + info.keywords
    var result = await db.execute(
      'INSERT INTO ai_suggestions (user_id, input_text, suggestions) VALUES (?, ?, ?)',
      [req.session.user.id, inputText.slice(0, 255), JSON.stringify(drafts)]
    )
    await addLog(
      req.session.user.id, 'ai suggest', 'ai_suggestion', result.insertId, 'AI made 3 drafts'
    )

    res.json({
      id: result.insertId,
      drafts: drafts,
      titles: titles
    })
  } catch (err) {
    console.log(err)
    res.status(500).json({
      error: 'AI helper is not working now. Please write it yourself.'
    })
  }
})

module.exports = router