var express = require('express');
var router = express.Router();
router.get('/', (req, res) => {
  res.sendFile('index.html', {
    root: '/views/index.html'
  });
});
/* GET home page. */
/*router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});
*/
module.exports = router;
