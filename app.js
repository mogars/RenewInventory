// Load inventory from localStorage
let inventory = JSON.parse(localStorage.getItem("inventory")) || [];

// DOM elements
const form = document.getElementById("itemForm");
const tableBody = document.querySelector("#inventoryTable tbody");
const lowStockList = document.getElementById("lowStockList");
const searchInput = document.getElementById("search");

// Save to localStorage
function saveInventory() {
    localStorage.setItem("inventory", JSON.stringify(inventory));
}

// Render inventory table
function renderInventory() {
    tableBody.innerHTML = "";
    lowStockList.innerHTML = "";

    let search = searchInput.value.toLowerCase();

    inventory.forEach(item => {
        if (!item.name.toLowerCase().includes(search)) return;

        let row = document.createElement("tr");

        let isLow = item.quantity <= item.lowStock;

        row.innerHTML = `
    <td data-label="Name" class="${isLow ? "low" : ""}">${item.name}</td>
    <td data-label="Category">${item.category}</td>
    <td data-label="Quantity">${item.quantity}</td>
    <td data-label="Batch">${item.batch}</td>
    <td data-label="Expiry">${item.expiry || ""}</td>
    <td data-label="Barcode">${item.barcode || ""}</td>
    <td data-label="Actions">
            <td>
                <button onclick="editItem('${item.id}')">Edit</button>
                <button onclick="deleteItem('${item.id}')">Delete</button>
            </td>
        `;

        tableBody.appendChild(row);

        if (isLow) {
            let alert = document.createElement("li");
            alert.textContent = `${item.name} is low (Qty: ${item.quantity})`;
            lowStockList.appendChild(alert);
        }
    });
}

// Add/Edit item
form.addEventListener("submit", e => {
    e.preventDefault();

    let id = document.getElementById("itemId").value;

    let item = {
        id: id || crypto.randomUUID(),
        name: document.getElementById("name").value,
        category: document.getElementById("category").value,
        quantity: parseInt(document.getElementById("quantity").value),
        lowStock: parseInt(document.getElementById("lowStock").value),
        batch: document.getElementById("batch").value,
        expiry: document.getElementById("expiry").value,
        barcode: document.getElementById("barcode").value
    };

    if (id) {
        // Edit existing
        inventory = inventory.map(i => i.id === id ? item : i);
    } else {
        // Add new
        inventory.push(item);
    }

    saveInventory();
    renderInventory();
    form.reset();
    document.getElementById("itemId").value = "";
});

// Edit
function editItem(id) {
    let item = inventory.find(i => i.id === id);

    document.getElementById("itemId").value = item.id;
    document.getElementById("name").value = item.name;
    document.getElementById("category").value = item.category;
    document.getElementById("quantity").value = item.quantity;
    document.getElementById("lowStock").value = item.lowStock;
    document.getElementById("batch").value = item.batch;
    document.getElementById("expiry").value = item.expiry;
    document.getElementById("barcode").value = item.barcode;
}

// Delete
function deleteItem(id) {
    inventory = inventory.filter(i => i.id !== id);
    saveInventory();
    renderInventory();
}

// Search
searchInput.addEventListener("input", renderInventory);

// Reports
document.getElementById("generateReport").onclick = () => {
    let report = "=== Inventory Report ===\n\n";

    inventory.forEach(item => {
        report += `${item.name} - Qty: ${item.quantity} - Category: ${item.category}\n`;
    });

    report += "\n=== Low Stock Items ===\n";
    inventory.filter(i => i.quantity <= i.lowStock)
             .forEach(i => report += `${i.name} (Qty: ${i.quantity})\n`);

    document.getElementById("reportOutput").textContent = report;
};

// Initial render
renderInventory();

const scanButton = document.getElementById("scanButton");
const stopScannerBtn = document.getElementById("stopScanner");
const scannerContainer = document.getElementById("scannerContainer");
const scannerPreview = document.getElementById("scannerPreview");

let scannerRunning = false;

scanButton.onclick = () => {
    if (scannerRunning) return;
    startScanner();
};

stopScannerBtn.onclick = stopScanner;

function startScanner() {
    scannerContainer.style.display = "block";

    Quagga.init({
        inputStream: {
            name: "Live",
            type: "LiveStream",
            target: scannerPreview,
            constraints: {
                facingMode: "environment"  // Use back camera
            }
        },
        decoder: {
            readers: [
                "ean_reader",
                "ean_8_reader",
                "code_128_reader",
                "code_39_reader",
                "upc_reader",
                "upc_e_reader"
            ]
        }
    }, function(err) {
        if (err) {
            console.error(err);
            alert("Camera error: " + err.message);
            return;
        }
        Quagga.start();
        scannerRunning = true;
    });

    Quagga.onDetected(data => {
        let code = data.codeResult.code;
        document.getElementById("barcode").value = code;

        stopScanner();
    });
}

function stopScanner() {
    if (scannerRunning) {
        Quagga.stop();
        scannerRunning = false;
    }
    scannerContainer.style.display = "none";
}

