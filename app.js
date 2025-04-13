const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./models/User');
const Donor = require('./models/Donor');

dotenv.config();

const app = express();

app.set('view engine', 'ejs');

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

function isAuthenticated(req, res, next) {
  if (req.session.userId) return next();
  res.redirect('/login');
}

// Routes

// Home redirect
app.get('/', (req, res) => res.redirect('/login'));

// Signup
app.get('/signup', (req, res) => res.render('signup'));

app.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;
  const existingUser = await User.findOne({ email });
  if (existingUser) return res.send("User already exists. <a href='/login'>Login</a>");

  const hashed = await bcrypt.hash(password, 10);
  const user = new User({ name, email, password: hashed });
  await user.save();
  res.redirect('/login');
});

// Login
app.get('/login', (req, res) => res.render('login'));

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (user && await bcrypt.compare(password, user.password)) {
    req.session.userId = user._id;
    res.redirect('/organs');
  } else {
    res.send('Invalid credentials. <a href="/login">Try again</a>');
  }
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

// Organ Selection
app.get('/organs', isAuthenticated, (req, res) => {
  res.render('organs');
});

// Donor Form
app.get('/donate', isAuthenticated, (req, res) => {
  const organ = req.query.organ;
  if (!organ) return res.redirect('/organs');
  res.render('donate', { organ });
});

app.post('/donate', isAuthenticated, async (req, res) => {
  const { organ, fullName, age, bloodType, contact, address } = req.body;
  const donor = new Donor({
    userId: req.session.userId,
    organ,
    fullName,
    age,
    bloodType,
    contact,
    address
  });

  await donor.save();
  req.session.donorId = donor._id;
  res.redirect('/receipt');
});

// Receipt
app.get('/receipt', isAuthenticated, async (req, res) => {
  const donor = await Donor.findById(req.session.donorId);
  if (!donor) return res.redirect('/organs');
  res.render('receipt', { donor });
});

// Thank you
app.get('/thankyou', isAuthenticated, (req, res) => {
  res.render('thankyou');
});

// Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));