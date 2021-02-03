const express = require('express');
const Task = require('../models/task');
const auth = require('../middleware/auth')
const router = new express.Router();

//Route handler: POST /tasks
router.post('/tasks', auth, async (req, res) => {
  //Create task with task data and user's id
  const task = new Task ({
    ...req.body,
    owner: req.user._id
  });

  try {
    await task.save();
    res.status(201).send(task);
  } catch(e) {
    res.status(400).send(e);
  }
});

//Route handler: GET /tasks?completed=true
//Pagination: limit, skip(#of entries to skip)
//GET /tasks?limit=10&skip20
//GET /tasks?sortBy=createdAt:asc
router.get('/tasks', auth, async(req, res) => {
  try {
    //Could also do: const task = await Task.find({ owner: req.user._id })   
    const match = {};
    const sort = {}

    if (req.query.completed) {
      //if string true is received, set match to boolean true
      match.completed = req.query.completed === 'true'
    }

    if (req.query.sortBy) {
      //split 'createdAt:asc' string using :
      const parts = req.query.sortBy.split(':');
      //convert asc to 1 and desc to -1
      sort[parts[0]] = parts[1] === 'asc' ? 1 : -1;
    }

    await req.user.populate({
      path: 'tasks',
      match,
      options: {
        limit: parseInt(req.query.limit),
        skip: parseInt(req.query.skip),
        sort
      }
    }).execPopulate();
    
    res.send(req.user.tasks);
  } catch (e){
    res.status(500).send(e);
  }
});

//Route handler: GET /tasks/id
router.get('/tasks/:id', auth, async (req, res) => {
  try {
    const _id = req.params.id; //task id
    //Match the task ID and authenticated user ID
    const task = await Task.findOne({ _id, owner: req.user._id });
    if (!task){
      return res.status(404).send();
    }
    res.send(task);
  } catch (e) {
    res.status(500).send(e);
  }
});


//Route handler: PATCH /tasks/id
router.patch('/tasks/:id', auth, async (req, res) => {
  const allowedUpdates = ['description', 'completed'];
  const updates = Object.keys(req.body);

  //check if updates are valid property names
  const isValidOperation = updates.every( update => allowedUpdates.includes (update));
  if (!isValidOperation){
    res.status(400).send({ error: 'Invalid updates'});
  }
  try {
    //Not using findByIdAndUpdate() because it doesn't use middleware
    // const task = await Task.findByIdAndUpdate(req.params.id, req.body,{
    //   new: true,
    //   runValidators: true
    // });
    //Find task for a specific user
    const task = await Task.findOne({ _id: req.params.id, owner: req.user._id});
   
    if (!task){
      return res.status(404).send();
    }

    //Copy over the updated properties
    updates.forEach(update => task[update] = req.body[update]);

    //Save the task document to the database
    await task.save();
    
    res.send(task);

  }catch (e){
    res.status(400).send();
  }
})

//Route Handler: DELETE /tasks/id
router.delete ('/tasks/:id', auth, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!task){
      return res.status(404).send();
    }
    res.send(task);
  } catch (e){
    res.status(500).send();
  }

});


module.exports = router;