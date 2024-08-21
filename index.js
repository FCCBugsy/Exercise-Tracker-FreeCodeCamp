const express = require('express');
const app = express();
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Middleware
app.use(cors());
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ======================= //

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

// Database Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Schemas
const userSchema = new mongoose.Schema({
  username: String,
});

const exerciseSchema = new mongoose.Schema({
  userId: String,
  username: String,
  description: { type: String, required: true },
  duration: { type: String, required: true },
  date: Date,
});

// Models
const User = mongoose.model('User', userSchema);
const Exercise = mongoose.model('Exercise', exerciseSchema);

// POST Calls
// Create a new user
app.post('/api/users', (req, res) => {
  // "MongooseError: Model.prototype.save() no longer accepts a callback", so we use try and catch
  // console.log(req.body.username);
  try {
    const newUser = new User({ username: req.body.username });
    newUser.save();
    res.json({ username: newUser.username, _id: newUser._id });
  } 
  
  catch (error) {
    res.send('Error saving user');
    console.log(error);
    return;
  }
});

// Add exercises
app.post('/api/users/:_id/exercises', async (req, res) => {
  let date;
  if (!req.body.date) date = new Date(Date.now()).toDateString();
  else date = new Date(req.body.date).toDateString();

  // Model.findById() no longer accepts a callback, so we use try and catch
  try {
    const user = await User.findById(req.params._id);
    if (!user) {
      res.send('Error finding user');
      return;
    }

    const newExercise = new Exercise({
      userId: user._id,
      username: user.username,
      date: date,
      duration: parseInt(req.body.duration),
      description: req.body.description,
    });

    await newExercise.save();
    res.json({
      _id: user._id,
      username: user.username,
      date: date,
      duration: parseInt(req.body.duration),
      description: req.body.description,
    });
  } 
  
  catch (error) {
    res.send('Error saving exercise');
    console.log(error);
  }
});

// GET Calls
// Get all users
app.get('/api/users', async (_req, res) => {
  try {
    const users = await User.find({});
    if (users.length === 0) res.send('No users found');
    else res.json(users);
  } 
  
  catch (error) {
    res.send('Error finding users');
    console.log(error);
  }

});

// Delete all users
app.get('/api/users/delete', async (_req, res) => {
  try {
    await User.deleteMany({});
    res.send('All users deleted');
  } 
  
  catch (error) {
    res.send('Error deleting users');
    console.log(error);
  }
});

// Get all exercises
app.get('/api/exercises', async (_req, res) => {
  try {
    const exercises = await Exercise.find({});
    if (exercises.length === 0) res.send('No exercises found');
    else res.json(exercises);
  } 
  
  catch (error) {
    res.send('Error finding exercises');
    console.log(error);
  }
});

// Delete all exercises
app.get('/api/exercises/delete', async (_req, res) => {
  try {
    await Exercise.deleteMany({});
    res.send('All exercises deleted');
  } 
  
  catch (error) {
    res.send('Error deleting exercises');
    console.log(error);
  }
});


// Logs
app.get('/api/users/:_id/logs', async (req, res) => {
  const id = req.params._id;
  const from = req.query.from ? new Date(req.query.from) : new Date(0); // 1970-01-01
  const to = req.query.to ? new Date(req.query.to) : new Date(); // Current date
  const limit = parseInt(req.query.limit) || 0;

  const user = await User.findById(id).exec();
  if (!user) {
    res.json({ error: 'User not found' });
    return;
  }

  console.log(user);

  const exercises = await Exercise.find({
    userId: user._id,
    // date: { $gte: from, $lte: to }, // $gte = greater than or equal, $lte = less than or equal
  }).select('description duration date').limit(limit).exec();
  // console.log(exercises, id, from, to, limit);

  const dateLogs = exercises.map((exe) => {
    return {
      date: new Date(exe.date).toDateString(),
      duration: parseInt(exe.duration),
      description: exe.description,
    };
  });

  res.json({
    _id: user._id,
    username: user.username,
    count: dateLogs.length,
    log: dateLogs,
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
