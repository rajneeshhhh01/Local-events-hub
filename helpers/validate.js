// Server side form checks

// Make it text and remove spaces
function clean(value) {
  if (value == undefined || value == null) {
    return ''
  }
  return String(value).trim()
}

function isDigit(ch) {
  return ch >= '0' && ch <= '9'
}

function isLetter(ch) {
  return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z')
}

// Simple email check
function isEmail(text) {
  if (text.includes(' ')) {
    return false
  }
  var at = text.indexOf('@')
  if (at < 1) {
    return false
  }
  var dot = text.lastIndexOf('.')
  if (dot < at + 2) {
    return false
  }
  if (dot == text.length - 1) {
    return false
  }
  return true
}

function isWholeNumber(text) {
  text = String(text)
  if (text.length == 0) {
    return false
  }
  for (var i = 0; i < text.length; i++) {
    if (!isDigit(text[i])) {
      return false
    }
  }
  return true
}

// Password needs a letter and a number
function hasLetterAndNumber(text) {
  var letter = false
  var number = false
  for (var i = 0; i < text.length; i++) {
    if (isLetter(text[i])) letter = true
    if (isDigit(text[i])) number = true
  }
  return letter && number
}

function isDate(text) {
  if (text.length != 10) return false
  if (text[4] != '-' || text[7] != '-') return false
  var numbers = text.replace('-', '').replace('-', '')
  return isWholeNumber(numbers)
}

function isTime(text) {
  if (text.length != 5 && text.length != 8) return false
  if (text[2] != ':') return false
  if (text.length == 8 && text[5] != ':') return false
  var numbers = text.split(':').join('')
  return isWholeNumber(numbers)
}

// Register form
function checkRegister(data) {
  var errors = []

  if (data.name.length < 2 || data.name.length > 100) {
    errors.push('Name must be 2 to 100 letters.')
  }
  if (!isEmail(data.email) || data.email.length > 150) {
    errors.push('Please type a real email.')
  }
  if (data.password.length < 8) {
    errors.push('Password must be at least 8 letters.')
  }
  if (!hasLetterAndNumber(data.password)) {
    errors.push('Password needs letters and numbers.')
  }
  if (data.password != data.confirm) {
    errors.push('Passwords do not match.')
  }

  return errors
}

function checkLogin(data) {
  var errors = []

  if (!isEmail(data.email)) {
    errors.push('Please type a real email.')
  }
  if (data.password.length == 0) {
    errors.push('Please type your password.')
  }

  return errors
}

// Event form
function checkEvent(data) {
  var errors = []

  if (data.title.length < 3 || data.title.length > 120) {
    errors.push('Title must be 3 to 120 letters.')
  }
  if (data.description.length < 20 || data.description.length > 2000) {
    errors.push('Description must be 20 to 2000 letters.')
  }
  if (!isWholeNumber(data.category_id)) {
    errors.push('Please pick a category.')
  }
  if (data.venue.length < 3 || data.venue.length > 150) {
    errors.push('Venue must be 3 to 150 letters.')
  }
  if (!isDate(data.event_date)) {
    errors.push('Please pick a date.')
  }
  if (!isTime(data.event_time)) {
    errors.push('Please pick a time.')
  }

  var tickets = Number(data.total_tickets)
  if (!isWholeNumber(data.total_tickets) || tickets < 1 || tickets > 10000) {
    errors.push('Tickets must be a number from 1 to 10000.')
  }

  var price = Number(data.price)
  if (data.price == '' || isNaN(price) || price < 0 || price > 9999) {
    errors.push('Price must be a number from 0 to 9999.')
  }

  if (data.status != 'open' && data.status != 'closed') {
    errors.push('Status must be open or closed.')
  }

  return errors
}

function checkTicket(data) {
  var errors = []

  var qty = Number(data.quantity)
  if (!isWholeNumber(data.quantity) || qty < 1 || qty > 10) {
    errors.push('You can ask for 1 to 10 tickets.')
  }
  if (data.note.length > 255) {
    errors.push('Note must be less than 255 letters.')
  }

  return errors
}

function checkCategory(name) {
  var errors = []

  if (name.length < 2 || name.length > 60) {
    errors.push('Category name must be 2 to 60 letters.')
  }

  return errors
}

module.exports = {
  clean: clean,
  isEmail: isEmail,
  isWholeNumber: isWholeNumber,
  checkRegister: checkRegister,
  checkLogin: checkLogin,
  checkEvent: checkEvent,
  checkTicket: checkTicket,
  checkCategory: checkCategory
}
