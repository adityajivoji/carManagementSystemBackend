const express = require('express');
const authenticateToken = require('../middlewares/auth');
const { createCar, listCars, getCar, updateCar, deleteCar } = require('../controllers/CarController');
const router = express.Router();
const upload = require('../middlewares/upload');
// Route to handle car creation with image uploads
router.post('/addCar', authenticateToken, upload.array('images', 10), createCar);
router.get('/listCars', authenticateToken, listCars); // List Cars
router.get('/cars/:carId', authenticateToken, getCar); // Get Specific Car
router.put('/cars/:carId', authenticateToken, upload.array('images', 10), updateCar); // Update Car
router.delete('/cars/:carId', authenticateToken, deleteCar); // Delete Car

module.exports = router;
