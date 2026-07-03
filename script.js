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

// Select the PDF download button
const downloadButton = document.getElementById("download-pdf");

// Listen for click on the PDF download button
downloadButton.addEventListener("click", function () {
  // Access jsPDF from the loaded library
  const { jsPDF } = window.jspdf;

  // Create a new PDF document
  const doc = new jsPDF();

  // Get receipt preview values
  const shopName = document.getElementById("preview-shop").textContent;
  const customerName = document.getElementById("preview-customer").textContent;
  const receiptDate = document.getElementById("preview-date").textContent;
  const itemName = document.getElementById("preview-item").textContent;
  const quantity = document.getElementById("preview-quantity").textContent;
  const unitPrice = document.getElementById("preview-price").textContent;
  const total = document.getElementById("preview-total").textContent;

  // Add receipt content to the PDF
  doc.setFontSize(20);
  doc.text(shopName, 105, 20, { align: "center" });

  doc.setFontSize(12);
  doc.text(`Customer: ${customerName}`, 20, 40);
  doc.text(`Date: ${receiptDate}`, 20, 50);

  doc.line(20, 60, 190, 60);

  doc.text(`Item: ${itemName}`, 20, 75);
  doc.text(`Quantity: ${quantity}`, 20, 85);
  doc.text(`Unit Price: €${unitPrice}`, 20, 95);

  doc.line(20, 105, 190, 105);

  doc.setFontSize(16);
  doc.text(`Total: €${total}`, 20, 120);

  doc.setFontSize(10);
  doc.text("Thank you for your purchase!", 105, 145, { align: "center" });

  // Download the PDF file
  doc.save("receipt.pdf");
});