// Code for all pages

// Mobile menu
var menuBtn = document.getElementById('menuBtn')
var mainNav = document.getElementById('mainNav')

if (menuBtn) {
  menuBtn.addEventListener('click', function () {
    mainNav.classList.toggle('open')
    if (mainNav.classList.contains('open')) {
      menuBtn.setAttribute('aria-expanded', 'true')
    } else {
      menuBtn.setAttribute('aria-expanded', 'false')
    }
  })
}

// Ask before delete
var confirmForms = document.querySelectorAll('.js-confirm')
for (var i = 0; i < confirmForms.length; i++) {
  confirmForms[i].addEventListener('submit', function (e) {
    var msg = this.getAttribute('data-msg') || 'Are you sure?'
    if (!confirm(msg)) {
      e.preventDefault()
    }
  })
}

// Form checks in the browser

function showError(input, text) {
  input.classList.add('bad')
  input.setAttribute('aria-invalid', 'true')

  var box = input.parentNode.querySelector('.field-error')
  if (!box) {
    box = document.createElement('p')
    box.className = 'field-error'
    box.id = input.id + '-error'
    input.parentNode.appendChild(box)
    input.setAttribute('aria-describedby', box.id)
  }
  box.textContent = text
}

function clearError(input) {
  input.classList.remove('bad')
  input.removeAttribute('aria-invalid')
  var box = input.parentNode.querySelector('.field-error')
  if (box) {
    box.textContent = ''
  }
}

// Check one input, return true if ok
function checkInput(input, form) {
  var value = input.value.trim()
  var label = form.querySelector('label[for="' + input.id + '"]')
  var name = label ? label.textContent : 'This field'

  clearError(input)

  if (input.type == 'checkbox') {
    if (input.required && !input.checked) {
      showError(input, 'Please tick this box.')
      return false
    }
    return true
  }

  if (input.required && value == '') {
    showError(input, name + ' is needed.')
    return false
  }

  if (value == '') return true

  if (input.type == 'email') {
    var at = value.indexOf('@')
    var dot = value.lastIndexOf('.')
    if (at < 1 || dot < at + 2 || dot == value.length - 1 || value.includes(' ')) {
      showError(input, 'Please type a real email.')
      return false
    }
  }

  var min = input.getAttribute('minlength')
  if (min && value.length < Number(min)) {
    showError(input, name + ' must be at least ' + min + ' letters.')
    return false
  }

  var max = input.getAttribute('maxlength')
  if (max && value.length > Number(max)) {
    showError(input, name + ' is too long.')
    return false
  }

  if (input.type == 'number') {
    if (isNaN(value)) {
      showError(input, 'Please type a number.')
      return false
    }
    if (input.min != '' && Number(value) < Number(input.min)) {
      showError(input, 'Smallest is ' + input.min + '.')
      return false
    }
    if (input.max != '' && Number(value) > Number(input.max)) {
      showError(input, 'Biggest is ' + input.max + '.')
      return false
    }
  }

  if (input.getAttribute('data-rule') == 'password') {
    var hasLetter = false
    var hasNumber = false
    for (var c = 0; c < value.length; c++) {
      var ch = value[c]
      if ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z')) hasLetter = true
      if (ch >= '0' && ch <= '9') hasNumber = true
    }
    if (!hasLetter || !hasNumber) {
      showError(input, 'Use letters and numbers.')
      return false
    }
  }

  var matchId = input.getAttribute('data-match')
  if (matchId) {
    var other = document.getElementById(matchId)
    if (other && other.value != input.value) {
      showError(input, 'Passwords do not match.')
      return false
    }
  }

  return true
}

var checkForms = document.querySelectorAll('.js-check')
for (var f = 0; f < checkForms.length; f++) {
  var form = checkForms[f]

  form.addEventListener('submit', function (e) {
    var theForm = this
    var inputs = theForm.querySelectorAll('input, select, textarea')
    var allOk = true
    var firstBad = null

    for (var j = 0; j < inputs.length; j++) {
      if (inputs[j].type == 'hidden' || !inputs[j].id) continue
      var ok = checkInput(inputs[j], theForm)
      if (!ok) {
        allOk = false
        if (firstBad == null) firstBad = inputs[j]
      }
    }

    if (!allOk) {
      e.preventDefault()
      firstBad.focus()
    }
  })

  var fields = form.querySelectorAll('input, select, textarea')
  for (var k = 0; k < fields.length; k++) {
    fields[k].addEventListener('blur', function () {
      if (this.type != 'hidden' && this.id && this.classList.contains('bad')) {
        checkInput(this, this.form)
      }
    })
  }
}
