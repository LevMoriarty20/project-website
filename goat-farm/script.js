const storageKeys = {
  theme: 'kk.theme',
  goats: 'kk.goats',
  bookings: 'kk.bookings',
  transactions: 'kk.transactions',
  feedStock: 'kk.feedStock',
  feedActivity: 'kk.feedActivity',
  auth: 'kk.auth'
};

const demoGoats = [
  { code: 'K-204', name: 'Kambing Super A', type: 'Super A', weight: 38, age: 10, gender: 'Jantan', price: 8900000, status: 'Booked' },
  { code: 'K-188', name: 'Kambing Betina B', type: 'Betina B', weight: 31, age: 9, gender: 'Betina', price: 7400000, status: 'Booked' },
  { code: 'K-171', name: 'Kambing Standar C', type: 'Standar C', weight: 29, age: 8, gender: 'Jantan', price: 6100000, status: 'Terjual' },
  { code: 'K-222', name: 'Kambing Premium D', type: 'Premium', weight: 41, age: 12, gender: 'Jantan', price: 9500000, status: 'Tersedia' },
  { code: 'K-223', name: 'Kambing Ekonomis E', type: 'Ekonomis', weight: 33, age: 9, gender: 'Jantan', price: 7900000, status: 'Tersedia' }
];

const demoBookings = [
  { id: 'BK-2026-018', name: 'Ahmad R.', phone: '0812-3456-7890', goat: 'Kambing Super A', date: '2026-10-12', method: 'DP', status: 'DP 30%', createdAt: '2026-10-02T08:30:00.000Z' },
  { id: 'BK-2026-017', name: 'Siti N.', phone: '0813-4567-8901', goat: 'Kambing Betina B', date: '2026-10-15', method: 'DP', status: 'Menunggu', createdAt: '2026-10-01T11:15:00.000Z' },
  { id: 'BK-2026-016', name: 'Rahman', phone: '0811-2222-3333', goat: 'Kambing Standar C', date: '2026-10-18', method: 'Lunas', status: 'Lunas', createdAt: '2026-09-30T13:45:00.000Z' }
];

const demoFeedStock = [
  { id: 'feed-grass', name: 'Rumput gajah', type: 'Hijauan', quantity: 420, unit: 'kg', safeLevel: 300 },
  { id: 'feed-concentrate', name: 'Konsentrat', type: 'Pakan campur', quantity: 180, unit: 'kg', safeLevel: 200 },
  { id: 'feed-vitamin', name: 'Vitamin', type: 'Suplemen', quantity: 42, unit: 'botol', safeLevel: 35 },
  { id: 'feed-dewormer', name: 'Obat cacing', type: 'Obat', quantity: 18, unit: 'paket', safeLevel: 20 }
];

const readStore = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
  } catch (error) {
    console.error(`Tidak dapat membaca data ${key} dari penyimpanan browser.`, error);
    return fallback;
  }
};

const writeStore = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Tidak dapat menyimpan data ${key} di penyimpanan browser.`, error);
    throw new Error('Penyimpanan browser tidak tersedia. Coba buka melalui browser biasa dan periksa pengaturan penyimpanan.');
  }
};

const getGoats = () => {
  const goats = readStore(storageKeys.goats, null);
  if (Array.isArray(goats)) {
    const isPreviousDemoSeed = goats.length === 4 && ['K-204', 'K-188', 'K-171', 'K-222'].every((code) => goats.some((goat) => goat.code === code));
    if (isPreviousDemoSeed) {
      const updatedGoats = [...goats, demoGoats[4]];
      writeStore(storageKeys.goats, updatedGoats);
      return updatedGoats;
    }
    return goats;
  }
  writeStore(storageKeys.goats, demoGoats);
  return demoGoats.slice();
};

const getBookings = () => {
  const bookings = readStore(storageKeys.bookings, null);
  if (Array.isArray(bookings)) return bookings;
  writeStore(storageKeys.bookings, demoBookings);
  return demoBookings.slice();
};

const getTransactions = () => {
  const transactions = readStore(storageKeys.transactions, []);
  return Array.isArray(transactions) ? transactions : [];
};

const getFeedStock = () => {
  const stock = readStore(storageKeys.feedStock, null);
  if (Array.isArray(stock)) return stock;
  writeStore(storageKeys.feedStock, demoFeedStock);
  return demoFeedStock.map((item) => ({ ...item }));
};

const getFeedActivity = () => {
  const activity = readStore(storageKeys.feedActivity, []);
  return Array.isArray(activity) ? activity : [];
};

const synchronizeInventoryStatus = () => {
  const goats = getGoats();
  const bookings = getBookings();
  const transactions = getTransactions();
  let changed = false;
  const setStatus = (name, status) => {
    const goat = goats.find((item) => item.name === name);
    if (goat && goat.status !== status) {
      goat.status = status;
      changed = true;
    }
  };

  bookings.forEach((booking) => {
    if (booking.status === 'Lunas') setStatus(booking.goat, 'Terjual');
    else if (booking.status === 'Menunggu' || String(booking.status).startsWith('DP')) setStatus(booking.goat, 'Booked');
  });
  transactions.forEach((transaction) => {
    (transaction.items || []).forEach((item) => setStatus(item.name, 'Terjual'));
  });
  if (changed) writeStore(storageKeys.goats, goats);
};

const formatCurrency = (value) => new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0
}).format(value);

const showToast = (message, type = 'success') => {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    document.body.append(toast);
  }
  toast.textContent = message;
  toast.dataset.type = type;
  toast.classList.add('show');
  clearTimeout(showToast.timeoutId);
  showToast.timeoutId = setTimeout(() => toast.classList.remove('show'), 3000);
};

const setTheme = (theme) => {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(storageKeys.theme, theme);
  } catch (error) {
    console.error('Preferensi tema tidak dapat disimpan.', error);
  }
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    const isDark = theme === 'dark';
    themeToggle.textContent = isDark ? '☀️ Tema terang' : '🌙 Tema gelap';
    themeToggle.setAttribute('aria-pressed', String(isDark));
    themeToggle.setAttribute('aria-label', isDark ? 'Aktifkan tema terang' : 'Aktifkan tema gelap');
  }
};

const initializeTheme = () => {
  let savedTheme = 'light';
  try {
    savedTheme = localStorage.getItem(storageKeys.theme) || 'light';
  } catch (error) {
    console.error('Preferensi tema tidak dapat dibaca.', error);
  }
  setTheme(savedTheme === 'dark' ? 'dark' : 'light');

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.id = 'themeToggle';
  toggle.className = 'theme-toggle';
  toggle.addEventListener('click', () => {
    setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
  });
  document.body.append(toggle);
  setTheme(savedTheme === 'dark' ? 'dark' : 'light');
};

initializeTheme();
synchronizeInventoryStatus();

const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.nav-menu');

if (navToggle && navMenu) {
  navToggle.setAttribute('aria-expanded', 'false');
  navToggle.addEventListener('click', () => {
    const isOpen = navMenu.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });
  navMenu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      navMenu.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

const revealElements = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.14 });
  revealElements.forEach((element) => observer.observe(element));
} else {
  revealElements.forEach((element) => element.classList.add('is-visible'));
}

const productModal = document.getElementById('productModal');
const modalTitle = document.getElementById('modalTitle');
const modalPrice = document.getElementById('modalPrice');
const modalDesc = document.getElementById('modalDesc');
const modalImage = document.getElementById('modalImage');
const modalOrderButton = document.querySelector('.modal-order');

const closeProductModal = () => {
  if (!productModal) return;
  productModal.classList.add('hidden');
  productModal.setAttribute('aria-hidden', 'true');
};

document.querySelectorAll('.btn-detail').forEach((button) => {
  button.addEventListener('click', () => {
    const params = new URLSearchParams({
      goat: button.dataset.goat || 'Kambing pilihan',
      price: button.dataset.price || 'Rp 0',
      desc: button.dataset.desc || ''
    });
    window.location.href = `detail.html?${params.toString()}`;
  });
});

const selectBookingGoat = (goat) => {
  const bookingSelect = document.querySelector('select[name="goat"]');
  if (!bookingSelect) return false;
  const option = Array.from(bookingSelect.options).find((item) => item.value === goat || item.textContent === goat);
  if (!option || option.disabled) return false;
  bookingSelect.value = option.value;
  bookingSelect.focus();
  document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  return true;
};

document.querySelectorAll('.btn-order').forEach((button) => {
  button.addEventListener('click', () => {
    const goat = button.dataset.goat || 'Kambing pilihan';
    if (selectBookingGoat(goat)) showToast(`${goat} dipilih untuk booking.`);
    else showToast(`${goat} tidak tersedia untuk booking saat ini.`, 'error');
  });
});

if (modalOrderButton) {
  modalOrderButton.addEventListener('click', () => {
    const goat = modalTitle?.textContent || 'Kambing pilihan';
    closeProductModal();
    if (selectBookingGoat(goat)) showToast(`${goat} berhasil dipilih.`);
    else showToast(`${goat} tidak tersedia untuk booking saat ini.`, 'error');
  });
}

if (productModal) {
  productModal.addEventListener('click', (event) => {
    const target = event.target;
    if (target instanceof HTMLElement && target.dataset.close === 'true') closeProductModal();
  });
  productModal.querySelector('.modal-close')?.addEventListener('click', closeProductModal);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !productModal.classList.contains('hidden')) closeProductModal();
  });
}

const bookingForm = document.getElementById('bookingForm');
if (bookingForm) {
  const goatSelect = bookingForm.querySelector('select[name="goat"]');
  const deliveryDate = bookingForm.querySelector('input[name="date"]');
  if (deliveryDate) {
    const today = new Date();
    deliveryDate.min = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  }
  if (goatSelect) {
    const placeholder = goatSelect.querySelector('option[value=""]');
    const availableGoats = getGoats().filter((goat) => goat.status === 'Tersedia');
    goatSelect.replaceChildren(placeholder || new Option('-- Pilih kambing --', ''));
    availableGoats.forEach((goat) => {
      const option = document.createElement('option');
      option.value = goat.name;
      option.textContent = `${goat.name} • ${formatCurrency(Number(goat.price))}`;
      goatSelect.append(option);
    });
    if (!availableGoats.length) {
      const option = document.createElement('option');
      option.disabled = true;
      option.value = '';
      option.textContent = 'Belum ada kambing tersedia';
      goatSelect.append(option);
    }
  }

  bookingForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(bookingForm);
    const booking = {
      id: `BK-${Date.now()}`,
      name: String(formData.get('name') || '').trim(),
      phone: String(formData.get('phone') || '').trim(),
      goat: String(formData.get('goat') || ''),
      date: String(formData.get('date') || ''),
      method: String(formData.get('method') || 'DP'),
      status: 'Menunggu',
      createdAt: new Date().toISOString()
    };
    try {
      const bookings = getBookings();
      const goats = getGoats();
      const selectedGoat = goats.find((goat) => goat.name === booking.goat);
      if (selectedGoat && selectedGoat.status !== 'Tersedia') {
        showToast(`${booking.goat} sudah tidak tersedia. Silakan pilih kambing lain.`, 'error');
        return;
      }
      bookings.unshift(booking);
      writeStore(storageKeys.bookings, bookings);
      if (selectedGoat && selectedGoat.status === 'Tersedia') {
        selectedGoat.status = 'Booked';
        writeStore(storageKeys.goats, goats);
      }
      renderPublicOverview();
      bookingForm.reset();
      showToast(`Terima kasih, ${booking.name}! Booking ${booking.goat} berhasil disimpan di perangkat ini.`);
    } catch (error) {
      showToast(error.message, 'error');
    }
  });
}

const statusClass = (status) => {
  if (status === 'Tersedia') return 'available';
  if (status === 'Terjual' || status === 'Lunas') return 'sold';
  if (status === 'Booked' || status.startsWith('DP')) return 'booked';
  return 'pending';
};

const compactCurrency = (amount) => {
  if (amount >= 1000000) return `Rp ${(amount / 1000000).toLocaleString('id-ID', { maximumFractionDigits: 1 })}Jt`;
  return formatCurrency(amount);
};

const getDailySales = (transactions) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const totals = Array(7).fill(0);
  transactions.forEach((transaction) => {
    const date = new Date(transaction.createdAt);
    if (Number.isNaN(date.getTime())) return;
    date.setHours(0, 0, 0, 0);
    const daysAgo = Math.round((today.getTime() - date.getTime()) / 86400000);
    if (daysAgo >= 0 && daysAgo < 7) totals[6 - daysAgo] += Number(transaction.subtotal || transaction.total || 0);
  });
  return { totals, today };
};

const renderSalesChart = (chart, labels, emptyState, transactions, caption) => {
  if (!chart) return;
  const { totals, today } = getDailySales(transactions);
  const maxTotal = Math.max(...totals);
  const hasSales = totals.some((total) => total > 0);
  chart.classList.toggle('is-empty', !hasSales);
  chart.querySelectorAll('span').forEach((bar, index) => {
    const height = maxTotal ? Math.max(12, (totals[index] / maxTotal) * 100) : 0;
    bar.style.height = `${height}%`;
    bar.setAttribute('aria-label', formatCurrency(totals[index]));
  });
  if (labels) {
    labels.replaceChildren();
    totals.forEach((_total, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - index));
      const label = document.createElement('span');
      label.textContent = new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short' }).format(date);
      labels.append(label);
    });
  }
  if (emptyState) emptyState.hidden = hasSales;
  if (caption) caption.textContent = hasSales ? '7 hari terakhir' : 'Belum ada penjualan';
};

const renderPublicOverview = () => {
  if (!document.querySelector('.product-card')) return;
  const goats = getGoats();
  let availableCount = 0;
  document.querySelectorAll('.product-card').forEach((card) => {
    const name = card.querySelector('h3')?.textContent.trim();
    const goat = goats.find((item) => item.name === name);
    const button = card.querySelector('.btn-order');
    if (!button || !name) return;
    const isAvailable = goat?.status === 'Tersedia';
    card.hidden = !isAvailable;
    if (isAvailable) availableCount += 1;
    let availability = card.querySelector('.stock-indicator');
    if (!availability) {
      availability = document.createElement('span');
      availability.className = 'stock-indicator';
      card.querySelector('.product-meta')?.append(availability);
    }
    const status = goat?.status || 'Tidak terdaftar';
    availability.textContent = status;
    availability.className = `stock-indicator ${isAvailable ? 'available' : 'unavailable'}`;
    button.disabled = !isAvailable;
    button.textContent = button.disabled ? status : 'Pesan';
    if (goat) {
      button.dataset.goat = goat.name;
      const price = card.querySelector('.product-footer > strong');
      if (price) price.textContent = formatCurrency(Number(goat.price));
      const detailButton = card.querySelector('.btn-detail');
      if (detailButton) {
        detailButton.dataset.goat = goat.name;
        detailButton.dataset.price = formatCurrency(Number(goat.price));
      }
    }
  });
  const emptyState = document.getElementById('catalogEmptyState');
  if (emptyState) emptyState.hidden = availableCount > 0;
};

const renderFinancialReport = () => {
  const activityList = document.getElementById('reportActivityList');
  if (!activityList) return;
  const transactions = getTransactions();
  const subtotal = transactions.reduce((sum, transaction) => sum + Number(transaction.subtotal || 0), 0);
  const tax = transactions.reduce((sum, transaction) => sum + Number(transaction.tax || 0), 0);
  const total = transactions.reduce((sum, transaction) => sum + Number(transaction.total || 0), 0);
  const cash = transactions
    .filter((transaction) => transaction.paymentMethod === 'Tunai')
    .reduce((sum, transaction) => sum + Number(transaction.total || 0), 0);
  const nonCash = transactions
    .filter((transaction) => transaction.paymentMethod !== 'Tunai')
    .reduce((sum, transaction) => sum + Number(transaction.total || 0), 0);
  const cashCount = transactions.filter((transaction) => transaction.paymentMethod === 'Tunai').length;
  const nonCashCount = transactions.length - cashCount;
  document.getElementById('reportRevenue').textContent = formatCurrency(subtotal);
  document.getElementById('reportTransactionCount').textContent = `${transactions.length} transaksi tersimpan`;
  document.getElementById('reportTax').textContent = formatCurrency(tax);
  document.getElementById('reportCashReceived').textContent = formatCurrency(total);
  document.getElementById('reportPaymentMethods').textContent = `${cashCount} transaksi tunai • ${nonCashCount} non-tunai`;
  document.getElementById('statementSubtotal').textContent = formatCurrency(subtotal);
  document.getElementById('statementTax').textContent = formatCurrency(tax);
  document.getElementById('statementTotal').textContent = formatCurrency(total);
  document.getElementById('cashCash').textContent = formatCurrency(cash);
  document.getElementById('cashNonCash').textContent = formatCurrency(nonCash);
  document.getElementById('cashTotal').textContent = formatCurrency(total);

  activityList.replaceChildren();
  if (!transactions.length) {
    const item = document.createElement('li');
    const label = document.createElement('span');
    const message = document.createElement('strong');
    label.textContent = 'Belum ada transaksi';
    message.textContent = 'Transaksi kasir akan tampil di sini.';
    item.append(label, message);
    activityList.append(item);
  } else {
    transactions.slice(0, 4).forEach((transaction) => {
      const item = document.createElement('li');
      const date = document.createElement('span');
      date.textContent = new Date(transaction.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
      const message = document.createElement('strong');
      const names = (transaction.items || []).map((entry) => entry.name).join(', ');
      message.textContent = `${names} • ${formatCurrency(Number(transaction.total || 0))}`;
      item.append(date, message);
      activityList.append(item);
    });
  }
  renderSalesChart(
    document.querySelector('.report-main .admin-bars'),
    document.getElementById('reportChartLabels'),
    document.getElementById('reportChartEmpty'),
    transactions
  );
};

const renderAdminDashboard = () => {
  const tableBody = document.getElementById('goatTableBody');
  if (!tableBody) return;

  const goats = getGoats();
  const bookings = getBookings();
  const transactions = getTransactions();
  const search = document.getElementById('goatSearch');
  const drawGoats = () => {
    const query = (search?.value || '').trim().toLowerCase();
    const filtered = goats.filter((goat) => `${goat.code} ${goat.name} ${goat.type}`.toLowerCase().includes(query));
    tableBody.replaceChildren();
    filtered.forEach((goat) => {
      const row = document.createElement('tr');
      [goat.code, goat.type, `${goat.weight} kg`].forEach((value) => {
        const cell = document.createElement('td');
        cell.textContent = value;
        row.append(cell);
      });
      const statusCell = document.createElement('td');
      const badge = document.createElement('span');
      badge.className = `status-badge ${statusClass(goat.status)}`;
      badge.textContent = goat.status;
      statusCell.append(badge);
      row.append(statusCell);
      const priceCell = document.createElement('td');
      priceCell.textContent = compactCurrency(Number(goat.price) || 0);
      row.append(priceCell);
      const actionCell = document.createElement('td');
      const editLink = document.createElement('a');
      editLink.className = 'btn btn-secondary small';
      editLink.href = `tambah-kambing.html?kode=${encodeURIComponent(goat.code)}`;
      editLink.textContent = 'Edit';
      const deleteButton = document.createElement('button');
      deleteButton.className = 'btn btn-secondary small';
      deleteButton.type = 'button';
      deleteButton.dataset.deleteGoat = goat.code;
      deleteButton.textContent = 'Hapus';
      deleteButton.setAttribute('aria-label', `Hapus ${goat.name}`);
      actionCell.append(editLink, deleteButton);
      row.append(actionCell);
      tableBody.append(row);
    });
    const emptyState = document.getElementById('goatEmptyState');
    if (emptyState) emptyState.hidden = filtered.length > 0;
  };
  drawGoats();
  search?.addEventListener('input', drawGoats);

  const bookingList = document.getElementById('dashboardBookingList');
  if (bookingList) {
    bookingList.replaceChildren();
    bookings.slice(0, 4).forEach((booking) => {
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.className = 'booking-record';
      link.href = `booking-detail.html?id=${encodeURIComponent(booking.id)}`;
      const details = document.createElement('div');
      const name = document.createElement('strong');
      const goat = document.createElement('small');
      name.textContent = booking.name;
      goat.textContent = booking.goat;
      details.append(name, goat);
      const badge = document.createElement('span');
      badge.className = `status-badge ${statusClass(booking.status)}`;
      badge.textContent = booking.status;
      link.append(details);
      item.append(link, badge);
      bookingList.append(item);
    });
    const emptyState = document.getElementById('bookingEmptyState');
    if (emptyState) emptyState.hidden = bookings.length > 0;
  }

  const bookedCount = goats.filter((goat) => goat.status === 'Booked').length;
  const pendingCount = bookings.filter((booking) => booking.status === 'Menunggu').length;
  const revenue = transactions.reduce((sum, transaction) => sum + Number(transaction.subtotal || 0), 0);
  document.getElementById('dashboardGoatCount').textContent = String(goats.length);
  document.getElementById('dashboardBookedCount').textContent = String(bookedCount);
  document.getElementById('dashboardPendingText').textContent = `${pendingCount} menunggu konfirmasi`;
  document.getElementById('dashboardRevenue').textContent = compactCurrency(revenue);
  document.getElementById('dashboardRevenueCaption').textContent = transactions.length
    ? `${transactions.length} transaksi tersimpan`
    : 'Belum ada transaksi tersimpan';
  document.getElementById('sidebarBookingCount').textContent = `${bookings.length} booking`;
  document.getElementById('sidebarPendingCount').textContent = `${pendingCount} menunggu konfirmasi`;

  renderSalesChart(
    document.querySelector('.admin-bars'),
    document.getElementById('salesChartLabels'),
    document.getElementById('salesChartEmpty'),
    transactions,
    document.getElementById('salesChartCaption')
  );
};

const renderFeedStock = () => {
  const tableBody = document.getElementById('feedStockTable');
  if (!tableBody) return;
  const stock = getFeedStock();
  const showLowOnly = document.getElementById('stockFilter')?.getAttribute('aria-pressed') === 'true';
  const lowStockItems = stock.filter((item) => Number(item.quantity) <= Number(item.safeLevel));
  const visibleItems = showLowOnly ? lowStockItems : stock;
  tableBody.replaceChildren();
  visibleItems.forEach((item) => {
    const row = document.createElement('tr');
    const values = [item.name, item.type, `${item.quantity} ${item.unit}`, `${item.safeLevel} ${item.unit}`];
    values.forEach((value) => {
      const cell = document.createElement('td');
      cell.textContent = value;
      row.append(cell);
    });
    const statusCell = document.createElement('td');
    const badge = document.createElement('span');
    const needsRestock = Number(item.quantity) <= Number(item.safeLevel);
    badge.className = `status-badge ${needsRestock ? 'pending' : 'available'}`;
    badge.textContent = needsRestock ? 'Perlu restock' : 'Aman';
    statusCell.append(badge);
    row.append(statusCell);
    tableBody.append(row);
  });
  document.getElementById('stockItemCount').textContent = `${stock.length} jenis`;
  document.getElementById('stockLowCount').textContent = `${lowStockItems.length} item`;
  document.getElementById('stockEmptyState').hidden = visibleItems.length > 0;
  const noticeTitle = document.getElementById('stockNoticeTitle');
  const noticeMessage = document.getElementById('stockNoticeMessage');
  if (noticeTitle && noticeMessage) {
    if (lowStockItems.length) {
      noticeTitle.textContent = `⚠️ ${lowStockItems[0].name} perlu restock`;
      noticeMessage.textContent = `${lowStockItems.length} bahan berada pada atau di bawah level aman. Tambahkan stok agar statusnya diperbarui.`;
    } else {
      noticeTitle.textContent = '✅ Stok bahan dalam level aman';
      noticeMessage.textContent = 'Tidak ada bahan yang berada pada atau di bawah level restock.';
    }
  }

  const activityList = document.getElementById('stockActivityList');
  const activity = getFeedActivity();
  activityList.replaceChildren();
  if (!activity.length) {
    const item = document.createElement('li');
    const label = document.createElement('span');
    const message = document.createElement('strong');
    label.textContent = 'Belum ada input';
    message.textContent = 'Penambahan stok akan dicatat di sini.';
    item.append(label, message);
    activityList.append(item);
  } else {
    activity.slice(0, 5).forEach((record) => {
      const item = document.createElement('li');
      const label = document.createElement('span');
      const message = document.createElement('strong');
      label.textContent = new Date(record.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      message.textContent = `${record.name} ditambah ${record.quantity} ${record.unit}`;
      item.append(label, message);
      activityList.append(item);
    });
  }

  const itemSelect = document.getElementById('stockItem');
  if (itemSelect) {
    const selected = itemSelect.value;
    itemSelect.replaceChildren();
    stock.forEach((entry) => {
      const option = document.createElement('option');
      option.value = entry.id;
      option.textContent = entry.name;
      itemSelect.append(option);
    });
    if (stock.some((entry) => entry.id === selected)) itemSelect.value = selected;
  }
};

renderFeedStock();

document.getElementById('stockFilter')?.addEventListener('click', (event) => {
  const button = event.currentTarget;
  const showLowOnly = button.getAttribute('aria-pressed') !== 'true';
  button.setAttribute('aria-pressed', String(showLowOnly));
  button.textContent = showLowOnly ? 'Tampilkan semua' : 'Stok menipis';
  renderFeedStock();
});

const stockDialog = document.getElementById('stockDialog');
document.getElementById('openStockModal')?.addEventListener('click', () => {
  renderFeedStock();
  stockDialog.showModal();
});
document.getElementById('closeStockModal')?.addEventListener('click', () => stockDialog.close());
document.getElementById('cancelStockModal')?.addEventListener('click', () => stockDialog.close());
stockDialog?.addEventListener('click', (event) => {
  if (event.target === stockDialog) stockDialog.close();
});

const stockForm = document.getElementById('stockForm');
stockForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = new FormData(stockForm);
  const quantity = Number(formData.get('quantity'));
  const stock = getFeedStock();
  const item = stock.find((entry) => entry.id === formData.get('item'));
  if (!item || !Number.isFinite(quantity) || quantity <= 0) {
    showToast('Pilih bahan dan masukkan jumlah stok yang valid.', 'error');
    return;
  }
  item.quantity = Number((Number(item.quantity) + quantity).toFixed(2));
  const activity = getFeedActivity();
  activity.unshift({
    name: item.name,
    quantity,
    unit: item.unit,
    createdAt: new Date().toISOString()
  });
  try {
    writeStore(storageKeys.feedStock, stock);
    writeStore(storageKeys.feedActivity, activity);
    renderFeedStock();
    stockForm.reset();
    stockDialog.close();
    showToast(`${item.name} berhasil ditambahkan.`);
  } catch (error) {
    showToast(error.message, 'error');
  }
});

renderAdminDashboard();
renderPublicOverview();
renderFinancialReport();

window.addEventListener('storage', (event) => {
  if ([storageKeys.goats, storageKeys.bookings, storageKeys.transactions, storageKeys.feedStock, storageKeys.feedActivity].includes(event.key)) {
    renderAdminDashboard();
    renderPublicOverview();
    renderFinancialReport();
    renderFeedStock();
  }
});

const goatForm = document.getElementById('goatForm');
if (goatForm) {
  const params = new URLSearchParams(window.location.search);
  const editingCode = params.get('kode');
  const goats = getGoats();
  const existingGoat = editingCode ? goats.find((item) => item.code === editingCode) : null;
  const submitButton = document.getElementById('goatSubmitButton');
  const nameInput = goatForm.elements.namedItem('nama');
  const statusInput = goatForm.elements.namedItem('status');
  const editNote = document.getElementById('goatEditNote');

  if (editingCode && !existingGoat) {
    showToast('Data kambing yang akan diedit tidak ditemukan.', 'error');
    if (submitButton) submitButton.disabled = true;
  } else if (existingGoat) {
    const hasBooking = getBookings().some((booking) => booking.goat === existingGoat.name);
    const hasSale = getTransactions().some((transaction) =>
      (transaction.items || []).some((item) => item.name === existingGoat.name)
    );
    const hasHistory = hasBooking || hasSale;

    goatForm.elements.namedItem('kode').value = existingGoat.code;
    nameInput.value = existingGoat.name;
    goatForm.elements.namedItem('jenis').value = existingGoat.type;
    goatForm.elements.namedItem('berat').value = existingGoat.weight;
    goatForm.elements.namedItem('usia').value = existingGoat.age;
    goatForm.elements.namedItem('kelamin').value = existingGoat.gender;
    goatForm.elements.namedItem('harga').value = existingGoat.price;
    statusInput.value = existingGoat.status;
    goatForm.elements.namedItem('catatan').value = existingGoat.notes || '';
    document.getElementById('goatFormTitle').textContent = 'Edit data kambing';
    submitButton.textContent = 'Simpan perubahan';
    nameInput.readOnly = true;
    editNote.hidden = false;
    editNote.textContent = 'Nama kambing tidak dapat diubah agar tetap sesuai dengan katalog.';

    if (hasHistory) {
      statusInput.disabled = true;
      statusInput.title = 'Status ditentukan oleh riwayat booking atau transaksi.';
      editNote.textContent += ' Status juga dikunci karena kambing ini memiliki riwayat booking atau transaksi.';
    }
  }

  goatForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(goatForm);
    const goat = {
      code: String(formData.get('kode') || '').trim().toUpperCase(),
      name: String(nameInput.value || '').trim(),
      type: String(formData.get('jenis') || ''),
      weight: Number(formData.get('berat')),
      age: Number(formData.get('usia')),
      gender: String(formData.get('kelamin') || ''),
      price: Number(formData.get('harga')),
      status: existingGoat && statusInput.disabled
        ? existingGoat.status
        : String(formData.get('status') || 'Tersedia'),
      notes: String(formData.get('catatan') || '').trim(),
      createdAt: existingGoat?.createdAt || new Date().toISOString()
    };
    try {
      const currentGoats = getGoats();
      if (currentGoats.some((item) =>
        item.code !== editingCode &&
        (item.code.toLowerCase() === goat.code.toLowerCase() || item.name.toLowerCase() === goat.name.toLowerCase())
      )) {
        showToast('Kode atau nama kambing sudah digunakan. Gunakan identitas yang unik.', 'error');
        return;
      }
      if (editingCode) {
        const index = currentGoats.findIndex((item) => item.code === editingCode);
        if (index < 0) {
          showToast('Data kambing tidak lagi tersedia. Muat ulang halaman lalu coba lagi.', 'error');
          return;
        }
        currentGoats[index] = goat;
      } else {
        currentGoats.unshift(goat);
      }
      writeStore(storageKeys.goats, currentGoats);
      showToast(editingCode ? `${goat.name} berhasil diperbarui.` : `${goat.name} berhasil disimpan.`);
      goatForm.reset();
      setTimeout(() => { window.location.href = 'admin.html'; }, 700);
    } catch (error) {
      showToast(error.message, 'error');
    }
  });
}

document.getElementById('goatTableBody')?.addEventListener('click', (event) => {
  const button = event.target.closest('[data-delete-goat]');
  if (!button) return;

  const code = button.dataset.deleteGoat;
  const goat = getGoats().find((item) => item.code === code);
  if (!goat) {
    showToast('Data kambing tidak ditemukan.', 'error');
    return;
  }
  if (!window.confirm(`Hapus ${goat.name} (${goat.code})?`)) return;

  const hasBooking = getBookings().some((booking) => booking.goat === goat.name);
  const hasSale = getTransactions().some((transaction) =>
    (transaction.items || []).some((item) => item.name === goat.name)
  );
  if (hasBooking || hasSale) {
    showToast('Kambing tidak dapat dihapus karena memiliki riwayat booking atau transaksi.', 'error');
    return;
  }

  try {
    writeStore(storageKeys.goats, getGoats().filter((item) => item.code !== code));
    renderAdminDashboard();
    renderPublicOverview();
    showToast(`${goat.name} berhasil dihapus.`);
  } catch (error) {
    showToast(error.message, 'error');
  }
});

document.querySelector('[data-export-goats]')?.addEventListener('click', () => {
  const goats = getGoats();
  const rows = [['Kode', 'Nama', 'Jenis', 'Berat (kg)', 'Usia (bulan)', 'Kelamin', 'Harga', 'Status'], ...goats.map((goat) => [
    goat.code, goat.name, goat.type, goat.weight, goat.age, goat.gender, goat.price, goat.status
  ])];
  const csv = rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\r\n');
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }));
  link.download = 'inventaris-kambing.csv';
  link.click();
  URL.revokeObjectURL(link.href);
  showToast('Data inventaris berhasil diekspor.');
});

document.getElementById('printReport')?.addEventListener('click', () => window.print());

document.querySelector('[data-logout]')?.addEventListener('click', () => {
  localStorage.removeItem('kk.auth');
  localStorage.removeItem('kambingKamilLogin');
  sessionStorage.removeItem('kk.auth');
  sessionStorage.removeItem('kambingKamilLogin');
  window.location.href = 'login.html';
});

const bookingDetail = document.getElementById('bookingDetail');
if (bookingDetail) {
  const bookingId = new URLSearchParams(window.location.search).get('id') || 'BK-2026-018';
  const booking = getBookings().find((item) => item.id === bookingId) || getBookings()[0];
  if (booking) {
    const values = {
      bookingId: booking.id,
      bookingName: booking.name,
      bookingPhone: booking.phone || 'Belum dicantumkan',
      bookingGoat: booking.goat,
      bookingDate: booking.createdAt ? new Date(booking.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '—',
      deliveryDate: booking.date ? new Date(`${booking.date}T00:00:00`).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'
    };
    Object.entries(values).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element) element.textContent = value;
    });
    const status = document.getElementById('bookingStatus');
    if (status) {
      status.textContent = booking.status;
      status.className = `status-badge ${statusClass(booking.status)}`;
    }
    const goatRecord = getGoats().find((item) => item.name === booking.goat);
    const price = Number(goatRecord?.price || 0);
    const dp = booking.status.startsWith('DP') ? Math.round(price * 0.3) : booking.status === 'Lunas' ? price : 0;
    const totalEl = document.getElementById('bookingTotal');
    const dpEl = document.getElementById('bookingDP');
    const balanceEl = document.getElementById('bookingBalance');
    const paidDP = document.getElementById('bookingPaidDP');
    if (totalEl && price) totalEl.textContent = formatCurrency(price);
    if (dpEl && price) dpEl.textContent = formatCurrency(dp);
    if (balanceEl && price) balanceEl.textContent = formatCurrency(Math.max(0, price - dp));
    if (paidDP && price) paidDP.textContent = formatCurrency(dp);
    const timelineDP = document.getElementById('timelineDP');
    const timelineBalance = document.getElementById('timelineBalance');
    if (booking.status.startsWith('DP') || booking.status === 'Lunas') timelineDP?.classList.add('done');
    else timelineDP?.classList.remove('done');
    if (booking.status === 'Lunas') {
      timelineBalance?.classList.add('done');
      timelineBalance?.classList.remove('active');
      if (timelineBalance) timelineBalance.textContent = 'Lunas';
    } else {
      timelineBalance?.classList.remove('done');
      timelineBalance?.classList.add('active');
      if (timelineBalance) timelineBalance.textContent = 'Menunggu pelunasan';
    }
    const confirmButton = document.getElementById('confirmBooking');
    if (confirmButton) {
      confirmButton.disabled = booking.status !== 'Menunggu';
      if (confirmButton.disabled) confirmButton.textContent = 'DP telah dikonfirmasi';
    }
    confirmButton?.addEventListener('click', () => {
      if (booking.status !== 'Menunggu') {
        showToast('Status booking ini sudah diperbarui.');
        return;
      }
      const bookings = getBookings();
      const target = bookings.find((item) => item.id === booking.id);
      if (!target) {
        showToast('Data booking tidak ditemukan.', 'error');
        return;
      }
      target.status = 'DP 30%';
      try {
        writeStore(storageKeys.bookings, bookings);
        if (status) {
          status.textContent = target.status;
          status.className = `status-badge ${statusClass(target.status)}`;
        }
        if (confirmButton) {
          confirmButton.disabled = true;
          confirmButton.textContent = 'DP telah dikonfirmasi';
        }
        showToast('Pembayaran DP berhasil dikonfirmasi.');
      } catch (error) {
        showToast(error.message, 'error');
      }
    });
  }
}

const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(loginForm);
    const email = String(formData.get('email') || '').trim().toLowerCase();
    const password = String(formData.get('password') || '');
    const button = loginForm.querySelector('button[type="submit"]');
    const feedback = document.getElementById('loginFeedback');
    if (email !== 'admin@kambingkamil.id' || password !== 'admin123') {
      if (feedback) {
        feedback.textContent = 'Email atau password tidak sesuai. Periksa kembali lalu coba lagi.';
        feedback.hidden = false;
      }
      if (button) {
        button.textContent = 'Login gagal';
        setTimeout(() => { button.textContent = 'Masuk'; }, 1800);
      }
      return;
    }
    const auth = { email, name: 'Admin', signedInAt: new Date().toISOString() };
    const remember = Boolean(formData.get('remember'));
    try {
      if (remember) {
        localStorage.setItem('kambingKamilLogin', 'true');
        writeStore(storageKeys.auth, auth);
        sessionStorage.removeItem(storageKeys.auth);
        sessionStorage.removeItem('kambingKamilLogin');
      } else {
        localStorage.removeItem(storageKeys.auth);
        localStorage.removeItem('kambingKamilLogin');
        sessionStorage.setItem(storageKeys.auth, JSON.stringify(auth));
        sessionStorage.setItem('kambingKamilLogin', 'true');
      }
      window.location.href = 'admin.html';
    } catch (error) {
      if (feedback) {
        feedback.textContent = 'Sesi tidak dapat disimpan di browser ini. Aktifkan penyimpanan lalu coba lagi.';
        feedback.hidden = false;
      }
      console.error('Sesi login gagal disimpan.', error);
    }
  });
}

window.KambingApp = {
  readGoats: getGoats,
  readBookings: getBookings,
  readTransactions: getTransactions,
  completeSale(transaction) {
    const goats = getGoats();
    const soldNames = new Set(transaction.items.map((item) => item.name));
    const unavailable = goats.find((goat) => soldNames.has(goat.name) && goat.status !== 'Tersedia');
    if (unavailable) throw new Error(`${unavailable.name} tidak lagi tersedia.`);
    goats.forEach((goat) => {
      if (soldNames.has(goat.name)) goat.status = 'Terjual';
    });
    writeStore(storageKeys.goats, goats);
    const transactions = getTransactions();
    transactions.unshift(transaction);
    writeStore(storageKeys.transactions, transactions);
  },
  showToast
};
