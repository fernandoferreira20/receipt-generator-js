// ======================================
// DOM ELEMENTS
// ======================================

const LOGO_PATH = "assets/icons/Logo.png";

const receiptForm = document.getElementById("receipt-form");
const downloadButton = document.getElementById("download-pdf");
const addProductButton = document.getElementById("add-item-button");
const itemsContainer = document.getElementById("items-container");
const receiptPreview = document.getElementById("receipt-preview");
const appHeaderLogo = document.querySelector(".app-header-logo");

const shopNameInput = document.getElementById("shop-name");
const customerNameInput = document.getElementById("customer-name");
const receiptDateInput = document.getElementById("receipt-date");
const paymentMethodInputs = document.querySelectorAll('input[name="payment-method"]');

const previewLogo = document.getElementById("preview-logo");
const previewShop = document.getElementById("preview-shop");
const previewCustomer = document.getElementById("preview-customer");
const previewDate = document.getElementById("preview-date");
const previewProductsContainer = document.getElementById("preview-products-container");
const previewTotal = document.getElementById("preview-total");
const previewPaymentMethod = document.getElementById("preview-payment-method");

// ======================================
// STATE
// ======================================

const state = {
  currentReceiptData: null,
  generatedReceiptNumber: null,
  logoDataUrl: null,
  logoAspectRatio: 1,
  logoLoadPromise: null,
};

// ======================================
// EVENT LISTENERS
// ======================================

initializeApp();

function initializeApp() {
  if (!receiptForm || !itemsContainer || !receiptPreview || !previewProductsContainer) {
    return;
  }

  setBrandImages();
  receiptForm.setAttribute("novalidate", "novalidate");
  setDefaultReceiptDate();
  updateProductCards();
  refreshLivePreview();

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

  const receiptData = buildGeneratedReceiptData();

  if (!receiptData) {
    state.currentReceiptData = null;

    if (downloadButton) {
      downloadButton.disabled = true;
    }

    return;
  }

  state.currentReceiptData = receiptData;

  if (downloadButton) {
    downloadButton.disabled = false;
  }
}

function handleFormInputChange() {
  markReceiptAsOutdated();
  refreshLivePreview();
}

function handleAddProductButtonClick() {
  addProductCard();
  markReceiptAsOutdated();
  refreshLivePreview();
}

function handleItemsContainerClick(event) {
  const removeButton = event.target.closest(".remove-item-button");

  if (!removeButton) {
    return;
  }

  const productCard = removeButton.closest(".item-card");
  removeProductCard(productCard);
  markReceiptAsOutdated();
  refreshLivePreview();
}

async function handleDownloadButtonClick() {
  if (!state.currentReceiptData) {
    alert("Please generate the receipt before downloading the PDF.");
    return;
  }

  await generatePDF(state.currentReceiptData);
}

// ======================================
// PRODUCT MANAGEMENT
// ======================================

function addProductCard() {
  const productNumber = getProductCards().length + 1;
  const productCard = createProductCard(productNumber);

  itemsContainer.appendChild(productCard);
  updateProductCards();

  const productNameField = productCard.querySelector(".item-name");

  if (productNameField) {
    productNameField.focus();
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
  const title = card.querySelector(".item-card-header span");

  if (title) {
    title.textContent = `Product ${productNumber}`;
  }
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

function buildGeneratedReceiptData() {
  const receiptInfo = collectReceiptInfo();
  const collectedProducts = collectProducts();

  if (!validateReceiptInfo(receiptInfo) || !validateProducts(collectedProducts)) {
    return null;
  }

  const products = sanitizeProductsForReceipt(collectedProducts);
  const receiptNumber = getGeneratedReceiptNumber(receiptInfo.receiptDate);

  return createReceiptData(receiptInfo, products, receiptNumber);
}

function buildLivePreviewData() {
  const receiptInfo = collectReceiptInfo();
  const collectedProducts = collectProducts();
  const previewProducts = createPreviewProducts(collectedProducts);

  return {
    shopName: formatPreviewShopName(receiptInfo.shopName),
    customerName: receiptInfo.customerName || "---",
    receiptDate: receiptInfo.receiptDate || "---",
    paymentMethod: receiptInfo.paymentMethod || "Card",
    products: previewProducts,
    total: calculateReceiptTotal(previewProducts),
  };
}

function collectReceiptInfo() {
  return {
    shopName: shopNameInput ? shopNameInput.value.trim() : "",
    customerName: customerNameInput ? customerNameInput.value.trim() : "",
    receiptDate: receiptDateInput ? receiptDateInput.value.trim() : "",
    paymentMethod: getSelectedPaymentMethod(),
  };
}

function collectProducts() {
  return getProductCards().map(function (card) {
    const nameInput = card.querySelector(".item-name");
    const quantityInput = card.querySelector(".item-quantity");
    const unitPriceInput = card.querySelector(".item-price");

    const name = nameInput ? nameInput.value.trim() : "";
    const rawQuantity = quantityInput ? quantityInput.value.trim() : "";
    const rawUnitPrice = unitPriceInput ? unitPriceInput.value.trim() : "";
    const quantity = parseNumberValue(rawQuantity);
    const unitPrice = parseNumberValue(rawUnitPrice);

    return {
      card,
      nameInput,
      quantityInput,
      unitPriceInput,
      name,
      rawQuantity,
      rawUnitPrice,
      quantity,
      unitPrice,
    };
  });
}

function sanitizeProductsForReceipt(collectedProducts) {
  return collectedProducts.map(function (product) {
    return {
      name: product.name,
      quantity: product.quantity,
      unitPrice: product.unitPrice,
      total: calculateProductTotal(product.quantity, product.unitPrice),
    };
  });
}

function createPreviewProducts(collectedProducts) {
  return collectedProducts
    .filter(shouldDisplayPreviewProduct)
    .map(function (product) {
      const quantity = normalizePreviewNumber(product.quantity);
      const unitPrice = normalizePreviewNumber(product.unitPrice);

      return {
        name: product.name || "Untitled Product",
        quantity,
        unitPrice,
        total: calculateProductTotal(quantity, unitPrice),
      };
    });
}

function createReceiptData(receiptInfo, products, receiptNumber) {
  return {
    shopName: receiptInfo.shopName,
    customerName: receiptInfo.customerName,
    receiptDate: receiptInfo.receiptDate,
    paymentMethod: receiptInfo.paymentMethod,
    receiptNumber,
    products,
    total: calculateReceiptTotal(products),
  };
}

function validateReceiptInfo(receiptInfo) {
  if (!receiptInfo.shopName) {
    alert("Coffee shop name is required.");
    focusInput(shopNameInput);
    return false;
  }

  if (!receiptInfo.customerName) {
    alert("Customer name is required.");
    focusInput(customerNameInput);
    return false;
  }

  if (!receiptInfo.receiptDate) {
    alert("Receipt date is required.");
    focusInput(receiptDateInput);
    return false;
  }

  if (!receiptInfo.paymentMethod) {
    alert("Payment method is required.");
    focusInput(paymentMethodInputs[0]);
    return false;
  }

  return true;
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
      focusInput(product.nameInput);
      return false;
    }

    if (!Number.isFinite(product.quantity) || product.quantity <= 0) {
      alert(`Product ${productNumber}: quantity must be greater than 0.`);
      focusInput(product.quantityInput);
      return false;
    }

    if (!Number.isFinite(product.unitPrice)) {
      alert(`Product ${productNumber}: unit price is required.`);
      focusInput(product.unitPriceInput);
      return false;
    }

    if (product.unitPrice < 0) {
      alert(`Product ${productNumber}: unit price cannot be negative.`);
      focusInput(product.unitPriceInput);
      return false;
    }
  }

  return true;
}

// ======================================
// PREVIEW UPDATE
// ======================================

function refreshLivePreview() {
  const previewData = buildLivePreviewData();
  updateReceiptPreview(previewData);
}

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

  if (previewPaymentMethod) {
    previewPaymentMethod.textContent = receiptData.paymentMethod;
  }

  renderPreviewProducts(receiptData.products);
}

function renderPreviewProducts(products) {
  previewProductsContainer.replaceChildren();

  if (products.length === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "preview-empty-state";
    emptyMessage.textContent = "Add products to preview the receipt.";
    previewProductsContainer.appendChild(emptyMessage);
    return;
  }

  products.forEach(function (product, index) {
    previewProductsContainer.appendChild(createPreviewProductCard(product, index + 1));
  });
}

function createPreviewProductCard(product, productNumber) {
  const productCard = document.createElement("div");
  productCard.className = "preview-product-card";

  const heading = document.createElement("div");
  heading.className = "preview-product-heading";

  const number = document.createElement("span");
  number.className = "preview-product-number";
  number.textContent = `${productNumber}.`;

  const name = document.createElement("span");
  name.className = "preview-product-name";
  name.textContent = product.name;

  heading.appendChild(number);
  heading.appendChild(name);

  const details = document.createElement("div");
  details.className = "preview-product-details";

  const quantity = document.createElement("span");
  quantity.textContent = `Qty: ${formatPreviewNumber(product.quantity)}`;

  const unitPrice = document.createElement("span");
  unitPrice.textContent = `${formatCurrency(product.unitPrice)} each`;

  details.appendChild(quantity);
  details.appendChild(unitPrice);

  const subtotal = document.createElement("div");
  subtotal.className = "preview-product-subtotal";
  subtotal.textContent = `Subtotal: ${formatCurrency(product.total)}`;

  productCard.appendChild(heading);
  productCard.appendChild(details);
  productCard.appendChild(subtotal);

  return productCard;
}

// ======================================
// PDF GENERATION
// ======================================

async function generatePDF(receiptData) {
  if (!window.jspdf || !window.jspdf.jsPDF) {
    alert("The PDF library is not available right now.");
    return;
  }

  try {
    await ensureLogoDataLoaded();
  } catch (error) {
    alert("The logo could not be loaded for the PDF.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  createReceiptTemplate(doc, receiptData);
  doc.save(`receipt-${sanitizeFileName(receiptData.receiptNumber)}.pdf`);
}

function createReceiptTemplate(doc, receiptData) {
  const layout = getPdfLayout(doc);

  let currentY = drawReceiptHeader(doc, receiptData, layout);
  currentY = drawCustomerInfo(doc, receiptData, currentY, layout);
  currentY = drawProductsTable(doc, receiptData, currentY, layout);
  currentY = drawReceiptTotal(doc, receiptData, currentY, layout);
  currentY = drawReceiptPaymentMethod(doc, receiptData, currentY, layout);
  drawReceiptFooter(doc, receiptData, currentY, layout);
}

function drawReceiptHeader(doc, receiptData, layout, isContinuation) {
  const subtitle = isContinuation
    ? "Coffee Shop Receipt - Continued"
    : "Coffee Shop Receipt";
  const logoBottomY = drawPdfLogo(
    doc,
    layout.pageWidth / 2,
    layout.topMargin,
    isContinuation ? 18 : 24,
    isContinuation ? 18 : 24
  );
  const shopNameY = logoBottomY + 10;
  const subtitleY = shopNameY + 8;
  const dividerY = subtitleY + 7;

  doc.setFontSize(isContinuation ? 16 : 19);
  doc.setTextColor(90, 56, 37);
  doc.text(formatPdfShopName(receiptData.shopName), layout.pageWidth / 2, shopNameY, {
    align: "center",
  });

  doc.setFontSize(9);
  doc.setTextColor(123, 75, 42);
  doc.text(subtitle, layout.pageWidth / 2, subtitleY, {
    align: "center",
  });

  doc.setDrawColor(214, 191, 168);
  doc.line(layout.leftMargin, dividerY, layout.rightMargin, dividerY);

  doc.setTextColor(43, 29, 20);
  return dividerY + 10;
}

function drawCustomerInfo(doc, receiptData, startY, layout) {
  const customerLines = doc.splitTextToSize(
    receiptData.customerName,
    layout.customerColumnWidth
  );
  const infoBoxHeight = Math.max(32, customerLines.length * 5 + 16);

  doc.setDrawColor(214, 191, 168);
  doc.setFillColor(255, 250, 243);
  doc.roundedRect(
    layout.leftMargin,
    startY,
    layout.contentWidth,
    infoBoxHeight,
    3,
    3,
    "FD"
  );

  doc.setFontSize(8);
  doc.setTextColor(123, 75, 42);
  doc.text("CUSTOMER", layout.leftMargin + 4, startY + 7);
  doc.text("DATE", layout.rightColumnX, startY + 7);
  doc.text("RECEIPT #", layout.rightColumnX, startY + 18);

  doc.setFontSize(11);
  doc.setTextColor(43, 29, 20);
  doc.text(customerLines, layout.leftMargin + 4, startY + 13);
  doc.text(receiptData.receiptDate, layout.rightColumnX, startY + 13);
  doc.text(receiptData.receiptNumber, layout.rightColumnX, startY + 24);

  return startY + infoBoxHeight + 10;
}

function drawProductsTable(doc, receiptData, startY, layout) {
  let currentY = startY;

  doc.setFontSize(9);
  doc.setTextColor(123, 75, 42);
  doc.text("PRODUCTS", layout.leftMargin, currentY);
  currentY += 6;

  currentY = drawProductsTableHeader(doc, currentY, layout);

  receiptData.products.forEach(function (product, index) {
    const productLabel = `${index + 1}. ${product.name}`;
    const itemLines = doc.splitTextToSize(productLabel, layout.itemColumnWidth);
    const rowHeight = Math.max(14, itemLines.length * 5 + 8);

    if (needsPdfPageBreak(doc, currentY, rowHeight + 6, layout.bottomMargin)) {
      currentY = startPdfContinuationPage(doc, receiptData, layout);
      currentY = drawProductsTableHeader(doc, currentY, layout);
    }

    if (index % 2 === 0) {
      doc.setFillColor(255, 250, 245);
      doc.rect(layout.leftMargin, currentY, layout.contentWidth, rowHeight, "F");
    }

    doc.setFontSize(10);
    doc.setTextColor(43, 29, 20);

    const textY = currentY + 7;

    doc.text(itemLines, layout.itemColumnX, textY);
    doc.text(formatPreviewNumber(product.quantity), layout.quantityColumnX, textY, {
      align: "right",
    });
    doc.text(formatCurrency(product.unitPrice), layout.unitPriceColumnX, textY, {
      align: "right",
    });
    doc.text(formatCurrency(product.total), layout.subtotalColumnX, textY, {
      align: "right",
    });

    doc.setDrawColor(230, 214, 196);
    doc.line(
      layout.leftMargin,
      currentY + rowHeight,
      layout.rightMargin,
      currentY + rowHeight
    );

    currentY += rowHeight;
  });

  doc.setTextColor(43, 29, 20);
  return currentY + 10;
}

function drawReceiptTotal(doc, receiptData, currentY, layout) {
  currentY = ensurePdfSectionSpace(doc, currentY, 22, receiptData, layout);

  doc.setFillColor(248, 239, 227);
  doc.roundedRect(
    layout.leftMargin,
    currentY,
    layout.contentWidth,
    16,
    3,
    3,
    "F"
  );

  doc.setFontSize(10);
  doc.setTextColor(123, 75, 42);
  doc.text("FINAL TOTAL", layout.leftMargin + 4, currentY + 10);

  doc.setFontSize(16);
  doc.setTextColor(90, 56, 37);
  doc.text(formatCurrency(receiptData.total), layout.rightMargin - 4, currentY + 10, {
    align: "right",
  });

  doc.setTextColor(43, 29, 20);
  return currentY + 24;
}

function drawReceiptPaymentMethod(doc, receiptData, currentY, layout) {
  currentY = ensurePdfSectionSpace(doc, currentY, 24, receiptData, layout);

  doc.setFillColor(255, 250, 243);
  doc.setDrawColor(214, 191, 168);
  doc.roundedRect(
    layout.leftMargin,
    currentY,
    layout.contentWidth,
    18,
    3,
    3,
    "FD"
  );

  doc.setFontSize(9);
  doc.setTextColor(123, 75, 42);
  doc.text("PAYMENT METHOD", layout.leftMargin + 4, currentY + 7);

  doc.setFontSize(11);
  doc.setTextColor(43, 29, 20);
  doc.text(receiptData.paymentMethod, layout.leftMargin + 4, currentY + 13);

  return currentY + 24;
}

function drawReceiptFooter(doc, receiptData, currentY, layout) {
  currentY = ensurePdfSectionSpace(doc, currentY, 30, receiptData, layout);

  const footerLines = doc.splitTextToSize(
    "Fresh coffee, warm service, and one more reason to come back.",
    layout.contentWidth - 12
  );

  doc.setDrawColor(214, 191, 168);
  doc.line(layout.leftMargin, currentY, layout.rightMargin, currentY);

  doc.setFontSize(10);
  doc.setTextColor(90, 56, 37);
  doc.text("Thank you for your visit!", layout.pageWidth / 2, currentY + 8, {
    align: "center",
  });

  doc.setFontSize(8);
  doc.setTextColor(123, 75, 42);
  doc.text(footerLines, layout.pageWidth / 2, currentY + 14, {
    align: "center",
  });

  doc.setTextColor(43, 29, 20);
}

function drawProductsTableHeader(doc, currentY, layout) {
  doc.setFillColor(90, 56, 37);
  doc.rect(layout.leftMargin, currentY, layout.contentWidth, 8, "F");

  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text("Item", layout.itemColumnX, currentY + 5.5);
  doc.text("Qty", layout.quantityColumnX, currentY + 5.5, {
    align: "right",
  });
  doc.text("Unit Price", layout.unitPriceColumnX, currentY + 5.5, {
    align: "right",
  });
  doc.text("Subtotal", layout.subtotalColumnX, currentY + 5.5, {
    align: "right",
  });

  doc.setTextColor(43, 29, 20);
  return currentY + 12;
}

function startPdfContinuationPage(doc, receiptData, layout) {
  doc.addPage();

  let currentY = drawReceiptHeader(doc, receiptData, layout, true);

  doc.setFontSize(9);
  doc.setTextColor(123, 75, 42);
  doc.text(`Receipt #: ${receiptData.receiptNumber}`, layout.leftMargin, currentY);
  doc.text(`Date: ${receiptData.receiptDate}`, layout.rightMargin, currentY, {
    align: "right",
  });

  doc.setTextColor(43, 29, 20);
  return currentY + 8;
}

function ensurePdfSectionSpace(doc, currentY, requiredHeight, receiptData, layout) {
  if (!needsPdfPageBreak(doc, currentY, requiredHeight, layout.bottomMargin)) {
    return currentY;
  }

  if (receiptData) {
    return startPdfContinuationPage(doc, receiptData, layout);
  }

  doc.addPage();
  return layout.topMargin;
}

function getPdfLayout(doc) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const leftMargin = 18;
  const rightMargin = pageWidth - 18;
  const contentWidth = rightMargin - leftMargin;
  const subtotalColumnX = rightMargin - 4;
  const unitPriceColumnX = subtotalColumnX - 32;
  const quantityColumnX = unitPriceColumnX - 28;

  return {
    pageWidth,
    topMargin: 16,
    bottomMargin: 18,
    leftMargin,
    rightMargin,
    contentWidth,
    itemColumnX: leftMargin + 4,
    quantityColumnX,
    unitPriceColumnX,
    subtotalColumnX,
    itemColumnWidth: quantityColumnX - leftMargin - 14,
    customerColumnWidth: 92,
    rightColumnX: leftMargin + 110,
  };
}

function drawPdfLogo(doc, centerX, topY, maxWidth, maxHeight) {
  if (!state.logoDataUrl) {
    return topY;
  }

  const logoSize = getContainedLogoSize(state.logoAspectRatio, maxWidth, maxHeight);
  const logoX = centerX - logoSize.width / 2;

  doc.addImage(
    state.logoDataUrl,
    "PNG",
    logoX,
    topY,
    logoSize.width,
    logoSize.height
  );

  return topY + logoSize.height;
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

function setBrandImages() {
  if (appHeaderLogo) {
    appHeaderLogo.src = LOGO_PATH;
  }

  if (previewLogo) {
    previewLogo.src = LOGO_PATH;
  }
}

function setDefaultReceiptDate() {
  if (receiptDateInput && !receiptDateInput.value) {
    receiptDateInput.value = getTodayDateString();
  }
}

function getSelectedPaymentMethod() {
  const selectedInput = Array.from(paymentMethodInputs).find(function (input) {
    return input.checked;
  });

  return selectedInput ? selectedInput.value : "";
}

function getGeneratedReceiptNumber(receiptDate) {
  if (!state.generatedReceiptNumber) {
    state.generatedReceiptNumber = generateReceiptNumber(receiptDate);
  }

  return state.generatedReceiptNumber;
}

function calculateProductTotal(quantity, unitPrice) {
  return quantity * unitPrice;
}

function calculateReceiptTotal(products) {
  return products.reduce(function (total, product) {
    return total + product.total;
  }, 0);
}

function parseNumberValue(value) {
  if (value === "") {
    return Number.NaN;
  }

  return Number(value);
}

function normalizePreviewNumber(value) {
  if (!Number.isFinite(value) || value < 0) {
    return 0;
  }

  return value;
}

function shouldDisplayPreviewProduct(product) {
  return (
    product.name !== "" ||
    product.rawUnitPrice !== "" ||
    (product.rawQuantity !== "" && product.rawQuantity !== "1")
  );
}

function formatPreviewShopName(name) {
  const safeName = name ? name.trim() : "";
  return safeName ? `— ${safeName} —` : "— Coffee Shop —";
}

function formatPdfShopName(name) {
  const safeName = name ? name.trim() : "";
  return safeName || "Coffee Shop";
}

function formatAmount(amount) {
  return Number.isFinite(amount) ? amount.toFixed(2) : "0.00";
}

function formatCurrency(amount) {
  return `€${formatAmount(amount)}`;
}

function formatPreviewNumber(value) {
  if (!Number.isFinite(value)) {
    return "0";
  }

  return Number.isInteger(value) ? String(value) : String(value);
}

function getTodayDateString() {
  const today = new Date();
  const year = String(today.getFullYear());
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function generateReceiptNumber(receiptDate) {
  const datePart = formatReceiptNumberDate(receiptDate);
  const sequence = generateReceiptSequence();

  return `RCPT-${datePart}-${sequence}`;
}

function formatReceiptNumberDate(receiptDate) {
  const safeReceiptDate = receiptDate || getTodayDateString();
  return safeReceiptDate.replace(/-/g, "");
}

function generateReceiptSequence() {
  if (window.crypto && typeof window.crypto.getRandomValues === "function") {
    const randomValues = new Uint32Array(1);
    window.crypto.getRandomValues(randomValues);

    return String(randomValues[0] % 100000).padStart(5, "0");
  }

  return String(Math.floor(Math.random() * 100000)).padStart(5, "0");
}

async function ensureLogoDataLoaded() {
  if (state.logoDataUrl) {
    return;
  }

  if (!state.logoLoadPromise) {
    state.logoLoadPromise = loadLogoData();
  }

  try {
    await state.logoLoadPromise;
  } finally {
    state.logoLoadPromise = null;
  }
}

async function loadLogoData() {
  try {
    await loadLogoDataFromFetch();
  } catch (error) {
    await loadLogoDataFromImageElement();
  }
}

async function loadLogoDataFromFetch() {
  const response = await fetch(LOGO_PATH);

  if (!response.ok) {
    throw new Error("Unable to fetch the logo file.");
  }

  const logoBlob = await response.blob();
  const dataUrl = await readBlobAsDataUrl(logoBlob);
  const imageElement = await loadImageElement(dataUrl);

  state.logoDataUrl = dataUrl;
  state.logoAspectRatio = imageElement.naturalWidth / imageElement.naturalHeight;
}

async function loadLogoDataFromImageElement() {
  const imageElement = await loadImageElement(LOGO_PATH);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  canvas.width = imageElement.naturalWidth;
  canvas.height = imageElement.naturalHeight;

  if (!context) {
    throw new Error("Unable to create a canvas context for the logo.");
  }

  context.drawImage(imageElement, 0, 0);

  state.logoDataUrl = canvas.toDataURL("image/png");
  state.logoAspectRatio = imageElement.naturalWidth / imageElement.naturalHeight;
}

function readBlobAsDataUrl(blob) {
  return new Promise(function (resolve, reject) {
    const reader = new FileReader();

    reader.onload = function () {
      resolve(reader.result);
    };

    reader.onerror = function () {
      reject(new Error("Unable to read the logo file."));
    };

    reader.readAsDataURL(blob);
  });
}

function loadImageElement(source) {
  return new Promise(function (resolve, reject) {
    const image = new Image();

    image.onload = function () {
      resolve(image);
    };

    image.onerror = function () {
      reject(new Error("Unable to load the logo image."));
    };

    image.src = source;
  });
}

function getContainedLogoSize(aspectRatio, maxWidth, maxHeight) {
  const safeAspectRatio = aspectRatio > 0 ? aspectRatio : 1;
  let width = maxWidth;
  let height = width / safeAspectRatio;

  if (height > maxHeight) {
    height = maxHeight;
    width = height * safeAspectRatio;
  }

  return {
    width,
    height,
  };
}

function needsPdfPageBreak(doc, currentY, requiredHeight, bottomMargin) {
  const pageHeight = doc.internal.pageSize.getHeight();
  const safeBottomMargin = typeof bottomMargin === "number" ? bottomMargin : 20;

  return currentY + requiredHeight > pageHeight - safeBottomMargin;
}

function sanitizeFileName(value) {
  return String(value).replace(/[^a-z0-9_-]/gi, "-");
}

function focusInput(inputElement) {
  if (inputElement) {
    inputElement.focus();
  }
}
