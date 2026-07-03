// ======================================
// DOM ELEMENTS
// ======================================

const receiptForm = document.getElementById("receipt-form");
const downloadButton = document.getElementById("download-pdf");
const addProductButton = document.getElementById("add-item-button");
const itemsContainer = document.getElementById("items-container");
const receiptPreview = document.getElementById("receipt-preview");

const shopNameInput = document.getElementById("shop-name");
const customerNameInput = document.getElementById("customer-name");
const receiptDateInput = document.getElementById("receipt-date");

const previewShop = document.getElementById("preview-shop");
const previewCustomer = document.getElementById("preview-customer");
const previewDate = document.getElementById("preview-date");
const previewTotal = document.getElementById("preview-total");

// ======================================
// STATE
// ======================================

const state = {
  currentReceiptData: null,
  previewProductsContainer: null,
};

// ======================================
// EVENT LISTENERS
// ======================================

initializeApp();

function initializeApp() {
  if (!receiptForm || !itemsContainer || !receiptPreview) {
    return;
  }

  receiptForm.setAttribute("novalidate", "novalidate");
  ensurePreviewProductsContainer();
  renderPreviewProducts([]);
  updateProductCards();

  receiptForm.addEventListener("submit", handleFormSubmit);
  receiptForm.addEventListener("input", handleFormInputChange);

  if (addProductButton) {
    addProductButton.addEventListener("click", handleAddProductButtonClick);
  }

  itemsContainer.addEventListener("click", handleItemsContainerClick);

  if (downloadButton) {
    downloadButton.addEventListener("click", handleDownloadButtonClick);
  }
}

function handleFormSubmit(event) {
  event.preventDefault();

  const receiptData = buildReceiptData();

  if (!receiptData) {
    state.currentReceiptData = null;

    if (downloadButton) {
      downloadButton.disabled = true;
    }

    return;
  }

  state.currentReceiptData = receiptData;
  updateReceiptPreview(receiptData);

  if (downloadButton) {
    downloadButton.disabled = false;
  }
}

function handleFormInputChange() {
  markReceiptAsOutdated();
}

function handleAddProductButtonClick() {
  addProductCard();
  markReceiptAsOutdated();
}

function handleItemsContainerClick(event) {
  const removeButton = event.target.closest(".remove-item-button");

  if (!removeButton) {
    return;
  }

  const productCard = removeButton.closest(".item-card");
  removeProductCard(productCard);
  markReceiptAsOutdated();
}

function handleDownloadButtonClick() {
  if (!state.currentReceiptData) {
    alert("Please generate the receipt before downloading the PDF.");
    return;
  }

  generatePDF(state.currentReceiptData);
}

// ======================================
// PRODUCT MANAGEMENT
// ======================================

function addProductCard() {
  const productNumber = getProductCards().length + 1;
  const productCard = createProductCard(productNumber);

  itemsContainer.appendChild(productCard);
  updateProductCards();

  const productNameInput = productCard.querySelector(".item-name");

  if (productNameInput) {
    productNameInput.focus();
  }
}

function createProductCard(productNumber) {
  const productCard = document.createElement("div");
  productCard.className = "item-card";
  productCard.innerHTML = `
    <div class="item-card-header">
      <span>Product ${productNumber}</span>
      <button type="button" class="remove-item-button">Remove</button>
    </div>
    <div class="item-fields">
      <label>
        Product Name
        <input
          type="text"
          class="item-name"
          placeholder="Example: Cappuccino"
          required
        />
      </label>
      <label>
        Quantity
        <input
          type="number"
          class="item-quantity"
          min="1"
          value="1"
          required
        />
      </label>
      <label>
        Unit Price (€)
        <input
          type="number"
          class="item-price"
          placeholder="2.50"
          step="0.01"
          min="0"
          required
        />
      </label>
    </div>
  `;

  return productCard;
}

function removeProductCard(productCard) {
  if (!productCard || getProductCards().length === 1) {
    return;
  }

  productCard.remove();
  updateProductCards();
}

function updateProductCards() {
  const productCards = getProductCards();

  productCards.forEach(function (card, index) {
    updateProductCardTitle(card, index + 1);
    syncRemoveButton(card, index > 0);
  });
}

function updateProductCardTitle(card, productNumber) {
  const header = card.querySelector(".item-card-header");

  if (!header) {
    return;
  }

  let title = header.querySelector("span");

  if (!title) {
    title = document.createElement("span");
    header.insertBefore(title, header.firstChild);
  }

  title.textContent = `Product ${productNumber}`;
}

function syncRemoveButton(card, shouldShowRemoveButton) {
  const header = card.querySelector(".item-card-header");

  if (!header) {
    return;
  }

  let removeButton = header.querySelector(".remove-item-button");

  if (shouldShowRemoveButton && !removeButton) {
    removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "remove-item-button";
    removeButton.textContent = "Remove";
    header.appendChild(removeButton);
  }

  if (!shouldShowRemoveButton && removeButton) {
    removeButton.remove();
  }
}

// ======================================
// RECEIPT DATA
// ======================================

function buildReceiptData() {
  const products = collectProducts();

  if (!validateProducts(products)) {
    return null;
  }

  return {
    shopName: getInputValue(shopNameInput, "Coffee Shop Name"),
    customerName: getInputValue(customerNameInput, "Walk-in Customer"),
    receiptDate: getInputValue(receiptDateInput, getTodayDateString()),
    receiptNumber: generateReceiptNumber(),
    products,
    total: calculateReceiptTotal(products),
  };
}

function collectProducts() {
  return getProductCards().map(function (card) {
    const nameInput = card.querySelector(".item-name");
    const quantityInput = card.querySelector(".item-quantity");
    const unitPriceInput = card.querySelector(".item-price");

    const name = nameInput ? nameInput.value.trim() : "";
    const quantityValue = quantityInput ? quantityInput.value.trim() : "";
    const unitPriceValue = unitPriceInput ? unitPriceInput.value.trim() : "";

    const quantity = quantityValue === "" ? Number.NaN : Number(quantityValue);
    const unitPrice = unitPriceValue === "" ? Number.NaN : Number(unitPriceValue);

    return {
      name,
      quantity,
      unitPrice,
      total: quantity * unitPrice,
    };
  });
}

function validateProducts(products) {
  if (products.length === 0) {
    alert("Add at least one product before generating the receipt.");
    return false;
  }

  for (let index = 0; index < products.length; index += 1) {
    const product = products[index];
    const productNumber = index + 1;

    if (!product.name) {
      alert(`Product ${productNumber}: product name cannot be empty.`);
      return false;
    }

    if (!Number.isFinite(product.quantity) || product.quantity <= 0) {
      alert(`Product ${productNumber}: quantity must be greater than 0.`);
      return false;
    }

    if (!Number.isFinite(product.unitPrice)) {
      alert(`Product ${productNumber}: unit price is required.`);
      return false;
    }

    if (product.unitPrice < 0) {
      alert(`Product ${productNumber}: unit price cannot be negative.`);
      return false;
    }
  }

  return true;
}

// ======================================
// PREVIEW UPDATE
// ======================================

function updateReceiptPreview(receiptData) {
  if (previewShop) {
    previewShop.textContent = receiptData.shopName;
  }

  if (previewCustomer) {
    previewCustomer.textContent = receiptData.customerName;
  }

  if (previewDate) {
    previewDate.textContent = receiptData.receiptDate;
  }

  if (previewTotal) {
    previewTotal.textContent = formatAmount(receiptData.total);
  }

  renderPreviewProducts(receiptData.products);
}

function ensurePreviewProductsContainer() {
  if (state.previewProductsContainer) {
    return state.previewProductsContainer;
  }

  const existingContainer = document.getElementById("preview-products-container");

  if (existingContainer) {
    state.previewProductsContainer = existingContainer;
    return existingContainer;
  }

  const oldItemRow = document.getElementById("preview-item")?.closest("p");
  const oldQuantityRow = document.getElementById("preview-quantity")?.closest("p");
  const oldPriceRow = document.getElementById("preview-price")?.closest("p");
  const totalHeading = previewTotal ? previewTotal.closest("h3") : null;

  const productsSection = document.createElement("div");
  productsSection.id = "preview-products-section";

  const sectionLabel = document.createElement("p");
  const sectionLabelStrong = document.createElement("strong");
  sectionLabelStrong.textContent = "Products:";
  sectionLabel.appendChild(sectionLabelStrong);

  const productsContainer = document.createElement("div");
  productsContainer.id = "preview-products-container";

  productsSection.appendChild(sectionLabel);
  productsSection.appendChild(productsContainer);

  if (oldItemRow && oldItemRow.parentNode === receiptPreview) {
    receiptPreview.insertBefore(productsSection, oldItemRow);
  } else if (totalHeading && totalHeading.parentNode === receiptPreview) {
    receiptPreview.insertBefore(productsSection, totalHeading);
  } else {
    receiptPreview.appendChild(productsSection);
  }

  [oldItemRow, oldQuantityRow, oldPriceRow].forEach(function (row) {
    if (row) {
      row.remove();
    }
  });

  state.previewProductsContainer = productsContainer;
  return productsContainer;
}

function renderPreviewProducts(products) {
  const productsContainer = ensurePreviewProductsContainer();
  productsContainer.replaceChildren();

  if (products.length === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.textContent = "No products generated yet.";
    productsContainer.appendChild(emptyMessage);
    return;
  }

  products.forEach(function (product, index) {
    const productRow = document.createElement("p");
    const productName = document.createElement("strong");

    productName.textContent = `${index + 1}. ${product.name}`;
    productRow.appendChild(productName);
    productRow.appendChild(
      document.createTextNode(
        ` - Qty: ${product.quantity} | Unit Price: ${formatCurrency(product.unitPrice)} | Total: ${formatCurrency(product.total)}`
      )
    );

    productsContainer.appendChild(productRow);
  });
}

// ======================================
// PDF GENERATION
// ======================================

function generatePDF(receiptData) {
  if (!window.jspdf || !window.jspdf.jsPDF) {
    alert("The PDF library is not available right now.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  createReceiptTemplate(doc, receiptData);
  doc.save(`receipt-${sanitizeFileName(receiptData.receiptNumber)}.pdf`);
}

function createReceiptTemplate(doc, receiptData) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const rightMargin = pageWidth - 20;

  doc.setFontSize(22);
  doc.text(String(receiptData.shopName).toUpperCase(), pageWidth / 2, 20, {
    align: "center",
  });

  doc.setFontSize(10);
  doc.text("Coffee Shop Receipt", pageWidth / 2, 28, {
    align: "center",
  });

  doc.setFontSize(11);
  doc.text(`Receipt #: ${receiptData.receiptNumber}`, 20, 40);
  doc.text(`Date: ${receiptData.receiptDate}`, 20, 48);
  doc.text(`Customer: ${receiptData.customerName}`, 20, 56);

  doc.line(20, 64, rightMargin, 64);

  let currentY = drawPdfTableHeader(doc, 74, rightMargin);
  currentY = drawPdfProductRows(doc, receiptData.products, currentY, rightMargin);
  currentY = ensurePdfContentSpace(doc, currentY, 26);

  doc.setFontSize(16);
  doc.text(`FINAL TOTAL: ${formatCurrency(receiptData.total)}`, rightMargin, currentY, {
    align: "right",
  });

  currentY += 16;
  currentY = ensurePdfContentSpace(doc, currentY, 20);

  doc.setFontSize(10);
  doc.text("Thank you for your visit!", pageWidth / 2, currentY, {
    align: "center",
  });
  doc.text("Generated with Receipt Generator JS", pageWidth / 2, currentY + 8, {
    align: "center",
  });
}

function drawPdfTableHeader(doc, startY, rightMargin) {
  doc.setFontSize(11);
  doc.text("Item", 20, startY);
  doc.text("Qty", 120, startY, { align: "right" });
  doc.text("Unit Price", 155, startY, { align: "right" });
  doc.text("Total", rightMargin, startY, { align: "right" });
  doc.line(20, startY + 5, rightMargin, startY + 5);

  return startY + 12;
}

function drawPdfProductRows(doc, products, startY, rightMargin) {
  let currentY = startY;

  products.forEach(function (product, index) {
    const productLabel = `${index + 1}. ${product.name}`;
    const nameLines = doc.splitTextToSize(productLabel, 85);
    const rowHeight = Math.max(8, nameLines.length * 6);

    if (currentY + rowHeight + 10 > 275) {
      doc.addPage();
      currentY = drawPdfTableHeader(doc, 20, rightMargin);
    }

    doc.text(nameLines, 20, currentY);
    doc.text(String(product.quantity), 120, currentY, { align: "right" });
    doc.text(formatCurrency(product.unitPrice), 155, currentY, {
      align: "right",
    });
    doc.text(formatCurrency(product.total), rightMargin, currentY, {
      align: "right",
    });

    currentY += rowHeight;
    doc.line(20, currentY + 2, rightMargin, currentY + 2);
    currentY += 10;
  });

  return currentY;
}

// ======================================
// HELPER FUNCTIONS
// ======================================

function getProductCards() {
  return Array.from(itemsContainer.querySelectorAll(".item-card"));
}

function markReceiptAsOutdated() {
  state.currentReceiptData = null;

  if (downloadButton) {
    downloadButton.disabled = true;
  }
}

function getInputValue(inputElement, fallbackValue) {
  if (!inputElement) {
    return fallbackValue;
  }

  const value = inputElement.value.trim();
  return value || fallbackValue;
}

function calculateReceiptTotal(products) {
  return products.reduce(function (total, product) {
    return total + product.total;
  }, 0);
}

function formatAmount(amount) {
  return Number.isFinite(amount) ? amount.toFixed(2) : "0.00";
}

function formatCurrency(amount) {
  return `€${formatAmount(amount)}`;
}

function getTodayDateString() {
  const today = new Date();
  const year = String(today.getFullYear());
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function generateReceiptNumber() {
  const timestamp = String(Date.now()).slice(-6);
  const randomNumber = String(Math.floor(Math.random() * 900) + 100);

  return `RCPT-${timestamp}${randomNumber}`;
}

function ensurePdfContentSpace(doc, currentY, requiredHeight) {
  const pageHeight = doc.internal.pageSize.getHeight();
  const bottomMargin = 20;

  if (currentY + requiredHeight <= pageHeight - bottomMargin) {
    return currentY;
  }

  doc.addPage();
  return 20;
}

function sanitizeFileName(value) {
  return String(value).replace(/[^a-z0-9_-]/gi, "-");
}
