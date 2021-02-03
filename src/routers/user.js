const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const User = require('../models/user');
const auth = require('../middleware/auth');
const { sendWelcomeEmail, sendCancelEmail } = 
  require('../emails/account');
const router = new express.Router();

//Creating a new user - signing up
//Route handler: POST /users
router.post('/users', async (req,res)=> {
  const user = new User(req.body);
  try {
    //Save the new user to the users collection
    await user.save();
    sendWelcomeEmail( user.email, user.name);
    //Create token when new user is created
    const token = await user.generateAuthToken();
    res.status(201).send({ user, token }); //201 - indicates resource was created
    
  } catch (e) {
    res.status(400).send(e);
  };  
});

//Login a user
//Route handler: /users/login'
router.post('/users/login', async(req, res) => {
  try {
    const user = await User.findByCredentials(req.body.email, 
      req.body.password);
    //Generate new token after logging in
    const token = await user.generateAuthToken();
    res.send({ user, token });
  }catch (e){
    res.status(400).send();
  }
});

//Logout a user
//Route handler 
router.post('/users/logout', auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter((token) => {
      return token.token !== req.token;
    })
    await req.user.save();
    
    res.send();
  } catch(e) {
    res.status(500).send();
  }
});

//Logout user from all sessions
router.post('/users/logoutAll', auth, async (req, res) => {
  try {
    //Remove all the tokens from the list
    req.user.tokens = [];
    await req.user.save();
    res.send();
  } catch (e){
    res.status(500).send();
  }
})

//Route handler: GET /users/me
//Authentication function is the middleware used 2nd argument
//Our function 3rd argument
router.get('/users/me', auth, async (req, res) => {
   res.send(req.user);  
});

//Route handler: GET /users/id
router.get('/users/:id', async (req, res) => {
  const _id = req.params.id;
  try {
    const user = await User.findById(_id);
    if (!user){
      return res.status(404).send();
    }
    res.send(user);
  }catch(e) {
    res.status(500).send(e);
  }
});

//Route handler: PATCH 
//Update the currently authenticated user
router.patch('/users/me', auth, async (req, res) => {
  
  //Property names in message body
  const updates = Object.keys(req.body);

  //Valid property names
  const allowedUpdates = ['name', 'email', 'password', 'age'];
  
  //Check if every properties to update is valid
  const isValidOperation = updates.every( update => allowedUpdates.includes(update));

  if (!isValidOperation){
    console.log("Invalid property update");
    return res.status(400).send({error: "Invalid updates" });
  }

  try {
   
    //User object is saved with the request
    updates.forEach( update => req.user[update] = req.body[update]);

    //Save the user and hash the password; Mongoose will call pre()  
    //that is defined in the User schema
    await req.user.save();

    //console.log("Success", user);
    res.send (req.user);
  }catch (e) {
    res.status(400).send();
  }
});

//Route handler: DELETE 
//Delete the authenticated user
router.delete ('/users/me', auth, async (req, res) => {
  try {
    await req.user.remove();
    //Send the cancel email with sendgrid
    console.log("In delete route");
    sendCancelEmail(req.user.email, req.user.name);
    res.send(req.user);
  }catch (e){
    console.log(e);
    res.status(500).send();
  }
});

//Setup multer middleware to upload user profile image
const upload = multer({
  //Take out destination directory so multer returns it
  //instead of storing it
  //dest: 'avatars', //destination folder for image uploaded
  
  limits: { //limit options
    fileSize: 1000000 //1MB limit to profile picture
  },
  //filter file by type
  fileFilter(req, file, cb){ 
    //cb - callback to send results to caller
    //first argument indicates error, second argument indicates if 
    //file was accepted
    const fileExtensions = ['jpg', 'jpeg', 'png'];
    const isValidFile = fileExtensions.some(ext => {
      return file.originalname.endsWith(ext);
    })
    if (!isValidFile){
      return cb(new Error("Please upload JPG, JPEG or PNG file"));
    }
    cb(undefined, true); //no error, file was uploaded
  }
});

//Use upload.single middleware from multer library with key 'avatar'
//Route handler: POST /users/id/avatar
router.post('/users/me/avatar', 
  auth, //authenticate user
  upload.single('avatar'), 
  async (req, res) => {
    //User sharp npm module to convert image buffer
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer();
    req.user.avatar = buffer;
    await req.user.save();
    res.send();
  }, 
  (error, req, res, next) => {
  //handle error from multer
  res.status(400).send({ error: error.message }); 
})


//DELETE /users/me/avatar
router.delete('/users/me/avatar', auth, async (req, res) => {
  //Clear the avatar field
  req.user.avatar = undefined;
  try {
    await req.user.save();
    res.send();
  } catch (e) {
    res.status(500).send();
  }
});

//GET /users/:id/avatar
router.get('/users/:id/avatar', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || !user.avatar){
      throw new Error();
    }
    //We reformat and convert to png when we receive avatar
    res.set('Content-Type','image/png');
    res.send(user.avatar);
  }catch (e) {
    res.status(404).send();
  }
})

module.exports = router;