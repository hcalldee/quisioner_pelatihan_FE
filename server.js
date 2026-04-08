const express = require('express');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(expressLayouts);
app.set('layout', 'layouts/main');

app.use(express.static(path.join(__dirname, 'public')));

app.get('/login', (req, res) => {
  res.render('pages/login', {
    title: 'Login',
    layout: 'layouts/auth',
    scripts: `
      <script src="/js/login.js"></script>
    `
  });
});

app.get('/', (req, res) => {
  res.render('pages/dashboard', {
    title: 'Dashboard',
    scripts: `
      <script src="/js/dashboard.js"></script>
    `
  });
});

app.get('/pelatihan', (req, res) => {
  res.render('pages/pelatihan', {
    title: 'Pelatihan',
    scripts: `
      <script src="/js/pelatihan.js"></script>
    `
  });
});

app.get('/quisioner', (req, res) => {
  res.render('pages/quisioner', {
    title: 'Quisioner',
    scripts: `
      <script src="/js/quisioner.js"></script>
    `
  });
});

app.get('/form-quisioner', (req, res) => {
  res.render('pages/form-quisioner', {
    title: 'Form Quisioner',
    scripts: `
      <script src="/js/form-quisioner.js"></script>
    `
  });
});

app.get('/user', (req, res) => {
  res.render('pages/user', {
    title: 'User',
    scripts: `
      <script src="/js/user.js"></script>
    `
  });
});

app.get('/setup-2fa', (req, res) => {
  res.render('pages/setup-2fa', {
    title: 'Setup 2FA',
    scripts: `
      <script src="/js/setup-2fa.js"></script>
    `
  });
});

app.get('/pending-approval', (req, res) => {
  res.render('pages/pending-approval', {
    title: 'Menunggu Approval',
    layout: 'layouts/auth'
  });
});

app.listen(8000, () => {
  console.log('Server running on http://localhost:8000');
});
