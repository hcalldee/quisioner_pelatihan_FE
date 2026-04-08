const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.render('dashboard', {
    title: 'Dashboard'
  });
});

router.get('/pelatihan', (req, res) => {
  res.render('pelatihan', {
    title: 'Data Pelatihan'
  });
});

module.exports = router;
