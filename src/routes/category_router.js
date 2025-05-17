const express = require('express');
const router = express.Router();
const categoryController = require("../controllers/categoryController");
const authMiddleware = require("../middlewares/authMiddleware");

router.post('/',authMiddleware.validateToken(),  categoryController.create);
router.get('/',authMiddleware.validateToken(),  categoryController.getAll);
router.get('/:id',authMiddleware.validateToken(),  categoryController.getOne);
router.put('/:id',authMiddleware.validateToken(),  categoryController.update);
router.delete('/:id',authMiddleware.validateToken(),  categoryController.delete);

module.exports = router;