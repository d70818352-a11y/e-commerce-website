/* ShopNest – all JavaScript */
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const money = n => '$' + n.toFixed(2);

/* ---------- 1. Demo product data ---------- */
// name, category, price, discount %, rating, stock, image keywords
const P = [
 ["Wireless Noise-Cancelling Headphones","Electronics",199,30,4.7,12,"headphones"],["4K Ultra HD Smart TV 55\"","Electronics",649,20,4.5,5,"television"],
 ["Smartphone Pro 256GB","Electronics",699,10,4.8,20,"smartphone"],["Portable Bluetooth Speaker","Electronics",89,25,4.4,0,"speaker"],
 ["Classic Denim Jacket","Fashion",79,15,4.3,40,"denim,jacket"],["Floral Summer Dress","Fashion",59,35,4.6,25,"dress,fashion"],
 ["Premium Cotton Hoodie","Fashion",49,20,4.5,60,"hoodie"],["Pro Running Sneakers","Shoes",120,25,4.7,30,"sneakers"],
 ["Leather Formal Loafers","Shoes",140,10,4.2,8,"leather,shoes"],["High-Top Canvas Shoes","Shoes",65,30,4.4,45,"canvas,shoes"],
 ["Chronograph Steel Watch","Watches",249,20,4.8,7,"wristwatch"],["Smartwatch Series X","Watches",299,15,4.6,18,"smartwatch"],
 ["Vitamin C Glow Serum","Beauty",34,20,4.5,100,"skincare,serum"],["Matte Lipstick Set","Beauty",29,40,4.3,70,"lipstick"],
 ["Air Fryer 5L Digital","Home & Kitchen",129,30,4.7,22,"airfryer,kitchen"],["Ceramic Cookware Set","Home & Kitchen",169,25,4.5,15,"cookware"],
 ["Genuine Leather Wallet","Accessories",45,10,4.4,50,"wallet"],["Aviator Sunglasses","Accessories",95,30,4.3,33,"sunglasses"],
 ["Non-Slip Yoga Mat Pro","Sports",39,20,4.6,80,"yoga,mat"],["Adjustable Dumbbell Set","Sports",229,15,4.7,9,"dumbbell"]
].map((a, i) => ({ id: i + 1, name: a[0], cat: a[1], price: a[2], off: a[3], rating: a[4], stock: a[5], kw: a[6],
  desc: `${a[0]} — crafted with premium materials and modern design for everyday performance. Includes a 1-year warranty and free 30-day returns.` }));
const EMOJI = { Electronics:'🎧', Fashion:'👕', Shoes:'👟', Watches:'⌚', Beauty:'💄', 'Home & Kitchen':'🍳', Sports:'🏋️', Accessories:'👜' };
const sale = p => p.price * (1 - p.off / 100);
const stars = r => '★'.repeat(Math.round(r)) + '☆'.repeat(5 - Math.round(r));

/* Remote image with a graceful offline fallback */
function fallback(img, cat, id) {
  img.onerror = null; const h = (id * 47) % 360;
  img.src = 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${h},70%,72%)"/><stop offset="1" stop-color="hsl(${(h + 50) % 360},70%,52%)"/></linearGradient></defs><rect width="600" height="600" fill="url(#g)"/><text x="300" y="370" font-size="220" text-anchor="middle">${EMOJI[cat] || '🛍️'}</text></svg>`);
}
const im = p => `<img src="https://loremflickr.com/600/600/${p.kw}?lock=${p.id}" alt="${p.name}" loading="lazy" onerror="fallback(this,'${p.cat}',${p.id})">`;

/* ---------- State + localStorage (cart, wishlist, user) ---------- */
const LS = { get: (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d } catch (e) { return d } }, set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch (e) {} } };
let cart = LS.get('sn_cart', []), wish = LS.get('sn_wish', []), user = LS.get('sn_user', null), pmQty = 1, pmId = 0;
const saveCart = () => { LS.set('sn_cart', cart); renderCart(); };
const saveWish = () => { LS.set('sn_wish', wish); renderWish(); renderProducts(); };

/* ---------- 21. Toast notifications ---------- */
function toast(msg, type = '') {
  const t = document.createElement('div'); t.className = 'toast ' + type; t.textContent = msg; $('#toasts').append(t);
  setTimeout(() => { t.style.opacity = 0; t.style.transition = '.4s'; setTimeout(() => t.remove(), 400) }, 2600);
}

/* ---------- Panels & modals ---------- */
function openEl(sel) { closeAll(); $(sel).classList.add('open'); $('#overlay').classList.add('on'); document.body.style.overflow = 'hidden'; }
function closeAll() { $$('.panel,.modal').forEach(e => e.classList.remove('open')); $('#overlay').classList.remove('on'); document.body.style.overflow = ''; }
$('#overlay').onclick = closeAll;
document.addEventListener('keydown', e => e.key === 'Escape' && closeAll());
$$('.modal').forEach(m => m.addEventListener('mousedown', e => e.target === m && closeAll()));

/* ---------- 2-7. Products, search, filters, sorting ---------- */
function renderProducts() {
  const q = $('#search').value.trim().toLowerCase(), cat = $('#fCat').value, pr = $('#fPrice').value, rt = +$('#fRating').value, s = $('#fSort').value;
  let l = P.filter(p => (p.name + ' ' + p.cat).toLowerCase().includes(q) && (!cat || p.cat == cat) && p.rating >= rt &&
    (!pr || (sale(p) >= +pr.split('-')[0] && sale(p) < +pr.split('-')[1])));
  l.sort((a, b) => s == 'pl' ? sale(a) - sale(b) : s == 'ph' ? sale(b) - sale(a) : s == 'rt' ? b.rating - a.rating : b.id - a.id);
  $('#count').textContent = l.length + ' product' + (l.length == 1 ? '' : 's') + ' found';
  $('#grid').innerHTML = l.length ? l.map((p, i) => `<article class="card" style="animation-delay:${i * 40}ms"><div class="ph"><span class="badge">-${p.off}%</span>
   <button class="hbtn ${wish.includes(p.id) ? 'on' : ''}" data-a="wish" data-id="${p.id}" aria-label="Wishlist">♥</button>${im(p)}</div>
   <div class="cb"><small>${p.cat}</small><h3>${p.name}</h3><div class="rt">${stars(p.rating)} <span>${p.rating}</span></div>
   <div class="pr"><b>${money(sale(p))}</b><del>${money(p.price)}</del></div>
   <div class="acts"><button class="btn" data-a="cart" data-id="${p.id}" ${p.stock ? '' : 'disabled'}>${p.stock ? 'Add to Cart' : 'Sold Out'}</button><button class="btn ghost" data-a="view" data-id="${p.id}">View Details</button></div></div></article>`).join('')
    : '<div class="empty" style="grid-column:1/-1">🔍<p>No products found</p></div>';
}
(function initFilters() {
  $('#fCat').innerHTML += Object.keys(EMOJI).map(c => `<option>${c}</option>`).join('');
  ['search', 'fCat', 'fPrice', 'fRating', 'fSort'].forEach(id => $('#' + id).addEventListener('input', renderProducts));
  $('#fReset').onclick = () => { $('#search').value = $('#navSearch').value = $('#fCat').value = $('#fPrice').value = ''; $('#fRating').value = 0; $('#fSort').value = 'new'; renderProducts(); };
  $('#navSearch').addEventListener('input', e => { $('#search').value = e.target.value; renderProducts(); });
  $('#navSearch').addEventListener('keydown', e => e.key == 'Enter' && $('#products').scrollIntoView());
})();
/* category cards / footer links filter the grid */
document.addEventListener('click', e => { const c = e.target.closest('[data-cat]'); if (!c) return;
  $('#fCat').value = c.dataset.cat; renderProducts(); $('#products').scrollIntoView({ behavior: 'smooth' }); });

/* ---------- 9-12. Cart ---------- */
function totals() { const sub = cart.reduce((s, c) => s + sale(P.find(p => p.id == c.id)) * c.q, 0), ship = sub && sub < 150 ? 9.99 : 0; return { sub, ship, total: sub + ship }; }
function addCart(id, q = 1) { const p = P.find(x => x.id == id); if (!p.stock) return toast('Out of stock', 'error');
  const c = cart.find(x => x.id == id); c ? c.q = Math.min(c.q + q, p.stock) : cart.push({ id, q }); saveCart(); toast(`${p.name} added to cart 🛒`); }
function renderCart() {
  $('#cartCount').textContent = cart.reduce((s, c) => s + c.q, 0);
  $('#cartItems').innerHTML = cart.length ? cart.map(c => { const p = P.find(x => x.id == c.id);
    return `<div class="ci">${im(p)}<div class="ci-i"><h4>${p.name}</h4><span>${money(sale(p))}</span><br><div class="qty"><button data-a="dec" data-id="${p.id}">−</button><b>${c.q}</b><button data-a="inc" data-id="${p.id}">+</button></div></div><button class="x" data-a="rm" data-id="${p.id}" title="Remove">🗑</button></div>`; }).join('')
    : '<div class="empty">🛒<p>Your cart is empty</p></div>';
  const t = totals(); $('#cSub').textContent = money(t.sub); $('#cShip').textContent = t.ship ? money(t.ship) : 'Free'; $('#cTot').textContent = money(t.total);
}
function setQty(id, d) { const c = cart.find(x => x.id == id), p = P.find(x => x.id == id); if (!c) return; c.q += d;
  if (c.q > p.stock) { c.q = p.stock; toast('Max stock reached', 'info'); } if (c.q <= 0) cart = cart.filter(x => x.id != id); saveCart(); }

/* ---------- 13. Wishlist ---------- */
function toggleWish(id) { const p = P.find(x => x.id == id);
  if (wish.includes(id)) { wish = wish.filter(x => x != id); toast('Removed from wishlist', 'info'); } else { wish.push(id); toast(`${p.name} added to wishlist ♥`); } saveWish(); }
function renderWish() {
  $('#wishCount').textContent = wish.length;
  $('#wishItems').innerHTML = wish.length ? wish.map(id => { const p = P.find(x => x.id == id);
    return `<div class="ci">${im(p)}<div class="ci-i"><h4>${p.name}</h4><span>${money(sale(p))}</span><br><button class="btn sm" data-a="move" data-id="${p.id}">Move to Cart</button></div><button class="x" data-a="wish" data-id="${p.id}" title="Remove">🗑</button></div>`; }).join('')
    : '<div class="empty">♡<p>Your wishlist is empty</p></div>';
}

/* ---------- 8. Product details modal ---------- */
function openProduct(id) { const p = P.find(x => x.id == id); pmId = id; pmQty = 1;
  $('#pmBody').innerHTML = `<div class="pm"><div class="pimg">${im(p)}</div><div><small>${p.cat}</small><h2>${p.name}</h2><div class="rt">${stars(p.rating)} <span>${p.rating} rating</span></div>
   <div style="margin-top:8px"><span class="big">${money(sale(p))}</span> <del>${money(p.price)}</del> <span class="badge" style="position:static;display:inline-block">-${p.off}%</span></div>
   <p>${p.desc}</p><span class="stock ${p.stock ? '' : 'out'}">${p.stock ? 'In Stock (' + p.stock + ' left)' : 'Out of Stock'}</span>
   <div class="line"><div class="qty"><button data-a="pmdec">−</button><b id="pmQ">1</b><button data-a="pminc">+</button></div>
   <button class="btn" data-a="pmadd" ${p.stock ? '' : 'disabled'}>Add to Cart</button><button class="btn ghost" data-a="wish" data-id="${p.id}">♥ Wishlist</button><button class="btn ghost close">Close</button></div></div></div>`;
  openEl('#productModal'); }

/* ---------- 16-17. Checkout & order confirmation ---------- */
function openCheckout() { if (!cart.length) return toast('Your cart is empty', 'error');
  $('#coItems').innerHTML = cart.map(c => { const p = P.find(x => x.id == c.id); return `<div class="row"><span>${p.name} × ${c.q}</span><b>${money(sale(p) * c.q)}</b></div>`; }).join('');
  const t = totals(); $('#coSub').textContent = money(t.sub); $('#coShip').textContent = t.ship ? money(t.ship) : 'Free'; $('#coTot').textContent = money(t.total);
  $('#coView').classList.remove('hide'); $('#coDone').classList.add('hide');
  if (user) { $('#coName').value ||= user.name; $('#coEmail').value ||= user.email; } openEl('#checkoutModal'); }

/* ---------- 18-20. Validation helpers ---------- */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, PHONE = /^\+?[0-9 ()-]{7,16}$/;
function validate(rules) { let ok = true; rules.forEach(([el, test, msg]) => { const bad = !test(el.value.trim()); el.classList.toggle('bad', bad);
  el.nextElementSibling.textContent = bad ? msg : ''; if (bad) ok = false; }); return ok; }
const req = v => v.length > 0;

$('#coForm').addEventListener('submit', e => { e.preventDefault();
  if (!validate([[$('#coName'), v => v.length > 2, 'Enter your full name'], [$('#coEmail'), v => EMAIL.test(v), 'Enter a valid email'], [$('#coPhone'), v => PHONE.test(v), 'Enter a valid phone number'],
    [$('#coAddr'), req, 'Address is required'], [$('#coCity'), req, 'City is required'], [$('#coZip'), v => /^[A-Za-z0-9 -]{3,10}$/.test(v), 'Enter a valid postal code']])) return toast('Please fix the highlighted fields', 'error');
  const id = 'SN' + Math.floor(100000 + Math.random() * 900000), pay = $('input[name=pay]:checked').value, t = totals();
  $('#orderId').textContent = '#' + id; $('#orderInfo').textContent = `Total ${money(t.total)} · Payment: ${pay} · Delivering to ${$('#coCity').value}`;
  LS.set('sn_orders', [{ id, total: t.total, pay, date: new Date().toISOString() }, ...LS.get('sn_orders', [])]);
  cart = []; saveCart(); $('#coForm').reset(); $('#coView').classList.add('hide'); $('#coDone').classList.remove('hide'); toast('Order placed successfully! 🎉'); });

/* ---------- Login / Register ---------- */
function updateUser() { $('#loginBtn').textContent = user ? 'Hi, ' + user.name.split(' ')[0] + ' ⏻' : 'Login'; }
$$('.tab').forEach(t => t.onclick = () => { $$('.tab').forEach(x => x.classList.toggle('on', x == t));
  $('#loginForm').classList.toggle('hide', t.dataset.tab != 'login'); $('#regForm').classList.toggle('hide', t.dataset.tab != 'register'); });
$('#loginBtn').onclick = () => { if (user) { user = null; LS.set('sn_user', null); updateUser(); return toast('Logged out', 'info'); } openEl('#authModal'); };
$('#loginForm').addEventListener('submit', e => { e.preventDefault();
  if (!validate([[$('#lEmail'), v => EMAIL.test(v), 'Enter a valid email'], [$('#lPass'), v => v.length >= 6, 'Password must be at least 6 characters']])) return;
  user = { name: $('#lEmail').value.split('@')[0], email: $('#lEmail').value }; LS.set('sn_user', user); updateUser(); closeAll(); e.target.reset(); toast('Welcome back, ' + user.name + '! 👋'); });
$('#regForm').addEventListener('submit', e => { e.preventDefault();
  if (!validate([[$('#rName'), v => v.length > 1, 'Enter your name'], [$('#rEmail'), v => EMAIL.test(v), 'Enter a valid email'], [$('#rPass'), v => v.length >= 6, 'Min 6 characters'],
    [$('#rConf'), v => v === $('#rPass').value && v.length > 0, 'Passwords do not match']])) return;
  user = { name: $('#rName').value.trim(), email: $('#rEmail').value.trim() }; LS.set('sn_user', user); updateUser(); closeAll(); e.target.reset(); toast('Account created! Welcome, ' + user.name + ' 🎉'); });

/* Contact form */
$('#contactForm').addEventListener('submit', e => { e.preventDefault();
  if (!validate([[$('#cName'), v => v.length > 1, 'Enter your name'], [$('#cEmail'), v => EMAIL.test(v), 'Enter a valid email'], [$('#cMsg'), v => v.length >= 10, 'Message must be at least 10 characters']])) return;
  e.target.reset(); toast('Message sent! We will reply soon ✉️'); });

/* ---------- Global click handling: every button ---------- */
document.addEventListener('click', e => {
  if (e.target.closest('.close')) return closeAll();
  const b = e.target.closest('[data-a]'); if (!b) return; const id = +b.dataset.id, a = b.dataset.a;
  if (a == 'cart') addCart(id);
  else if (a == 'view') openProduct(id);
  else if (a == 'wish') { toggleWish(id); if ($('#productModal').classList.contains('open')) b.textContent = '♥ Wishlist'; }
  else if (a == 'inc') setQty(id, 1); else if (a == 'dec') setQty(id, -1);
  else if (a == 'rm') { cart = cart.filter(x => x.id != id); saveCart(); toast('Item removed', 'info'); }
  else if (a == 'move') { addCart(id); wish = wish.filter(x => x != id); saveWish(); }
  else if (a == 'checkout') openCheckout();
  else if (a == 'pminc') { pmQty = Math.min(pmQty + 1, P.find(x => x.id == pmId).stock || 1); $('#pmQ').textContent = pmQty; }
  else if (a == 'pmdec') { pmQty = Math.max(1, pmQty - 1); $('#pmQ').textContent = pmQty; }
  else if (a == 'pmadd') { addCart(pmId, pmQty); closeAll(); }
});
$('#cartBtn').onclick = () => openEl('#cartPanel');
$('#wishBtn').onclick = () => openEl('#wishPanel');

/* ---------- 22. Mobile navigation ---------- */
$('#burger').onclick = () => $('#menu').classList.toggle('open');
$$('#menu a').forEach(a => a.onclick = () => $('#menu').classList.remove('open'));
window.addEventListener('scroll', () => $('#navbar').classList.toggle('scrolled', scrollY > 10));

/* ---------- Init ---------- */
renderProducts(); renderCart(); renderWish(); updateUser();
window.addEventListener('load', () => setTimeout(() => $('#loader').classList.add('gone'), 500));
