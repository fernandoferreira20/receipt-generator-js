// Select the form using its ID from the HTML
const receiptForm = document.getElementById("receipt-form");

// Listen for the form submit event
receiptForm.addEventListener("submit", function (event) {
  // Prevent the page from reloading after submitting the form
  event.preventDefault();

  // Get the value typed in the Coffee Shop Name input
  const shopName = document.getElementById("shop-name").value;

  // Show the shop name in the browser console
  console.log("Coffee Shop Name:", shopName);

  // Get the remaining values from the form
  const customerName = document.getElementById("customer-name").value;
  const receiptDate = document.getElementById("receipt-date").value;
  const itemName = document.getElementById("item-name").value;
  const quantity = document.getElementById("quantity").value;
  const unitPrice = document.getElementById("unit-price").value;

  // Calculate the total price
  const total = quantity * unitPrice;

  // Update the receipt preview
  document.getElementById("preview-shop").textContent = shopName;
  document.getElementById("preview-customer").textContent = customerName;
  document.getElementById("preview-date").textContent = receiptDate;
  document.getElementById("preview-item").textContent = itemName;
  document.getElementById("preview-quantity").textContent = quantity;
  document.getElementById("preview-price").textContent = Number(unitPrice).toFixed(2);
  document.getElementById("preview-total").textContent = total.toFixed(2);

  // Enable the PDF download button
  document.getElementById("download-pdf").disabled = false;
});