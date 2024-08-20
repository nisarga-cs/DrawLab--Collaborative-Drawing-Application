var express = require('express');
var router = express.Router();

console.log('Users js page');

/* GET users listing. */
router.get('/', function(req, res, next) {
  
  res.send('respond with a resource');
});

module.exports = router;
