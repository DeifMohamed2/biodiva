const User = require('../models/User');
const Chapter = require('../models/Chapter');

const waapi = require('@api/waapi');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const jwtSecret = process.env.JWTSECRET;
const waapiAPI = process.env.WAAPIAPI;
waapi.auth(`${waapiAPI}`);

const home_page = async (req, res) => {

  res.render('index', { title: 'Home Page' });
};

const getChaptersByGrade = async (req, res) => {
  const { grade } = req.query; // Extract grade from query params
  console.log('grade', grade);
  try {
    const chapters = await Chapter.find({
      chapterGrade: grade,
    }).sort({ createdAt: 1 });
    res.json(chapters); // Send the filtered chapters as JSON
  } catch (error) {
    console.error('Error fetching chapters by grade:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// const changeChapters = async (req, res) => {
// }

const public_login_get = (req, res) => {
  res.render('login', {
    title: 'Login Page',
    Email: '',
    Password: '',
    error: '',
  });
};

const public_login_post = async (req, res) => {
  try {
    const { phone, password } = req.body;

    const user = await User.findOne({ phone: phone});

    if (!user) {
      return res
        .status(401)
        .render('login', {
          title: 'Login Page',
          Email: '',
          Password: null,
          error: ' رقم الهاتف او كلمه المرور خاطئ او الاكونت غير مفعل',
        });
    }

    const isPasswordValid = await bcrypt.compare(password, user.Password);

    if (!isPasswordValid) {
      return res.status(401).render('login', {
        title: 'Login Page',
        Email: '',
        Password: null,
        error: ' رقم الهاتف او كلمه المرور خاطئ او الاكونت غير مفعل',
      });
    }

    const token = jwt.sign({ userId: user._id }, jwtSecret);
    res.cookie('token', token, { httpOnly: true });

    if (user.isTeacher) {
      return res.redirect('/teacher/dash');
    } else {
      return res.redirect('/student/dash');
      // if (user.subscribe) {
      // } else {
      //   return res.redirect('/login?StudentCode=' + user.Code);
      // }
    }
  } catch (error) {
    console.log(error);
    return res.status(500).redirect('/login');
  }
};

const public_Register_get = (req, res) => {
  const StudentCode = req.query.StudentCode;

  res.render('Register', {
    title: 'Login Page',
    formData: req.body,
    firebaseError: '',
    StudentCode,
  });
};

const public_Register_post = async (req, res) => {
  const {
    password,
    password2,
    Username,
    gov,
    Markez,
    schoolName,
    Grade,
    gender,
    phone,
    parentPhone,
  

  } = req.body;

  // Create an object to store validation errors
  const errors = {};

  if (password.length < 7) {
    req.body.Password = '';
    errors.password = '- كلمة المرور يجب ان لا تقل عن 7';
  }

  if (password !== password2) {
    req.body.Password = '';
    req.body.Password2 = '';
    errors.password = '- كلمة المرور غير متطابقة';
  }


  let Code = Math.floor(Math.random() * 400000 + 600000);

  // Check if the phone number has 11 digits
  // if (phone.length !== 222) {
  //   req.body.phone = '';
  //   errors.phone = '- رقم الهاتف يجب ان يحتوي علي 11 رقم';
  // }

  // Check if the parent's phone number has 11 digits
  // if (parentPhone.length !== 11) {
  //   req.body.parentPhone = '';
  //   errors.parentPhone = '- رقم هاتف ولي الامر يجب ان يحتوي علي 11 رقم';
  // }

  // Check if phone is equal to parentPhone
  if (phone === parentPhone) {
    // Clear the phone and parentPhone fields in the form data
    req.body.phone = '';
    req.body.parentPhone = '';

    // Set an error message for this condition
    errors.phone = '- رقم هاتف الطالب لا يجب ان يساوي رقم هاتف ولي الامر';
  }
  if (!gov) {
    errors.gov = '- يجب اختيار محافظة';
  }
  if (!Grade) {
    errors.Grade = '- يجب اختيار الصف الدراسي';
  }

  if (!Markez) {
    errors.Markez = '- يجب اختيار المركز';
  }
  if (!schoolName) {
    errors.schoolName = '- يجب ادخال اسم المدرسة';

  }
  console.log('req.body', req.body);

  console.log('errors', errors);

  if (Object.keys(errors).length > 0) {
    return res.render('Register', {
      title: 'Register Page',
      errors: errors,
      firebaseError: '',
      formData: req.body, // Pass the form data back to pre-fill the form
    });
  }



  // auth Of jwt

  let quizesInfo = [];
  let videosInfo = [];

  if (Grade === 'Grade1') {
    await User.findOne({ Grade: Grade, Code: 792605 }).then((result) => {
      quizesInfo = result.quizesInfo;
      videosInfo = result.videosInfo;
    });
  } else if (Grade === 'Grade2') {
    await User.findOne({ Grade: Grade, Code: 844488 }).then((result) => {
      quizesInfo = result.quizesInfo;
      videosInfo = result.videosInfo;
    });
  } else if (Grade === 'Grade3') {
    await User.findOne({ Grade: Grade, Code: 716589 }).then((result) => {
      quizesInfo = result.quizesInfo;
      videosInfo = result.videosInfo;
    });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const user = new User({
      Username: Username,
      Password: hashedPassword,
      PasswordWithOutHash: password,
      gov: gov,
      Markez: Markez,
      schoolName: schoolName,
      Grade: Grade,
      gender: 'male',
      phone: phone,
      parentPhone: parentPhone,
      place: 'online',
      Code: Code,
      subscribe: false,
      quizesInfo: quizesInfo,
      videosInfo: videosInfo,
      totalScore: 0,
      examsEnterd: 0,
      totalQuestions: 0,
      totalSubscribed: 0,
      isTeacher: false,
      ARorEN: 'AR',
      chaptersPaid: [],
      videosPaid: [],
      examsPaid: [],
      // Add other fields as needed
    });
    user
      .save()
      .then((result) => {
        res
          .status(201)
          .redirect('Register?StudentCode=' + encodeURIComponent(Code));
      })
      .catch((error) => {
        if (error.name === 'MongoServerError' && error.code === 11000) {
          // Duplicate key error
          errors.emailDub = 'هذا الرقم مستخدم من قبل';
          // Handle the error as needed
          res.render('Register', {
            title: 'Register Page',
            errors: errors,
            firebaseError: '',
            formData: req.body, // Pass the form data back to pre-fill the form
          });
        } else {
          // Handle other errors
          console.error(error);
          res.status(500).json({ message: 'Internal Server Error' });
        }
      });
  } catch (error) {
    if (error.name === 'MongoServerError' && error.code === 11000) {
      // Duplicate key error
      errors.emailDub = 'This email is already in use.';
      // Handle the error as needed
      res.status(409).json({ message: 'User already in use' });
    } else {
      // Handle other errors
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }
};

const send_verification_code = async (req, res) => {
  try {
    const { phone } = req.body;
    const code = Math.floor(Math.random() * 400000 + 600000);
    const message = `كود التحقق الخاص بك هو ${code}`;

    // Send the message via the waapi (already present)
    await waapi
      .postInstancesIdClientActionSendMessage(
        {
          chatId: `2${phone}@c.us`,
          message: message,
        },
        { id: '21299' }
      )

      .then(({ data }) => {
        // Store the verification code and phone in the session or database
        req.session.verificationCode = code; // Assuming session middleware is used
        req.session.phone = phone;

        // Send a successful response after setting the session
        res.status(201).json({ success: true, data });
      })
      .catch((err) => {
        // Handle any error that occurs during the waapi call
        console.error(err);
        res.status(500).json({ success: false, error: err });
      });
  } catch (error) {
    console.log(error);
    res.status(500).send('Internal Server Error');
  }
};

const forgetPassword_get = (req, res) => {
  res.render('forgetPassword', {
    title: 'Forget Password',
    error: null,
    success: null,
  });
};

const forgetPassword_post = async (req, res) => {
  try {
    const { phone } = req.body;

    const user = await User.findOne({
      $or: [{ phone: phone }],
    });

    if (!user && phone) {
      res.render('forgetPassword', {
        title: 'Forget Password',
        error: 'لا يوجد حساب لهذا الايميل او رقم الهاتف',
        success: null,
      });
      return '';
    } else if (user && phone) {
      const secret = jwtSecret + user.Password;
      const token = jwt.sign({ phone: phone, _id: user._id }, secret, {
        expiresIn: '15m',
      });
      const link = `http://localhost:3000/reset-password/${user._id}/${token}`;

      console.log('aerd', link, postData);

      return '';
    }
  } catch (error) {
    console.log(error);
    res.status(500).send('Internal Server Error'); // Handle other errors
  }

  res.render('forgetPassword', {
    title: 'Forget Password',
    error: null,
    success: null,
  });
};

const reset_password_get = async (req, res) => {
  try {
    const { id, token } = req.params;

    const user = await User.findOne({ _id: id });
    if (!user) {
      res.send('invalid Id....');
      return;
    }
    const secret = jwtSecret + user.Password;
    const payload = jwt.verify(token, secret);
    res.render('reset-password', { phone: user.phone, error: null });
  } catch (error) {
    res.send(error.message);
  }
};

const reset_password_post = async (req, res) => {
  try {
    const { id, token } = req.params;
    const { password1, password2 } = req.body;
    const user = await User.findOne({ _id: id });
    if (!user) {
      res.send('invalid Id....');
      return;
    }
    if (password1 === password2) {
      const secret = jwtSecret + user.Password;
      const payload = jwt.verify(token, secret);
      const hashedPassword = await bcrypt.hash(password1, 10);
      await User.findByIdAndUpdate({ _id: id }, { Password: hashedPassword })
        .then(() => {
          res.redirect('/login');
        })
        .catch((error) => {
          res.send(error.message);
        });
    } else {
      res.render('reset-password', {
        phone: user.phone,
        error: 'لازم يكونو شبه بعض',
      });
    }
  } catch (error) {
    res.send(error.message);
  }
};

module.exports = {
  home_page,
  getChaptersByGrade,
  public_login_get,
  public_Register_get,
  public_Register_post,
  send_verification_code,
  public_login_post,
  forgetPassword_get,
  forgetPassword_post,
  reset_password_get,
  reset_password_post,
};
