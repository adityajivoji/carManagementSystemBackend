const Car = require('../models/Car');
const s3 = require('../config/awsConfig');
const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
// Create Car with image upload
const createCar = async (req, res) => {
  const { title, description, tags } = req.body;
  console.log('Request body:', req.body);
  console.log('Request files:', req.files);

  try {
    if (!req.files || !req.files.length) {
      throw new Error('No images uploaded');
    }
    
    const images = req.files.map(file => file.location); // Ensure file.location exists

    // If the tags are passed as a string (from client side), split them into an array
    let tagsArray = tags;
    if (typeof tags === 'string') {
      tagsArray = tags.split(',').map(tag => tag.trim()); // Split and trim spaces
    }

    const newCar = new Car({
      title,
      description,
      tags: tagsArray, // Store tags as an array
      images,
      userId: req.user.userId
    });
    console.log('New Car object:', newCar);

    await newCar.save();
    res.status(201).json(newCar);
  } catch (err) {
    console.error('Error:', err); // Log the full error
    res.status(500).json({ error: err.message });
  }
};



// List Cars for the logged-in user with pre-signed URLs
const listCars = async (req, res) => {
  const userId = req.user.userId;

  try {
    const cars = await Car.find({ userId });

    // Generate pre-signed URLs for each image in each car object
    const carsWithSignedUrls = cars.map(car => {
      const signedImageUrls = car.images.map(imageUrl => {
        // Extract the S3 object key from the URL
        const imageKey = imageUrl.split('amazonaws.com/')[1];

        // Generate a pre-signed URL for the extracted object key
        return s3.getSignedUrl('getObject', {
          Bucket: 'carmanagementsystemstorage', // Replace with your bucket name
          Key: imageKey, // The extracted object key (e.g., car-photos/car-image1.jpg)
          Expires: 60 // URL expiration time in seconds (e.g., 1 minute)
        });
      });

      return { ...car._doc, images: signedImageUrls };
    });

    res.status(200).json(carsWithSignedUrls);
  } catch (err) {
    console.error('Error retrieving cars:', err);
    res.status(500).json({ error: 'Server error' });
  }
};


const mongoose = require('mongoose');

const getCar = async (req, res) => {
  const { carId } = req.params;
  
  console.log("Received request for car with ID:", carId); // Log to confirm the route is hit

  // Check if the carId is a valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(carId)) {
    console.log('Invalid car ID format');
    return res.status(400).send('Invalid car ID format');
  }

  try {
    const car = await Car.findById(carId);
    // console.log("Fetched car:", car); // Log to check if the car is fetched

    if (!car) {
      console.log("Car not found");
      return res.status(404).send('Car not found');
    }

    // Generate pre-signed URLs for each image in the car object
    const signedImageUrls = car.images.map(imageUrl => {
      const imageKey = imageUrl.split('amazonaws.com/')[1]; // Extract the object key from the URL

      // Generate a pre-signed URL for the extracted object key
      const signedUrl = s3.getSignedUrl('getObject', {
        Bucket: 'carmanagementsystemstorage', // Replace with your bucket name
        Key: imageKey, // The extracted object key (e.g., car-photos/car-image1.jpg)
        Expires: 60 // URL expiration time in seconds (e.g., 1 minute)
      });

      return signedUrl;
    });

    // Add the signed URLs to the car object before sending it in the response
    const carWithSignedUrls = {
      ...car._doc,
      images: signedImageUrls // Replace the images array with the signed URLs
    };

    res.status(200).json(carWithSignedUrls);
  } catch (err) {
    console.error('Error fetching car:', err); // Log any errors
    res.status(500).send('Server error');
  }
};




const updateCar = async (req, res) => {
  const { carId } = req.params;
  const { title, description, tags } = req.body;
  const userId = req.user.userId;

  console.log("Request body:", req.body);
  console.log("Request files:", req.files);
  const car = await Car.findOne({ _id: carId, userId });
  try {
    // Check if new images are provided
    let newImages = [];
    if (req.files && req.files.length > 0) {
      newImages = req.files.map(file => file.location);
      
      // Fetch the current car details to get the existing images
      const car = await Car.findOne({ _id: carId, userId });
      if (!car) return res.status(404).send('Car not found or not authorized');
      
      // Delete old images from S3
      if (car.images && car.images.length > 0) {
        for (const imageUrl of car.images) {
          const imageKey = imageUrl.split('/').pop(); // Extract key from URL if needed
          const deleteParams = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: `car-photos/${imageKey}`,
          };

          // Use the deleteObject method instead of s3.send
          await s3.deleteObject(deleteParams).promise();
        }
      }
    }

    // Combine tags into an array if necessary
    let tagsArray = tags;
    if (typeof tags === 'string') {
      tagsArray = tags.split(',').map(tag => tag.trim());
    }

    // Update only if new images are present
    const updateData = { title, description, tags: tagsArray };
    if (newImages.length > 0) {
      updateData.images = newImages;
    } else {
      updateData.images = car.images;
    }

    const updatedCar = await Car.findOneAndUpdate(
      { _id: carId, userId },
      updateData,
      { new: true }
    );

    if (!updatedCar) return res.status(404).send('Car not found or not authorized');

    console.log("Updated car:", updatedCar);
    res.status(200).json(updatedCar);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};


// Delete Car
const deleteCar = async (req, res) => {
  
  const { carId } = req.params;
  console.log("Received Delete request for car with ID:", carId); // Log to confirm the route is hit
  const userId = req.user.userId;

  try {
    const car = await Car.findOneAndDelete({ _id: carId, userId });
    if (!car) return res.status(404).send('Car not found or not authorized');
    res.status(200).send('Car deleted successfully');
  } catch (err) {
    res.status(500).send('Server error');
  }
};

module.exports = { createCar, listCars, getCar, updateCar, deleteCar };
