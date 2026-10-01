// Help bot finds the best answer in faq.json
const faqList = require('../data/faq.json')

function askBot(question) {
  var text = question.toLowerCase()

  var bestAnswer = null
  var bestCount = 0

  for (var i = 0; i < faqList.length; i++) {
    var count = 0

    // Count keywords found in the question
    for (var j = 0; j < faqList[i].keywords.length; j++) {
      if (text.includes(faqList[i].keywords[j])) {
        count++
      }
    }

    if (count > bestCount) {
      bestCount = count
      bestAnswer = faqList[i]
    }
  }

  if (bestAnswer == null) {
    return {
      found: false,
      question: '',
      answer: 'Sorry, I do not know this. Please try other words or email help@localevents.example.'
    }
  }

  return {
    found: true,
    question: bestAnswer.question,
    answer: bestAnswer.answer
  }
}

module.exports = {
  askBot: askBot,
  faqList: faqList
}
