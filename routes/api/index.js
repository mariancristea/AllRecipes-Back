var router = require('express').Router();

router.use('/recipes', require('./recipes'));
router.use('/profiles', require('./profiles'));
router.use('/', require('./users'));


module.exports = router;
