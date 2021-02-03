const jwt = require ('jsonwebtoken');
const User = require('../models/user')
const auth = async ( req, res, next) => {
  try {
    //Remove the "Bearer " string from the auth token
    const token = req.header('Authorization').replace('Bearer ','');
    //Get the decoded payload
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findOne({ _id: decoded._id , 'tokens.token': token });

    if (!user){
      throw new Error();
    }
    //Give route handler the user property we found so they don't have
    //to find user again
    req.user = user;
    //Save the token used to authenticate this user
    req.token = token;
    next();

  }catch (e) {
    res.status(401).send({ error: 'Please authenticate.' });
  }
}

module.exports = auth;