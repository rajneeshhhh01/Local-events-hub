// AI writing helper on the event form

var aiBtn = document.getElementById('aiBtn')
var aiStatus = document.getElementById('aiStatus')
var aiDrafts = document.getElementById('aiDrafts')
var descBox = document.getElementById('description')
var csrf = document.querySelector('input[name="_csrf"]').value

aiBtn.addEventListener('click', function () {
  var title = document.getElementById('title').value.trim()
  var catSelect = document.getElementById('category_id')
  var category = ''
  if (catSelect.value != '') {
    category = catSelect.options[catSelect.selectedIndex].text
  }

  if (title.length < 3) {
    aiStatus.textContent = 'Please type the event title first.'
    return
  }

  aiStatus.textContent = 'Making drafts...'
  aiBtn.disabled = true

  fetch('/api/ai/describe', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-csrf-token': csrf
    },
    body: JSON.stringify({
      title: title,
      category: category,
      venue: document.getElementById('venue').value,
      date: document.getElementById('event_date').value,
      price: document.getElementById('price').value,
      keywords: document.getElementById('keywords').value
    })
  })
    .then(function (res) {
      return res.json()
    })
    .then(function (data) {
      aiBtn.disabled = false
      if (data.error) {
        aiStatus.textContent = data.error
        return
      }
      document.getElementById('aiId').value = data.id
      document.getElementById('aiChoice').value = ''
      aiStatus.textContent = 'Here are 3 drafts. Pick one, then change it in the box below.'
      showDrafts(data.drafts)
    })
    .catch(function () {
      aiBtn.disabled = false
      aiStatus.textContent = 'AI helper is not working now. Please write it yourself.'
    })
})

function showDrafts(drafts) {
  aiDrafts.innerHTML = ''

  for (var i = 0; i < drafts.length; i++) {
    var div = document.createElement('div')
    div.className = 'draft'

    var p = document.createElement('p')
    p.textContent = drafts[i]

    var btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'btn btn-small btn-light'
    btn.textContent = 'Use draft ' + (i + 1)
    btn.setAttribute('data-num', i + 1)
    btn.setAttribute('data-text', drafts[i])

    btn.addEventListener('click', function () {
      descBox.value = this.getAttribute('data-text')
      document.getElementById('aiChoice').value = this.getAttribute('data-num')
      var num = this.getAttribute('data-num')
      aiStatus.textContent = 'Draft ' + num + ' is in the box. Please read and edit it before you save.'
      // Human must tick the box before saving
      document.getElementById('aiCheckRow').hidden = false
      document.getElementById('ai_checked').required = true
      document.getElementById('ai_checked').checked = false
      descBox.focus()
    })

    div.appendChild(p)
    div.appendChild(btn)
    aiDrafts.appendChild(div)
  }
}
