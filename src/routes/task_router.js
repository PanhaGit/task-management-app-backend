const express = require('express');
const router = express.Router();
const taskController = require("../controllers/taskController");
const authMiddleware = require("../middlewares/authMiddleware");

router.route('/')
    .get(authMiddleware.validateToken(), taskController.getAllTasks)
    .post(authMiddleware.validateToken(), taskController.createTask);

router.route('/:id')
    .get(authMiddleware.validateToken(), taskController.getTaskById)
    .put(authMiddleware.validateToken(), taskController.updateTask)
    .delete(authMiddleware.validateToken(), taskController.deleteTask);

module.exports = router;