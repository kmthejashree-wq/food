require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'frontend')));

const image = (query) => query.startsWith('http') ? query : `https://images.unsplash.com/${query}?auto=format&fit=crop&w=900&q=85`;
const starterMenu = [
  ['Paneer Tikka','Starters','Charred cottage cheese, peppers and mint chutney',249,true,'photo-1567188040759-fb8a883dc6d8'],
  ['Chicken Wings','Starters','Smoky glazed wings with toasted sesame',299,false,'photo-1527477396000-e27163b481c2'],
  ['Crispy Corn','Starters','Golden sweet corn, chilli and coriander',179,true,'photo-1585032226651-759b368d7246'],
  ['Samosa','Starters','Crisp pastry filled with spiced potato and peas',99,true,'photo-1601050690597-df0568f70950'],
  ['Margherita Pizza','Pizza','San Marzano tomato, mozzarella and basil',349,true,'photo-1574071318508-1cdbab80d002'],
  ['Farmhouse Pizza','Pizza','Roasted vegetables, olives and mozzarella',429,true,'photo-1565299624946-b28f40a0ae38'],
  ['Chicken Supreme','Pizza','Pepperoni, chicken, peppers and smoked cheese',499,false,'photo-1579751626657-72bc17010498'],
  ['Four Cheese Pizza','Pizza','Mozzarella, cheddar, parmesan and blue cheese',479,true,'photo-1593560708920-61dd98c8c8d6'],
  ['BBQ Chicken Pizza','Pizza','Smoky BBQ chicken, onions and melted cheese',529,false,'photo-1594007654729-407eedc4be65'],
  ['Paneer Tikka Pizza','Pizza','Tandoori paneer, peppers, onion and mozzarella',449,true,'photo-1571407970349-bc81e7e96d47'],
  ['Mexican Fiesta Pizza','Pizza','Jalapeno, corn, beans and spicy salsa',399,true,'photo-1513104890138-7c749659a591'],
  ['Veg Burger','Burgers','Crispy veg patty, lettuce and house sauce',229,true,'photo-1520072959219-c595dc870360'],
  ['Chicken Burger','Burgers','Grilled chicken, cheddar and pickles',329,false,'photo-1568901346375-23c9450c58cd'],
  ['Paneer Butter Masala','Indian','Silky tomato gravy with soft paneer',299,true,'photo-1631452180519-c014fe946bc7'],
  ['Veg Biryani','Indian','Basmati rice, vegetables and saffron',279,true,'photo-1563379091339-03246963d96c'],
  ['Chicken Biryani','Indian','Dum-cooked chicken, basmati and aromatic spices',369,false,'photo-1589302168068-964664d93dc0'],
  ['Butter Naan','Indian','Tandoor baked naan brushed with butter',69,true,'https://commons.wikimedia.org/wiki/Special:FilePath/Naan.jpg?width=900'],
  ['Chocolate Brownie','Desserts','Warm dark chocolate brownie with vanilla cream',199,true,'photo-1564355808539-22fda35bed7e'],
  ['Lava Cake','Desserts','Warm chocolate cake with a rich molten center',229,true,'photo-1606313564200-e75d5e30476f'],
  ['Gulab Jamun','Desserts','Soft milk dumplings in rose-cardamom syrup',129,true,'https://upload.wikimedia.org/wikipedia/commons/5/58/Two_Gulab_Jamun_in_a_plate_01.jpg'],
  ['Cheesecake','Desserts','Baked vanilla cheesecake with berry compote',249,true,'photo-1565958011703-44f9829ba187'],
  ['Fresh Lime Soda','Drinks','Bright lime, soda and a touch of mint',99,true,'photo-1513558161293-cdaf765ed2fd'],
  ['Cold Coffee','Drinks','Iced coffee, milk and chocolate foam',159,true,'photo-1461023058943-07fcbe16d735'],
  ['Mango Shake','Drinks','Alphonso mango blended with chilled milk',189,true,'photo-1546173159-315724a31696'],
  ['French Fries','Starters','Sea-salt fries with smoky paprika dip',149,true,'photo-1573080496219-bb080dd4f877'],
  ['Fresh Juice','Drinks','Seasonal fruit pressed to order',139,true,'photo-1600271886742-f049cd451bba'],
  ['Chicken Momos','Momos','Steamed chicken momos with spicy garlic chutney',219,false,'https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=900&q=80'],
  ['Veg Momos','Momos','Vegetable-stuffed steamed momos with chilli oil',199,true,'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80'],
  ['Mushroom Momos','Momos','Juicy mushroom dumplings with sesame-soy dip',229,true,'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=80'],
  ['Tandoori Momos','Starters','Charred dumplings with mint yoghurt',229,true,'photo-1625220194771-7ebdea0b70b9'],
  ['Pasta Alfredo','Main Course','Creamy parmesan pasta with roasted herbs',329,true,'photo-1473093295043-cdd812d0e601'],
  ['Tandoori Platter','Main Course','A generous platter of smoky grilled bites',549,false,'photo-1544025162-d76694265947'],
  ['Rasmalai','Desserts','Soft cheese dumplings in saffron milk',169,true,'photo-1551024506-0bccd828d307']
].map((item, index) => ({ _id: `menu-${index + 1}`, name: item[0], category: item[1], description: item[2], price: item[3], isVegetarian: item[4], image: image(item[5]), rating: +(4.4 + (index % 6) / 10).toFixed(1), available: true, ingredients: ['Fresh ingredients', 'House seasoning', 'Chef special'] }));

const demoOrders = [];
let memoryMenu = [...starterMenu];
let memoryOrders = demoOrders;
let useMongo = false;
const UserSchema = new mongoose.Schema({ name: String, email: { type: String, unique: true }, password: String, role: String }, { timestamps: true });
const memoryUsers = [];
const MenuSchema = new mongoose.Schema({ name: String, category: String, description: String, ingredients: [String], price: Number, image: String, rating: Number, isVegetarian: Boolean, available: Boolean }, { timestamps: true });
const OrderSchema = new mongoose.Schema({ orderId: String, customerName: String, mobile: String, email: String, tableNumber: String, orderType: String, paymentMethod: String, items: Array, subtotal: Number, tax: Number, serviceCharge: Number, total: Number, specialInstructions: String, status: String }, { timestamps: true });
const User = mongoose.model('User', UserSchema); const MenuItem = mongoose.model('MenuItem', MenuSchema); const Order = mongoose.model('Order', OrderSchema);
const store = { menu: () => useMongo ? MenuItem.find().sort({ createdAt: -1 }) : Promise.resolve(memoryMenu), orders: () => useMongo ? Order.find().sort({ createdAt: -1 }) : Promise.resolve(memoryOrders) };
const token = (user) => jwt.sign({ id: user._id || user.id, name: user.name, role: user.role, email: user.email }, process.env.JWT_SECRET || 'demo-secret', { expiresIn: '2d' });
const auth = (req, res, next) => { try { const header = req.headers.authorization || ''; req.user = jwt.verify(header.replace('Bearer ', ''), process.env.JWT_SECRET || 'demo-secret'); next(); } catch { res.status(401).json({ message: 'Owner login required' }); } };
const admin = (req, res, next) => req.user.role === 'admin' ? next() : res.status(403).json({ message: 'Admin access required' });

app.get('/api/health', (req, res) => res.json({ status: 'ok', database: useMongo ? 'MongoDB' : 'Demo memory' }));
app.post('/api/auth/login', async (req, res) => { const { email, password } = req.body; if (email === 'admin' && password === 'admin123') return res.json({ token: token({ id: 'admin', name: 'Restaurant Admin', role: 'admin', email: 'admin@foodiehub.test' }), user: { name: 'Restaurant Admin', role: 'admin' } }); if (useMongo) { const bcrypt = require('bcryptjs'); const user = await User.findOne({ email }).select('+password'); if (user && await bcrypt.compare(password, user.password)) return res.json({ token: token(user), user }); } res.status(401).json({ message: 'Use demo credentials: admin / admin123' }); });
app.post('/api/auth/register', async (req, res) => { const { name, email, password } = req.body; if (!name || !email || !password || password.length < 6) return res.status(400).json({ message: 'Name, email and a password of 6+ characters are required.' }); if (useMongo) { const bcrypt = require('bcryptjs'); if (await User.findOne({ email: email.toLowerCase() })) return res.status(409).json({ message: 'An account with this email already exists.' }); const user = await User.create({ name, email: email.toLowerCase(), password: await bcrypt.hash(password, 12), role: 'customer' }); return res.status(201).json({ token: token(user), user: { name: user.name, email: user.email, role: user.role } }); } if (memoryUsers.some(user => user.email === email.toLowerCase())) return res.status(409).json({ message: 'An account with this email already exists.' }); const user = { id: `customer-${Date.now()}`, name, email: email.toLowerCase(), role: 'customer', password }; memoryUsers.push(user); res.status(201).json({ token: token(user), user: { name, email: user.email, role: user.role } }); });
app.get('/api/menu', async (req, res) => res.json(await store.menu()));
app.get('/api/menu/:id', async (req, res) => { const items = await store.menu(); const item = items.find(entry => String(entry._id) === req.params.id); item ? res.json(item) : res.status(404).json({ message: 'Dish not found' }); });
app.post('/api/menu', auth, admin, async (req, res) => { const item = useMongo ? await MenuItem.create(req.body) : { ...req.body, _id: `menu-${Date.now()}`, rating: Number(req.body.rating || 4.5), available: req.body.available !== false }; if (!useMongo) memoryMenu.unshift(item); res.status(201).json(item); });
app.put('/api/menu/:id', auth, admin, async (req, res) => { const item = useMongo ? await MenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true }) : Object.assign(memoryMenu.find(entry => entry._id === req.params.id) || {}, req.body); res.json(item); });
app.patch('/api/menu/:id/availability', auth, admin, async (req, res) => { const item = useMongo ? await MenuItem.findByIdAndUpdate(req.params.id, { available: req.body.available }, { new: true }) : Object.assign(memoryMenu.find(entry => entry._id === req.params.id) || {}, { available: Boolean(req.body.available) }); res.json(item); });
app.delete('/api/menu/:id', auth, admin, async (req, res) => { if (useMongo) await MenuItem.findByIdAndDelete(req.params.id); else memoryMenu = memoryMenu.filter(item => item._id !== req.params.id); res.status(204).end(); });
app.post('/api/orders', async (req, res) => { const { customerName, mobile, email, tableNumber, orderType, paymentMethod, specialInstructions, items } = req.body; if (!customerName || !mobile || !email || !orderType || !items?.length || (orderType === 'Dine In' && !tableNumber) || !paymentMethod) return res.status(400).json({ message: 'Please complete all required fields, including payment method.' }); const menu = await store.menu(); const normalized = items.map(entry => { const item = menu.find(food => String(food._id) === String(entry.menuItemId)); return item ? { menuItemId: item._id, name: item.name, image: item.image, price: item.price, quantity: Number(entry.quantity) } : null; }); if (normalized.includes(null)) return res.status(400).json({ message: 'A selected dish is unavailable.' }); const subtotal = normalized.reduce((sum, item) => sum + item.price * item.quantity, 0); const order = { orderId: `FD${Date.now().toString().slice(-8)}`, customerName, mobile, email, tableNumber, orderType, paymentMethod, specialInstructions, items: normalized, subtotal, tax: +(subtotal * .05).toFixed(2), serviceCharge: 20, total: +(subtotal * 1.05 + 20).toFixed(2), status: 'Pending', createdAt: new Date() }; if (useMongo) res.status(201).json(await Order.create(order)); else { memoryOrders.unshift({ ...order, _id: `order-${Date.now()}` }); res.status(201).json(order); } });
app.get('/api/orders/public/:orderId', async (req, res) => { const orders = await store.orders(); const order = orders.find(entry => entry.orderId === req.params.orderId); order ? res.json(order) : res.status(404).json({ message: 'Order not found' }); });
app.get('/api/orders', auth, admin, async (req, res) => res.json(await store.orders()));
app.put('/api/orders/:id/status', auth, admin, async (req, res) => { const item = useMongo ? await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true }) : Object.assign(memoryOrders.find(order => order._id === req.params.id) || {}, { status: req.body.status }); res.json(item); });
app.delete('/api/orders/:id', auth, admin, async (req, res) => { if (useMongo) await Order.findByIdAndDelete(req.params.id); else memoryOrders = memoryOrders.filter(order => order._id !== req.params.id); res.status(204).end(); });
app.get('/api/analytics/summary', auth, admin, async (req, res) => { const orders = await store.orders(); const byStatus = ['Pending','Confirmed','Preparing','Ready','Completed','Cancelled'].map(status => ({ _id: status, count: orders.filter(order => order.status === status).length })); const popular = {}; orders.forEach(order => order.items?.forEach(item => { popular[item.name] = (popular[item.name] || 0) + item.quantity; })); res.json({ totalOrders: orders.length, todayOrders: orders.length, pendingOrders: orders.filter(o => o.status === 'Pending').length, completedOrders: orders.filter(o => o.status === 'Completed').length, todayRevenue: orders.reduce((sum, o) => sum + (o.total || 0), 0), customers: new Set(orders.map(o => o.email)).size, byStatus, popular: Object.entries(popular).map(([name, quantity]) => ({ _id: name, quantity })).sort((a,b) => b.quantity-a.quantity).slice(0,5), revenue: [] }); });
app.get('/api/customers', auth, admin, async (req, res) => { const orders = await store.orders(); const customers = {}; if (useMongo) { const users = await User.find({ role: 'customer' }).select('name email createdAt').lean(); users.forEach(user => { customers[user.email] = { name: user.name, email: user.email, orders: 0, spent: 0, joinedAt: user.createdAt }; }); } else { memoryUsers.forEach(user => { customers[user.email] = { name: user.name, email: user.email, orders: 0, spent: 0 }; }); } orders.forEach(order => { const key = order.email; customers[key] = customers[key] || { name: order.customerName, email: order.email, orders: 0, spent: 0 }; customers[key].orders++; customers[key].spent += order.total || 0; customers[key].mobile = order.mobile; }); res.json(Object.values(customers).sort((a, b) => b.orders - a.orders)); });
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html')));

async function start() { try { await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/foodiehub', { serverSelectionTimeoutMS: 1200 }); useMongo = true; if (await MenuItem.countDocuments() === 0) { await MenuItem.insertMany(starterMenu.map(({ _id, ...item }) => item)); console.log(`Seeded ${starterMenu.length} menu items`); } else { const catalogNames = starterMenu.map(item => item.name); for (const catalogItem of starterMenu) { await MenuItem.updateOne({ name: catalogItem.name }, { $setOnInsert: Object.fromEntries(Object.entries(catalogItem).filter(([key]) => key !== '_id')) }, { upsert: true }); } const gulab = starterMenu.find(item => item.name === 'Gulab Jamun'); const naan = starterMenu.find(item => item.name === 'Butter Naan'); const rasmalai = starterMenu.find(item => item.name === 'Rasmalai'); await MenuItem.updateOne({ name: 'Gulab Jamun' }, { image: gulab.image }); await MenuItem.updateOne({ name: 'Butter Naan' }, { image: naan.image }); await MenuItem.updateOne({ name: 'Rasmalai' }, { image: rasmalai.image }); console.log(`Menu catalog checked: ${catalogNames.length} dishes`); } console.log('MongoDB connected'); } catch (error) { console.log('MongoDB unavailable: running presentation demo mode with API-backed memory data'); }

  const requestedPort = Number(process.env.PORT || 3000);
  const startServer = (port) => {
    const server = app.listen(port, () => console.log(`FoodieHub: http://localhost:${port}`));
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        const fallbackPort = port + 1;
        console.log(`Port ${port} is busy. Retrying on ${fallbackPort}.`);
        startServer(fallbackPort);
        return;
      }
      throw error;
    });
  };

  startServer(requestedPort);
}
start();