const $ = selector => document.querySelector(selector);
const getElement = selector => { const element = $(selector); return element || null; };
const safeStoredArray = key => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    return [];
  }
};
const state = { menu: [], cart: safeStoredArray('foodiehub-cart'), token: localStorage.getItem('foodiehub-token') || '', orders: [] };
const duplicateOwnerViews = document.querySelectorAll('#owner-view');
if (duplicateOwnerViews.length > 1) duplicateOwnerViews[0].remove();
const money = value => `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const toast = message => {
  const toastEl = getElement('#toast');
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.classList.add('show');
  setTimeout(() => toastEl.classList.remove('show'), 2600);
};
const api = async (url, options = {}) => {
  const response = await fetch(`/api${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}),
      ...(options.headers || {})
    }
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || 'Request failed');
  }
  return response.status === 204 ? null : response.json();
};
const saveCart = () => {
  try {
    localStorage.setItem('foodiehub-cart', JSON.stringify(state.cart));
  } catch (error) {
    console.warn('Cart could not be saved:', error);
  }
  renderCart();
};

async function loadMenu() { try { state.menu = await api('/menu'); renderMenu(); } catch (error) { $('#menu-grid').innerHTML = `<div class="loading">${error.message}</div>`; } }
function filteredMenu() { const search = ($('#search').value || '').toLowerCase(); const category = $('#category').value; const diet = $('#diet').value; let items = state.menu.filter(item => (!search || `${item.name} ${item.category} ${item.description}`.toLowerCase().includes(search)) && (category === 'All' || item.category === category) && (diet === 'all' || (diet === 'veg' ? item.isVegetarian : !item.isVegetarian))); const sort = $('#sort').value; if (sort === 'low') items.sort((a,b) => a.price-b.price); if (sort === 'high') items.sort((a,b) => b.price-a.price); if (sort === 'rating') items.sort((a,b) => b.rating-a.rating); return items; }
function renderMenu() { const items = filteredMenu(); $('#menu-grid').innerHTML = items.length ? items.map(item => `<article class="food-card"><img src="${item.image}" alt="${item.name}" onerror="this.src='https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=80'"><div class="food-info"><div class="food-meta"><span class="${item.isVegetarian ? 'veg' : ''}">${item.isVegetarian ? '● VEG' : '● NON-VEG'}</span><span>★ ${item.rating}</span></div><h3>${item.name}</h3><p>${item.description}</p><div class="food-bottom"><span class="price">${money(item.price)}</span><button class="add" data-add="${item._id}" ${!item.available ? 'disabled' : ''}>${item.available ? '+ Add' : 'Unavailable'}</button></div></div></article>`).join('') : '<div class="loading">No matching dishes found.</div>'; document.querySelectorAll('[data-add]').forEach(button => button.addEventListener('click', () => addToCart(button.dataset.add))); }
function addToCart(id) { const item = state.menu.find(food => String(food._id) === id); const existing = state.cart.find(row => row.menuItemId === id); if (existing) existing.quantity++; else state.cart.push({ menuItemId: id, name: item.name, image: item.image, price: item.price, quantity: 1 }); saveCart(); toast(`${item.name} added to your order`); }
function renderCart() {
  const cartItems = Array.isArray(state.cart) ? state.cart : [];
  const count = cartItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const cartCount = getElement('#cart-count');
  const cartList = getElement('#cart-items');
  if (cartCount) cartCount.textContent = count;
  if (!cartList) return;
  cartList.innerHTML = cartItems.length ? cartItems.map(item => `<div class="cart-row"><img src="${item.image}" alt="${item.name}"><div><h4>${item.name}</h4><small>${money(item.price)} each</small><div class="qty"><button data-minus="${item.menuItemId}">−</button><b>${item.quantity}</b><button data-plus="${item.menuItemId}">+</button></div></div><strong>${money(item.price * item.quantity)}</strong></div>`).join('') : '<div class="loading">Your cart is empty.<br>Discover something delicious.</div>';
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const subtotalEl = getElement('#subtotal');
  const taxEl = getElement('#tax');
  const totalEl = getElement('#total');
  if (subtotalEl) subtotalEl.textContent = money(subtotal);
  if (taxEl) taxEl.textContent = money(subtotal * .05);
  if (totalEl) totalEl.textContent = money(subtotal * 1.05 + 20);
  document.querySelectorAll('[data-minus],[data-plus]').forEach(button => button.addEventListener('click', () => {
    const row = cartItems.find(item => item.menuItemId === (button.dataset.minus || button.dataset.plus));
    if (!row) return;
    if (button.dataset.minus) row.quantity--; else row.quantity++;
    state.cart = cartItems.filter(item => item.quantity > 0);
    saveCart();
  }));
}
function openFood(id) {
  const item = state.menu.find(food => String(food._id) === id);
  const modal = getElement('#modal');
  const modalBackdrop = getElement('#modal-backdrop');
  if (!item || !modal || !modalBackdrop) return;
  modal.innerHTML = `<div class="modal-food"><img src="${item.image}" alt="${item.name}"><div class="modal-food-info"><button class="close" onclick="$('#modal-backdrop').classList.remove('open')">×</button><p class="eyebrow">${item.category} · ${item.isVegetarian ? 'Vegetarian' : 'Non-vegetarian'}</p><h2>${item.name}</h2><p>${item.description}</p><p><strong>Ingredients</strong><br>${item.ingredients.join(' · ')}</p><div class="food-bottom"><span class="price">${money(item.price)}</span><button class="primary" data-modal-add="${item._id}">Add to order <span>→</span></button></div></div></div>`;
  modalBackdrop.classList.add('open');
  const modalAddButton = getElement('[data-modal-add]');
  if (modalAddButton) modalAddButton.onclick = () => { addToCart(id); modalBackdrop.classList.remove('open'); };
}
async function track(event) { event.preventDefault(); try { const order = await api(`/orders/public/${$('#track-id').value.trim()}`); const statuses = ['Pending','Confirmed','Preparing','Ready','Completed']; $('#track-result').innerHTML = `<strong>${order.orderId}</strong><br>${statuses.map(status => `<span style="color:${statuses.indexOf(status) <= statuses.indexOf(order.status) ? '#f4bd55' : '#ffffff55'}">● ${status}</span>`).join(' &nbsp; ')}`; } catch (error) { $('#track-result').textContent = error.message; } }
function showCheckout() {
  if (!state.cart || !state.cart.length) return toast('Add a dish before checking out');
  const checkoutModal = getElement('#checkout-modal');
  if (checkoutModal) checkoutModal.classList.add('open');
}
async function placeOrder(event) { event.preventDefault(); const type = $('#order-type').value; const payload = { customerName: $('#customer-name').value.trim(), mobile: $('#customer-mobile').value.trim(), email: $('#customer-email').value.trim(), tableNumber: $('#table-number').value.trim(), orderType: type, specialInstructions: $('#instructions').value.trim(), items: state.cart }; if (type === 'Dine In' && !payload.tableNumber) return toast('Table number is required for dine-in'); try { const order = await api('/orders', { method: 'POST', body: JSON.stringify(payload) }); state.cart = []; saveCart(); $('#checkout-modal').classList.remove('open'); $('#cart-drawer').classList.remove('open'); $('#track-id').value = order.orderId; $('#track-result').innerHTML = `<strong>Order placed successfully.</strong> Your ID is ${order.orderId}.`; location.hash = 'track'; toast('Order placed successfully'); } catch (error) { toast(error.message); } }

function ownerView(show, mode = 'login') { $('#customer-view').classList.toggle('hidden', show); $('#owner-view').classList.toggle('hidden', !show); if (show) setAuthMode(mode); else { $('#dashboard').classList.add('hidden'); $('#owner-login').classList.remove('hidden'); setAuthMode('login'); } window.scrollTo(0,0); }
async function login(event) { event.preventDefault(); try { const result = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email: $('#login-email').value.trim(), password: $('#login-password').value }) }); state.token = result.token; localStorage.setItem('foodiehub-token', state.token); $('#owner-login').classList.add('hidden'); $('#dashboard').classList.remove('hidden'); await loadDashboard(); } catch (error) { toast(error.message || 'Unable to load dashboard. Please try again.'); } }
async function register(event) { event.preventDefault(); try { const result = await api('/auth/register', { method: 'POST', body: JSON.stringify({ name: $('#register-name').value.trim(), email: $('#register-email').value.trim(), password: $('#register-password').value }) }); toast(`Welcome to FoodieHub, ${result.user.name}`); $('#login-email').value = result.user.email; $('#login-password').value = ''; setAuthMode('login'); } catch (error) { toast(error.message); } }
function setAuthMode(mode) { document.querySelectorAll('[data-auth-mode]').forEach(button => button.classList.toggle('active', button.dataset.authMode === mode)); $('#login-panel').classList.toggle('hidden', mode !== 'login'); $('#register-panel').classList.toggle('hidden', mode !== 'register'); }
document.addEventListener('DOMContentLoaded', () => { loadMenu(); renderCart(); $('#search').oninput = renderMenu; $('#category').onchange = renderMenu; $('#diet').onchange = renderMenu; $('#sort').onchange = renderMenu; $('#category-pills').onclick = event => { const category = event.target.dataset.category; if (!category) return; $('#category').value = category; document.querySelectorAll('#category-pills button').forEach(button => button.classList.toggle('active', button === event.target)); renderMenu(); }; $('#menu-grid').ondblclick = event => { const card = event.target.closest('.food-card'); if (card) openFood(card.querySelector('[data-add]').dataset.add); }; $('#open-cart').onclick = () => $('#cart-drawer').classList.add('open'); $('#close-cart').onclick = () => $('#cart-drawer').classList.remove('open'); $('#checkout').onclick = showCheckout; $('#close-checkout').onclick = () => $('#checkout-modal').classList.remove('open'); $('#checkout-form').onsubmit = placeOrder; $('#track-form').onsubmit = track; $('#back-home').onclick = () => ownerView(false); $('#login-form').onsubmit = login; $('#register-form').onsubmit = register; document.querySelectorAll('[data-auth-mode]').forEach(button => button.onclick = () => setAuthMode(button.dataset.authMode)); $('#logout').onclick = () => { localStorage.removeItem('foodiehub-token'); state.token = ''; ownerView(true, 'login'); }; $('#status-filter').onchange = renderOrders; $('#menu-toggle').onclick = () => $('.nav-links').classList.toggle('mobile-open'); $('#order-type').onchange = () => $('#table-field').style.display = $('#order-type').value === 'Dine In' ? 'grid' : 'none'; });
document.addEventListener('click', event => { if (event.target.id === 'login-link') ownerView(true, 'login'); if (event.target.id === 'register-link') ownerView(true, 'register'); if (event.target.id === 'dashboard-link') ownerView(true, 'login'); if (event.target.id === 'menu-nav') { ownerView(false); location.hash = 'menu'; } if (event.target.id === 'track-nav') { ownerView(false); location.hash = 'track'; } });
async function loadDashboard() { try { const [stats, orders, menu, customers] = await Promise.all([api('/analytics/summary'), api('/orders'), api('/menu'), api('/customers')]); state.orders = orders; state.menu = menu; $('#stats').innerHTML = [['Total orders',stats.totalOrders],['Today',stats.todayOrders],['Pending',stats.pendingOrders],['Completed',stats.completedOrders],['Revenue',money(stats.todayRevenue)],['Customers',stats.customers]].map(stat => `<div class="stat"><small>${stat[0]}</small><strong>${stat[1]}</strong></div>`).join(''); const top = $('.dash-top'); if (top && !$('#dashboard-home')) { const home = document.createElement('button'); home.id = 'dashboard-home'; home.className = 'outline'; home.textContent = '← Home'; home.onclick = () => ownerView(false); top.appendChild(home); } if (top && !$('#profile-card')) { const profile = document.createElement('div'); profile.id = 'profile-card'; profile.className = 'profile-card'; profile.innerHTML = '<strong>Admin Profile</strong><span>Restaurant Admin</span><small>admin@foodiehub.test</small>'; top.appendChild(profile); } renderOrders(); renderPopular(stats.popular); renderManage(); const users = document.createElement('section'); users.className = 'panel users-panel'; users.innerHTML = `<div class="panel-head"><div><p class="eyebrow">People</p><h3>Customers</h3></div><strong>${customers.length} registered</strong></div>${customers.length ? customers.map(customer => `<div class="user-row"><div class="user-avatar">${customer.name.charAt(0).toUpperCase()}</div><div><strong>${customer.name}</strong><small>${customer.email}</small></div><span>${customer.orders} orders</span><b>${money(customer.spent)}</b></div>`).join('') : '<div class="loading">No customer orders yet.</div>'}`; const existingUsers = $('#users-panel'); if (existingUsers) existingUsers.replaceWith(users); else $('#dashboard').appendChild(users); } catch (error) { state.token = ''; localStorage.removeItem('foodiehub-token'); toast(error.message); } }
function renderOrders() { const filter = $('#status-filter').value; const orders = state.orders.filter(order => filter === 'All status' || order.status === filter); $('#orders-list').innerHTML = orders.length ? orders.slice(0,8).map(order => `<div class="order-row"><div><strong>${order.orderId}</strong><small>${order.customerName}</small></div><div>${money(order.total)}<small>${order.orderType}${order.tableNumber ? ` · Table ${order.tableNumber}` : ''}</small></div><span class="status ${order.status}">${order.status}</span><select data-status="${order._id || order.orderId}">${['Pending','Confirmed','Preparing','Ready','Completed','Cancelled'].map(status => `<option ${status === order.status ? 'selected' : ''}>${status}</option>`).join('')}</select></div>`).join('') : '<div class="loading">No orders found.</div>'; document.querySelectorAll('[data-status]').forEach(select => select.onchange = async () => { const order = state.orders.find(item => (item._id || item.orderId) === select.dataset.status); try { await api(`/orders/${order._id}/status`, { method: 'PUT', body: JSON.stringify({ status: select.value }) }); order.status = select.value; toast('Order status updated'); renderOrders(); } catch (error) { toast(error.message); } }); }
function renderPopular(popular = []) { $('#popular-list').innerHTML = popular.length ? popular.map(item => `<div class="popular"><span>${item._id}</span><strong>${item.quantity} sold</strong></div>`).join('') : '<div class="loading">Sales insights appear after orders.</div>'; }
function renderManage() { $('#manage-list').innerHTML = state.menu.slice(0,8).map(item => `<div class="manage-row"><div><strong>${item.name}</strong><small>${item.category} · ${money(item.price)}</small></div><span class="status ${item.available ? 'Completed' : 'Cancelled'}">${item.available ? 'Available' : 'Unavailable'}</span><button class="outline" data-availability="${item._id}">${item.available ? 'Pause' : 'Enable'}</button><button class="outline" data-delete="${item._id}">Delete</button></div>`).join(''); document.querySelectorAll('[data-availability]').forEach(button => button.onclick = async () => { const item = state.menu.find(entry => entry._id === button.dataset.availability); await api(`/menu/${item._id}/availability`, { method: 'PATCH', body: JSON.stringify({ available: !item.available }) }); item.available = !item.available; renderManage(); renderMenu(); toast('Availability updated'); }); document.querySelectorAll('[data-delete]').forEach(button => button.onclick = async () => { if (!confirm('Delete this menu item?')) return; await api(`/menu/${button.dataset.delete}`, { method: 'DELETE' }); state.menu = state.menu.filter(item => item._id !== button.dataset.delete); renderManage(); renderMenu(); toast('Menu item deleted'); }); }

document.addEventListener('DOMContentLoaded', () => { const registerForm = $('#register-form'); if (registerForm && !$('#signin-link')) { const signin = document.createElement('button'); signin.id = 'signin-link'; signin.type = 'button'; signin.className = 'signin-link'; signin.textContent = 'Already have an account? Sign in'; signin.onclick = () => setAuthMode('login'); registerForm.appendChild(signin); } });
document.addEventListener('DOMContentLoaded', () => { const category = $('#category'); if (category && ![...category.options].some(option => option.value === 'Main Course')) { const option = document.createElement('option'); option.value = 'Main Course'; option.textContent = 'Main Course'; category.appendChild(option); } const pills = $('#category-pills'); if (pills && !pills.querySelector('[data-category="Main Course"]')) { const pill = document.createElement('button'); pill.dataset.category = 'Main Course'; pill.textContent = 'Main Course'; pills.appendChild(pill); } });

