// Ticket form with minus and plus buttons

var qtyInput = document.getElementById('quantity')
var minusBtn = document.getElementById('qtyMinus')
var plusBtn = document.getElementById('qtyPlus')
var totalText = document.getElementById('totalPrice')
var form = document.getElementById('requestForm')

var price = Number(form.getAttribute('data-price'))
var min = Number(qtyInput.min)
var max = Number(qtyInput.max)

// Update the total price
function showTotal() {
  var qty = Number(qtyInput.value)
  if (isNaN(qty) || qty < 1) {
    qty = 0
  }

  if (price == 0) {
    totalText.textContent = 'Free'
  } else {
    totalText.textContent = '$' + (qty * price).toFixed(2)
  }
}

minusBtn.addEventListener('click', function () {
  var qty = Number(qtyInput.value)
  if (qty > min) {
    qtyInput.value = qty - 1
  }
  showTotal()
})

plusBtn.addEventListener('click', function () {
  var qty = Number(qtyInput.value)
  if (isNaN(qty) || qty < min) {
    qty = 0
  }
  if (qty < max) {
    qtyInput.value = qty + 1
  }
  showTotal()
})

qtyInput.addEventListener('input', showTotal)

showTotal()
