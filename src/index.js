//Commands to run this project in two separate terminals run:
///Users/Christine/mongodb/bin/mongod --dbpath=/Users/Christine/mongodb-data
//npm run dev


const express = require('express');
require('./db/mongoose');
const User = require('./models/user');
const Task = require('./models/task');
const userRouter = require('./routers/user');
const taskRouter = require('./routers/task');

const app = express();
//Heroku uses env variable PORT otherwise use 3000
const port = process.env.PORT;


//Automaticaly parse incoming data as json object
app.use(express.json());

//Use User Router and Task Router
app.use(userRouter);
app.use(taskRouter);


app.listen(port, () => {
  console.log('Server is up on port ' + port);
});

