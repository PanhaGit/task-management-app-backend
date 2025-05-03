const express = require('express');
const router = express.Router();
const taskController = require("../controllers/taskController");
const authMiddleware = require("../middlewares/authMiddleware");


// Create a new task
router.post('/',authMiddleware.validateToken(),  taskController.createTask);

// Get all tasks
router.get('/', authMiddleware.validateToken(), taskController.getAllTasks);

// Get task by ID
router.get('/:id',authMiddleware.validateToken(),  taskController.getTaskById);

// Update task
router.put('/:id', authMiddleware.validateToken(), taskController.updateTask);

// Delete task
router.delete('/:id', authMiddleware.validateToken(), taskController.deleteTask);

module.exports = router;