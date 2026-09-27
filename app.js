let invoices = JSON.parse(localStorage.getItem('invoices')) || [];

document.addEventListener('DOMContentLoaded', () => {
  renderInvoices();
});

function saveToStorage() {
  localStorage.setItem('invoices', JSON.stringify(invoices));
}

function updateStatusIfOverdue(invoice) {
  const today = new Date().toISOString().split('T')[0];
  if (invoice.status === 'PENDING' && invoice.dueDate < today) {
    return 'OVERDUE';
  }
  return invoice.status;
}

function renderInvoices(data = invoices) {
  const tbody = document.getElementById('invoice-table-body');
  tbody.innerHTML = '';

  let totalSum = 0, paidSum = 0, pendingSum = 0, overdueSum = 0;

  data.forEach((inv) => {
    const currentStatus = updateStatusIfOverdue(inv);
    const amount = Number(inv.totalAmount);

    totalSum += amount;
    if (currentStatus === 'PAID') paidSum += amount;
    else if (currentStatus === 'PENDING') pendingSum += amount;
    else if (currentStatus === 'OVERDUE') overdueSum += amount;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${inv.id}</strong></td>
      <td>${inv.customerName}</td>
      <td>${inv.dueDate}</td>
      <td>$${amount.toFixed(2)}</td>
      <td><span class="badge badge-${currentStatus.toLowerCase()}">${currentStatus}</span></td>
      <td>
        ${currentStatus !== 'PAID' ? `<button class="btn btn-sm btn-primary" onclick="markAsPaid('${inv.id}')">Mark Paid</button>` : ''}
        <button class="btn btn-sm btn-secondary" onclick="viewPrintInvoice('${inv.id}')">View/Print</button>
        <button class="btn btn-sm btn-danger" onclick="deleteInvoice('${inv.id}')">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  document.getElementById('total-amount').innerText = `$${totalSum.toFixed(2)}`;
  document.getElementById('paid-amount').innerText = `$${paidSum.toFixed(2)}`;
  document.getElementById('pending-amount').innerText = `$${pendingSum.toFixed(2)}`;
  document.getElementById('overdue-amount').innerText = `$${overdueSum.toFixed(2)}`;
}

function filterInvoices() {
  const query = document.getElementById('search-input').value.toLowerCase();
  const statusFilter = document.getElementById('status-filter').value;

  const filtered = invoices.filter((inv) => {
    const currentStatus = updateStatusIfOverdue(inv);
    const matchesSearch = inv.customerName.toLowerCase().includes(query) || inv.id.toLowerCase().includes(query);
    const matchesStatus = statusFilter === 'ALL' || currentStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  renderInvoices(filtered);
}

function openModal() {
  document.getElementById('invoice-modal').style.display = 'flex';
}

function closeModal() {
  document.getElementById('invoice-modal').style.display = 'none';
  document.getElementById('invoice-form').reset();
  document.getElementById('line-items-container').innerHTML = `
    <div class="line-item-row">
      <input type="text" placeholder="Item description" class="item-desc" required>
      <input type="number" placeholder="Qty" class="item-qty" min="1" value="1" onchange="calculateFormTotal()" required>
      <input type="number" placeholder="Rate ($)" class="item-rate" min="0" step="0.01" value="0.00" onchange="calculateFormTotal()" required>
      <button type="button" class="btn-remove" onclick="removeLineItem(this)">✕</button>
    </div>`;
  calculateFormTotal();
}

function addLineItem() {
  const container = document.getElementById('line-items-container');
  const div = document.createElement('div');
  div.className = 'line-item-row';
  div.innerHTML = `
    <input type="text" placeholder="Item description" class="item-desc" required>
    <input type="number" placeholder="Qty" class="item-qty" min="1" value="1" onchange="calculateFormTotal()" required>
    <input type="number" placeholder="Rate ($)" class="item-rate" min="0" step="0.01" value="0.00" onchange="calculateFormTotal()" required>
    <button type="button" class="btn-remove" onclick="removeLineItem(this)">✕</button>
  `;
  container.appendChild(div);
}

function removeLineItem(btn) {
  const rows = document.querySelectorAll('.line-item-row');
  if (rows.length > 1) {
    btn.parentElement.remove();
    calculateFormTotal();
  }
}

function calculateFormTotal() {
  let total = 0;
  const rows = document.querySelectorAll('.line-item-row');
  rows.forEach((row) => {
    const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
    const rate = parseFloat(row.querySelector('.item-rate').value) || 0;
    total += qty * rate;
  });
  document.getElementById('form-total-display').innerText = `$${total.toFixed(2)}`;
  return total;
}

function saveInvoice(e) {
  e.preventDefault();
  const lineItems = [];
  const rows = document.querySelectorAll('.line-item-row');
  
  rows.forEach((row) => {
    lineItems.push({
      description: row.querySelector('.item-desc').value,
      quantity: parseFloat(row.querySelector('.item-qty').value),
      rate: parseFloat(row.querySelector('.item-rate').value),
      amount: parseFloat(row.querySelector('.item-qty').value) * parseFloat(row.querySelector('.item-rate').value)
    });
  });

  const newInvoice = {
    id: 'INV-' + Math.floor(1000 + Math.random() * 9000),
    customerName: document.getElementById('customer-name').value,
    customerEmail: document.getElementById('customer-email').value,
    dueDate: document.getElementById('due-date').value,
    status: document.getElementById('invoice-status').value,
    createdDate: new Date().toISOString().split('T')[0],
    items: lineItems,
    totalAmount: calculateFormTotal()
  };

  invoices.push(newInvoice);
  saveToStorage();
  renderInvoices();
  closeModal();
}

function markAsPaid(id) {
  const inv = invoices.find(i => i.id === id);
  if (inv) {
    inv.status = 'PAID';
    saveToStorage();
    renderInvoices();
  }
}

function deleteInvoice(id) {
  invoices = invoices.filter(i => i.id !== id);
  saveToStorage();
  renderInvoices();
}

function viewPrintInvoice(id) {
  const inv = invoices.find(i => i.id === id);
  if (!inv) return;

  document.getElementById('print-inv-id').innerText = inv.id;
  document.getElementById('print-date').innerText = inv.createdDate;
  document.getElementById('print-due-date').innerText = inv.dueDate;
  document.getElementById('print-status').innerText = updateStatusIfOverdue(inv);
  document.getElementById('print-customer-name').innerText = inv.customerName;
  document.getElementById('print-customer-email').innerText = inv.customerEmail || 'N/A';

  const tbody = document.getElementById('print-items-body');
  tbody.innerHTML = '';
  inv.items.forEach(item => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.description}</td>
      <td>${item.quantity}</td>
      <td>$${item.rate.toFixed(2)}</td>
      <td>$${item.amount.toFixed(2)}</td>
    `;
    tbody.appendChild(tr);
  });

  document.getElementById('print-total').innerText = `$${inv.totalAmount.toFixed(2)}`;
  document.getElementById('print-view').style.display = 'block';
}

function closePrintView() {
  document.getElementById('print-view').style.display = 'none';
}