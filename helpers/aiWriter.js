// AI writing helper, makes 3 drafts from event details
// It uses templates, no data goes to outside AI

var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
var months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

// Change 2026-11-14 to Saturday 14 November 2026
function niceDate(dateText) {
  if (!dateText) {
    return 'a date to be announced'
  }
  var d = new Date(dateText + 'T00:00:00')
  if (isNaN(d.getTime())) {
    return 'a date to be announced'
  }
  return days[d.getDay()] + ' ' + d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear()
}

// Join words with commas and "and"
function joinWords(text) {
  if (!text) return ''

  var parts = text.split(',')
  var words = []
  for (var i = 0; i < parts.length; i++) {
    var w = parts[i].trim().toLowerCase()
    if (w != '' && words.length < 5) {
      words.push(w)
    }
  }

  if (words.length == 0) return ''
  if (words.length == 1) return words[0]

  var result = ''
  for (var i = 0; i < words.length; i++) {
    if (i == 0) {
      result = words[i]
    } else if (i == words.length - 1) {
      result = result + ' and ' + words[i]
    } else {
      result = result + ', ' + words[i]
    }
  }
  return result
}

function makeDrafts(info) {
  var title = info.title || 'Our event'
  var category = (info.category || 'community').toLowerCase()
  var venue = info.venue || 'our local venue'
  var date = niceDate(info.date)
  var keywords = joinWords(info.keywords)

  var price = 'Entry is free.'
  if (info.price && Number(info.price) > 0) {
    price = 'Tickets are $' + Number(info.price).toFixed(2) + ' each.'
  }

  var draft1 = 'Join us for ' + title + ' at ' + venue + ' on ' + date + '. '
  if (keywords != '') {
    draft1 = draft1 + 'Enjoy ' + keywords + ' with friends and neighbours. '
  } else {
    draft1 = draft1 + 'Meet friends and neighbours at this ' + category + ' event. '
  }
  draft1 = draft1 + price + ' Request your tickets today.'

  var draft2 = title + ' (' + category + ' event). ' + date + ' at ' + venue + '. '
  if (keywords != '') {
    draft2 = draft2 + 'Includes ' + keywords + '. '
  }
  draft2 = draft2 + price + ' Places are limited.'

  var draft3 = 'The Local Events team is proud to present ' + title + ', a ' + category + ' event'
  draft3 = draft3 + ' held at ' + venue + ' on ' + date + '. '
  if (keywords != '') {
    draft3 = draft3 + 'The program includes ' + keywords + '. '
  }
  draft3 = draft3 + 'Everyone is welcome. ' + price + ' Please request tickets early.'

  return [draft1, draft2, draft3]
}

// Three title ideas
function makeTitles(info) {
  var title = info.title || 'Community Event'
  var venue = info.venue || 'Town'
  var year = new Date().getFullYear()

  return [
    title + ' ' + year,
    title + ' at ' + venue,
    'Community Day: ' + title
  ]
}

module.exports = {
  makeDrafts: makeDrafts,
  makeTitles: makeTitles,
  niceDate: niceDate,
  joinWords: joinWords
}
