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
});