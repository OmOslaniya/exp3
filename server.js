const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors'); // Import cors 
const nodemailer = require('nodemailer');
const twilio = require('twilio');


const app = express();

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(bodyParser.json());

// MongoDB connection
mongoose.connect('mongodb+srv://arpan:arpan@cluster0.ff9rlfk.mongodb.net/school', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// MongoDB schema and model
const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: { type: String, unique: true },
  password: String,
  schoolName: String, // Add schoolName field to the schema
  schoolIndexId: String, // Add schoolIndexId field to the schema
  userRole: String
}, { collection: 'principal' });

const User = mongoose.model('principal', userSchema);

// Routes
app.post('/api/signup', async (req, res) => {
  try {
    const { firstName, lastName, email, password, schoolName, schoolIndexId, userRole } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user with hashed password
    const newUser = new User({ firstName, lastName, email, password, schoolName, schoolIndexId, userRole });
    await newUser.save();

    res.status(201).json({ message: 'Signup successful' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Signup failed' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
      const { email, password } = req.body;

      // Check if user exists
      const user = await User.findOne({ email });

      if (user) {
          // If the user is found in the User collection, set userrole as 'principal'
          res.status(200).json({ message: 'Login successful', user, userrole: 'principal' });
          return;
      }

      // If user is not found in the User collection, check in the Teacher collection
      const teacher = await Teacher.findOne({ email });
      if (teacher && teacher.password.toString() === password) {
          // If the user is found in the Teacher collection and the password matches, set userrole as 'teacher'
          res.status(200).json({ message: 'Login successful', user: teacher, userrole: 'teacher' });
          return;
      }

      // If user is neither in User nor in Teacher collection, or password doesn't match, return error
      res.status(401).json({ message: 'Invalid email or password' });
  } catch (error) {
      console.error('Login failed:', error.message);
      res.status(500).json({ message: 'Login failed' });
  }
});


  const teacherSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    degree: String,
    subject: String,
    contactNo: { type: String, unique: true },
    email: { type: String, unique: true },
    password: Number,
    principal:String,
    userRole:String
  }, { collection: 'teacher' });
  
  const Teacher = mongoose.model('Teacher', teacherSchema);
  
  // Routes
  app.post('/api/add-teachers', async (req, res) => {
    try {
      const { firstName, lastName, degree, subject, contactNo, email, password,principal , userRole} = req.body; // Include password in the request body
      const newTeacher = new Teacher({ firstName, lastName, degree, subject, contactNo, email, password,principal ,userRole}); // Include password in the Teacher model
      await newTeacher.save();
      res.status(201).json(newTeacher);
    } catch (error) {
      console.error('Error adding teacher:', error);
      res.status(500).json({ message: 'Failed to add teacher' });
    }
  });
  
  app.get('/api/fetch-teachers', async (req, res) => {
    try {
      const teachers = await Teacher.find();
      res.status(200).json(teachers);
    } catch (error) {
      console.error('Error fetching teachers:', error);
      res.status(500).json({ message: 'Failed to fetch teachers' });
    }
  });


  const classSchema = new mongoose.Schema({
    className: { type: String, unique: true },
    classTeacher: String,
    roomNo: { type: String, unique: true },
    capacity: Number,
    principal:String,
    feeAmount: Number
  }, { collection: 'class' });
  
  // Create model using the schema
  const Class = mongoose.model('Class', classSchema);
  
  // Endpoint to add a class
  app.post('/api/add-class', async (req, res) => {
    try {
      const { className, classTeacher, roomNo, capacity } = req.body;
      const newClass = new Class({ className, classTeacher, roomNo, capacity });
      await newClass.save();
      res.status(201).json(newClass);
    } catch (error) {
      console.error('Error adding class:', error);
      res.status(500).json({ message: 'Failed to add class' });
    }
  });
  
  // Endpoint to fetch all classes
  app.get('/api/fetch-class', async (req, res) => {
    try {
      const classes = await Class.find();
      res.status(200).json(classes);
    } catch (error) {
      console.error('Error fetching classes:', error);
      res.status(500).json({ message: 'Failed to fetch classes' });
    }
  });


  const studentSchema = new mongoose.Schema({
    rollNo: { type: Number, unique: true },
    firstName: String,
    middleName: String,
    lastName: String,
    gender: String,
    contactNo: String,
    email:  String,
    birthdate: Date, // Adding birthdate field
    childUid : { type: Number, unique: true }, // Adding childUid field
    classId: String,
    principal:String,
    userRole : String
  }, { collection: 'student' });
  
  const Student = mongoose.model('Student', studentSchema);
  
  // Assuming you have already defined '/api/add-student' endpoint
  app.post('/api/add-student', async (req, res) => {
    try {
      const { rollNo, firstName, middleName, lastName, gender, contactNo, email, birthdate, childUid, classId,principal,userRole } = req.body;
      const newStudent = new Student({ rollNo, firstName, middleName, lastName, gender, contactNo, email, birthdate, childUid, classId,principal,userRole });
      await newStudent.save();
      res.status(201).json(newStudent);
    } catch (error) {
      console.error('Error adding student:', error);
      res.status(500).json({ message: 'Failed to add student' });
    }
  });

  app.get('/api/fetch-students', async (req, res) => {
    try {
      const { classId } = req.query;
      const students = await Student.find({ classId });
      res.status(200).json(students);
    } catch (error) {
      console.error('Error fetching students:', error);
      res.status(500).json({ message: 'Failed to fetch students' });
    }
  });


  const subjectSchema = new mongoose.Schema({
    class: String,
    subjectName: String,
    subjectCode: { type: String, unique: true }
  },{collection: "subject"});
  
  const Subject = mongoose.model('Subject', subjectSchema);

  app.post('/api/add-subject', async (req, res) => {
    const { class: selectedClass, subjectName, subjectCode } = req.body;
    try {
      const newSubject = new Subject({ class: selectedClass, subjectName, subjectCode });
      await newSubject.save();
      res.status(201).json({ message: 'Subject added successfully' });
    } catch (error) {
      console.error('Error adding subject:', error);
      res.status(500).json({ message: 'Error adding subject' });
    }
  });
  

  app.get('/api/show-subjects', async (req, res) => {
    try {
      const subjects = await Subject.find();
      res.status(200).json(subjects);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      res.status(500).json({ message: 'Error fetching subjects' });
    }
  });

  const timetableSchema = new mongoose.Schema({
    date: Date,
    periods: [{
      srNo: Number,
      from: String,
      to: String,
      subject: String,
      teacher: String
    }],
    selectedClass: String // Adding selectedClass field to the schema
  },{collection:"timetable"});
  
  // Define a model for the timetable collection
  const Timetable = mongoose.model('Timetable', timetableSchema);
  
  app.post('/api/timetable', (req, res) => {
    const { date, periods, selectedClass } = req.body;
  
    // Create a new timetable document
    const newTimetable = new Timetable({
      date,
      periods,
      selectedClass // Adding selectedClass to the document
    });
  
    // Save the timetable document to the database
    newTimetable.save()
      .then(() => res.status(201).json({ message: 'Timetable saved successfully' }))
      .catch(err => res.status(500).json({ error: err.message }));
  });

  app.get('/api/timetable/:selectedClass/:date', async (req, res) => {
    const { selectedClass, date } = req.params;
  
    try {
      console.log("selectedClass"+date);
      const timetable = await Timetable.findOne({ selectedClass, date });
      if (!timetable) {
        
        return res.status(404).json({ message: 'Timetable not found' });
      }
      res.status(200).json(timetable);
    } catch (error) {
      console.error('Error fetching timetable:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });


  const fileUpload = require('express-fileupload');
  app.use(fileUpload());
  
  const imageSchema = new mongoose.Schema({
    imageData: {
      type: String,
      required: true,
    },
  },{collection:"image"});
  
  const Image = mongoose.model('Image', imageSchema);
  
  // Endpoint for adding an image
  app.post('/api/addImage', async (req, res) => {
    try {
      if (!req.files || !req.files.image) {
        return res.status(400).json({ message: 'No image uploaded' });
      }
  
      const imageFile = req.files.image;
      const imageData = imageFile.data.toString('base64');
  
      // Create a new image document
      const newImage = new Image({
        imageData,
      });
  
      // Save the image document to the database
      await newImage.save();
  
      res.status(200).json({ message: 'Image uploaded successfully' });
    } catch (error) {
      console.error('Error uploading image:', error);
      res.status(500).json({ message: 'Failed to upload image' });
    }
  });
  
  // Endpoint for retrieving images
  app.get('/api/getImages', async (req, res) => {
    try {
      // Retrieve all images from the database
      const images = await Image.find();
  
      res.status(200).json({ images });
    } catch (error) {
      console.error('Error fetching images:', error);
      res.status(500).json({ message: 'Failed to fetch images' });
    }
  });


  
  
  app.post('/api/add-fees', async (req, res) => {
    try {
      const { className, amount } = req.body;
      // You can perform validation and other checks here
      // For simplicity, assuming className is unique
      const classData = await Class.findOne({ className });
      if (!classData) {
        return res.status(404).json({ message: 'Class not found' });
      }
      // Update the class with the fee amount
      classData.feeAmount = amount;
      await classData.save();
      res.status(200).json({ message: 'Fees added successfully' });
    } catch (error) {
      console.error('Error adding fees:', error);
      res.status(500).json({ message: 'Failed to add fees' });
    }
  });
  app.get('/api/fetch-fees', async (req, res) => {
    try {
      // Assuming you have a model named Fee to fetch fees
      const classdata = await Class.find();
      res.status(200).json(classdata);
    } catch (error) {
      console.error('Error fetching fees:', error);
      res.status(500).json({ message: 'Failed to fetch fees' });
    }
  });

  const syllabusSchema = new mongoose.Schema({
    className: { type: String, unique: true },
    syllabus1 : String
  });
  
  const Syllabus = mongoose.model('Syllabus', syllabusSchema);
  
  app.post('/api/add-syllabus', async (req, res) => {
    const { className, syllabus1 } = req.body;
    try {
      const syllabus = new Syllabus({ className, syllabus1 });
      await syllabus.save();
      res.status(200).json({ message: 'Syllabus added successfully' });
    } catch (error) {
      console.error('Error adding syllabus:', error);
      res.status(500).json({ message: 'Failed to add syllabus' });
    }
  });
  
  // Get syllabus by class name
  app.get('/api/get-syllabus', async (req, res) => {
    const { className } = req.query;
    try {
      const syllabus = await Syllabus.findOne({ className });
      if (!syllabus) {
        return res.status(404).json({ message: 'Syllabus not found for the specified class' });
      }
      res.status(200).json({ syllabus });
    } catch (error) {
      console.error('Error fetching syllabus:', error);
      res.status(500).json({ message: 'Failed to fetch syllabus' });
    }
  });


  app.post('/api/send-email', async (req, res) => {
    const { email, subject, body } = req.body;
  
    try {
      // Create a transporter using SMTP transport
      let transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com', // Your SMTP server hostname
        port: 465, // Your SMTP server port
        secure: true, // true for 465, false for other ports
        auth: {
          user: 'arpanrupareliya238@gmail.com', // Your email address
          pass: 'tlzf jcgh xptg fqzl', // Your email password
        },
      });
  
      // Send mail with defined transport object
      let info = await transporter.sendMail({
        from: '"Arpan Rupareliya" arpanrupareliya238@gmail.com', // sender address
        to: email, // list of receivers
        subject: subject, // Subject line
        text: body, // plain text body
      });
  
      console.log('Message sent: %s', info.messageId);
      res.status(200).json({ message: 'Email sent successfully!' });
    } catch (error) {
      console.error('Error sending email:', error);
      res.status(500).json({ error: 'Failed to send email.' });
    }
  });

  // Twilio credentials
const accountSid = 'AC476c70f4649b5c86ea23be192de7677b';
const authToken = '2de408ea2bb64fc6a8c792bad7e84c96';
const twilioPhoneNumber = '+12566009235'; // Your Twilio phone number

// Initialize Twilio client
const client = twilio(accountSid, authToken);

// Endpoint to send SMS
app.post('/api/send-sms', async (req, res) => {
  const { phoneNumber, message } = req.body;

  try {
    // Validate that 'phoneNumber' is provided
    if (!phoneNumber) {
      throw new Error("A 'To' phone number is required.");
    }

    // Format the phone number with '+91' for Indian numbers
    const formattedPhoneNumber = '+91' + phoneNumber;

    // Send SMS using Twilio
    const twilioResponse = await client.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: formattedPhoneNumber,
    });

    console.log('SMS sent successfully:', twilioResponse.sid);
    res.status(200).json({ message: 'SMS sent successfully!' });
  } catch (error) {
    console.error('Error sending SMS:', error.message);
    res.status(500).json({ error: 'Failed to send SMS.' });
  }
});
  
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
