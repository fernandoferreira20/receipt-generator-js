// ======================================
// DOM ELEMENTS
// ======================================

// Form element
const receiptForm = document.getElementById("receipt-form");

// PDF download button
const downloadButton = document.getElementById("download-pdf");


// ======================================
// EVENT LISTENERS
// ======================================

// Run handleFormSubmit when the form is submitted
receiptForm.addEventListener("submit", handleFormSubmit);

// Run generatePDF when the download button is clicked
downloadButton.addEventListener("click", generatePDF);


// ======================================
// FORM HANDLING
// ======================================

function handleFormSubmit(event) {
  // Prevent the page from reloading
  event.preventDefault();

  // Get the data typed by the user
  const receiptData = getFormData();

  // Update the receipt preview on the page
  updateReceiptPreview(receiptData);

  // Enable the PDF download button
  downloadButton.disabled = false;
}


// ======================================
// DATA COLLECTION
// ======================================

function getFormData() {
  // Get values from input fields
  const shopName = document.getElementById("shop-name").value;
  const customerName = document.getElementById("customer-name").value;
  const receiptDate = document.getElementById("receipt-date").value;
  const itemName = document.getElementById("item-name").value;
  const quantity = document.getElementById("quantity").value;
  const unitPrice = document.getElementById("unit-price").value;

  // Calculate total price
  const total = Number(quantity) * Number(unitPrice);

  // Return all receipt information as one object
  return {
    shopName,
    customerName,
    receiptDate,
    itemName,
    quantity,
    unitPrice,
    total,
  };
}


// ======================================
// PREVIEW UPDATE
// ======================================

function updateReceiptPreview(receiptData) {
  // Update shop and customer information
  document.getElementById("preview-shop").textContent = receiptData.shopName;
  document.getElementById("preview-customer").textContent = receiptData.customerName;
  document.getElementById("preview-date").textContent = receiptData.receiptDate;

  // Update item information
  document.getElementById("preview-item").textContent = receiptData.itemName;
  document.getElementById("preview-quantity").textContent = receiptData.quantity;
  document.getElementById("preview-price").textContent = Number(receiptData.unitPrice).toFixed(2);

  // Update total
  document.getElementById("preview-total").textContent = receiptData.total.toFixed(2);
}


// ======================================
// PDF GENERATION
// ======================================

function generatePDF() {
  // Access jsPDF from the external library
  const { jsPDF } = window.jspdf;

  // Create a new PDF document
  const doc = new jsPDF();

  // Get the current information from the preview
  const receiptData = getPreviewData();

  // Generate a random receipt number
  const receiptNumber = Math.floor(Math.random() * 100000);

  // Add content to the PDF
  createReceiptTemplate(doc, receiptData, receiptNumber);

  // Save the PDF file
  doc.save(`receipt-${receiptNumber}.pdf`);
}


// ======================================
// PREVIEW DATA COLLECTION
// ======================================

function getPreviewData() {
  // Get values currently displayed in the receipt preview
  return {
    shopName: document.getElementById("preview-shop").textContent,
    customerName: document.getElementById("preview-customer").textContent,
    receiptDate: document.getElementById("preview-date").textContent,
    itemName: document.getElementById("preview-item").textContent,
    quantity: document.getElementById("preview-quantity").textContent,
    unitPrice: document.getElementById("preview-price").textContent,
    total: document.getElementById("preview-total").textContent,
  };
}


// ======================================
// PDF TEMPLATE
// ======================================

function createReceiptTemplate(doc, receiptData, receiptNumber) {
  // Receipt header
  doc.setFontSize(22);
  doc.text(receiptData.shopName.toUpperCase(), 105, 20, {
    align: "center",
  });

  doc.setFontSize(10);
  doc.text("Coffee Shop Receipt", 105, 28, {
    align: "center",
  });

  // Receipt information
  doc.text(`Receipt #: ${receiptNumber}`, 20, 40);
  doc.text(`Date: ${receiptData.receiptDate}`, 20, 48);
  doc.text(`Customer: ${receiptData.customerName}`, 20, 56);

  // Separator line
  doc.line(20, 65, 190, 65);

  // Table header
  doc.setFontSize(11);
  doc.text("Item", 20, 75);
  doc.text("Qty", 115, 75);
  doc.text("Price", 145, 75);
  doc.text("Total", 175, 75);

  doc.line(20, 80, 190, 80);

  // Product row
  doc.text(receiptData.itemName, 20, 90);
  doc.text(receiptData.quantity, 118, 90);
  doc.text(`€${receiptData.unitPrice}`, 145, 90);
  doc.text(`€${receiptData.total}`, 175, 90);

  doc.line(20, 100, 190, 100);

  // Total section
  doc.setFontSize(16);
  doc.text(`TOTAL: €${receiptData.total}`, 190, 115, {
    align: "right",
  });

  // Footer
  doc.setFontSize(10);
  doc.text("Payment Method: Card / Cash", 20, 130);

  doc.text("Thank you for your visit!", 105, 145, {
    align: "center",
  });

  doc.text("www.receiptgeneratorjs.com", 105, 152, {
    align: "center",
  });
}