const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization');
  console.log("hello")
  if (!token) return res.status(401).send('Access Denied');

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).send('Invalid Token');
  }
};

module.exports = authenticateToken;
