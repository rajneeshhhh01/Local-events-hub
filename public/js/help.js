// Help bot chat

var helpForm = document.getElementById('helpForm')
var questionInput = document.getElementById('question')
var chatBox = document.getElementById('chatBox')
var token = document.getElementById('csrfToken').value

// Add a message to the chat
function addMessage(text, who) {
  var p = document.createElement('p')
  p.className = who + '-msg'
  p.textContent = text
  chatBox.appendChild(p)
  chatBox.scrollTop = chatBox.scrollHeight
}

helpForm.addEventListener('submit', function (e) {
  e.preventDefault()

  var question = questionInput.value.trim()
  if (question == '') {
    addMessage('Please type a question first.', 'bot')
    return
  }

  addMessage(question, 'user')
  questionInput.value = ''

  fetch('/api/help', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-csrf-token': token
    },
    body: JSON.stringify({
      question: question
    })
  })
    .then(function (res) {
      return res.json()
    })
    .then(function (data) {
      if (data.error) {
        addMessage(data.error, 'bot')
      } else {
        addMessage(data.answer, 'bot')
      }
    })
    .catch(function () {
      addMessage('Sorry, the help bot is not working now.', 'bot')
    })
})
