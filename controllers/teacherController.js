const Quiz = require('../models/Quiz');
const User = require('../models/User');
const Chapter = require('../models/Chapter');
const Code = require('../models/Code');
const Card = require('../models/Card');
const PDF = require('../models/PDFs');
const Attendance = require('../models/Attendance');
const mongoose = require('mongoose');
const waapi = require('@api/waapi');
const waapiAPI = process.env.WAAPIAPI;
const instanceID = process.env.instanceId;
waapi.auth(`${waapiAPI}`);

const Excel = require('exceljs');

const { v4: uuidv4 } = require('uuid');
const { result } = require('lodash');

const dash_get = async (req, res) => {

//   User.updateMany({}, {
//     $set: {
//       quizesInfo: []
//     }
// }).then((result) => {
//     console.log(result);
// }).catch((error) => {
// });

  //   const idsToKeep = [
  //     "65e4cfe6022bba8f9ed4a80f",
  //     "65e4d024022bba8f9ed4a811",
  //     "65e4d045022bba8f9ed4a813",
  //     "65eb2856a76c472e4fa64fd3",
  //     "65e8fd8449a3eecaa4593bd3"
  // ];
  //   User.deleteMany({ _id: { $nin: idsToKeep } })
  //   .then(result => {
  //       console.log(`${result.deletedCount} users deleted.`);
  //   })
  //   .catch(error => {
  //       console.error("Error deleting users:", error);
  //   });


  // const users = await User.updateMany
  // ({}, {
  //   $set: {
  //     quizesInfo: [],
  //     videosInfo: [],
  //     chaptersPaid: [],
  //     videosPaid: [],
  //     examsPaid: [],
  //     PDFsPaid: []
  //   }
  // });

  // Quiz.findById('6762da4ad29f724bc18fd9f9').then(quiz1 => {
  //   Quiz.findById('6762eea1d29f724bc18fe3d5').then(quiz2 => {
  //     const tempQuestions = quiz1.Questions;
  //     quiz1.Questions = quiz2.Questions;
  //     quiz2.Questions = tempQuestions;

  //     Promise.all([quiz1.save(), quiz2.save()])
  //       .then(() => {
  //         console.log('Questions swapped successfully');
  //       })
  //       .catch(error => {
  //         console.error('Error saving quizzes:', error);
  //       });
  //   }).catch(error => {
  //     console.error('Error finding quiz2:', error);
  //   });
  // }).catch(error => {
  //   console.error('Error finding quiz1:', error);
  // });

  res.render('teacher/dash', { title: 'DashBoard', path: req.path });
};

const myStudent_get = (req, res) => {
  res.render('teacher/myStudent', {
    title: 'Mystudent',
    path: req.path,
    userData: null,
    attendance: null,
  });
};

const homeWork_get = (req, res) => {
  res.render('teacher/homeWork', { title: 'HomeWork', path: req.path });
};

// const studentsRequests_get = (req, res) => {
//   res.render("teacher/studentsRequests", { title: "StudentsRequests", path: req.path });
// };

// =================================================== Add Video ================================================ //

const addVideo_get = (req, res) => {
  res.render('teacher/addVideo', {
    title: 'AddVideo',
    path: req.path,
    chaptersData: null,
  });
};

const chapter_post = (req, res) => {
  const {
    chapterName,
    chapterGrade,
    chapterAccessibility,
    chapterPrice,
    ARorEN,
  } = req.body;

  const chapter = new Chapter({
    chapterName: chapterName || '',
    chapterGrade: chapterGrade || '',
    chapterAccessibility: chapterAccessibility || ' ',
    chapterPrice: chapterPrice || 0,
    ARorEN: ARorEN,
    chapterLectures: [],
    chapterSummaries: [],
    chapterSolvings: [],
  });

  if (!chapterName || !chapterGrade || !chapterAccessibility || !ARorEN) {
    return res.status(400).send('Missing required fields');
  }

  chapter.save().then((result) => {
    console.log(result._id);
    res.redirect('/teacher/addVideo');
  });
};

const getAllChapters = async (req, res) => {
  try {
    const data = [];
    const { chapterGrade } = req.body;
    await Chapter.find({
      chapterGrade: chapterGrade,
    }).then((result) => {
      console.log(result);
      result.forEach((cahpter) => {
        data.push({
          chapterName: cahpter.chapterName,
          chapterId: cahpter._id,
          chapterLectures: cahpter.chapterLectures,
        });
      });
      res.status(200).render('teacher/addVideo', {
        title: 'AddVideo',
        path: req.path,
        chaptersData: data,
      });
    });
  } catch (error) {
    console.log(error);
  }
};

const addVideo_post = async (req, res) => {
  try {
    const {
      ChaptersIds,
      VideoType,
      videoTitle,
      paymentStatus,
      prerequisites,
      permissionToShow,
      AccessibleAfterViewing,
      videoAllowedAttemps,
      videoPrice,
      imgURL,
      videoURL,
    } = req.body;

    // Validate input data
    if (!ChaptersIds || !VideoType || !videoTitle || !paymentStatus) {
      throw new Error('Missing required fields');
    }

    if (imgURL == '' || videoURL == '') {
      throw new Error('Missing required fields');
    }
    // Generate unique ID for video object
    const videoId = uuidv4();

    const currentDate = new Date();
    // Create video object
    const VideoObject = {
      _id: videoId,
      videoTitle: videoTitle || '',
      paymentStatus: paymentStatus || '',
      prerequisites: prerequisites || '',
      permissionToShow: permissionToShow || '',
      AccessibleAfterViewing: AccessibleAfterViewing || '',
      videoAllowedAttemps: +videoAllowedAttemps || 0,
      videoPrice: videoPrice || 0,
      videoURL: videoURL || '',
      imgURL: imgURL || '',
    };

    const videosInfo = {};
    videosInfo['_id'] = videoId;
    videosInfo['prerequisites'] = prerequisites;
    videosInfo['createdAt'] = currentDate;
    videosInfo['updatedAt'] = currentDate;
    videosInfo['fristWatch'] = null;
    videosInfo['lastWatch'] = null;
    videosInfo['videoName'] = videoTitle;

    if (paymentStatus == 'Pay') {
      videosInfo['videoPurchaseStatus'] = false;
      videosInfo['isVideoPrepaid'] = true;
    } else {
      videosInfo['videoPurchaseStatus'] = true;
      videosInfo['isVideoPrepaid'] = false;
    }
    if (prerequisites == 'WithHw') {
      videosInfo['isUploadedHWApproved'] = false;
      videosInfo['videoAllowedAttemps'] = +videoAllowedAttemps;
      videosInfo['numberOfWatches'] = 0;
      videosInfo['isUserUploadPerviousHWAndApproved'] = false;
      videosInfo['isHWIsUploaded'] = false;
      videosInfo['isUserEnterQuiz'] = true;
      videosInfo['accessibleAfterViewing'] = AccessibleAfterViewing;
    } else if (prerequisites == 'WithExam') {
      videosInfo['isUploadedHWApproved'] = false;
      videosInfo['videoAllowedAttemps'] = +videoAllowedAttemps;
      videosInfo['numberOfWatches'] = 0;
      videosInfo['isUserUploadPerviousHWAndApproved'] = true;
      videosInfo['isHWIsUploaded'] = false;
      videosInfo['isUserEnterQuiz'] = false;
      videosInfo['accessibleAfterViewing'] = '';
    } else if (prerequisites == 'WithExamaAndHw') {
      videosInfo['isUploadedHWApproved'] = false;
      videosInfo['videoAllowedAttemps'] = +videoAllowedAttemps;
      videosInfo['numberOfWatches'] = 0;
      videosInfo['isUserUploadPerviousHWAndApproved'] = false;
      videosInfo['isHWIsUploaded'] = false;
      videosInfo['isUserEnterQuiz'] = false;
      videosInfo['accessibleAfterViewing'] = AccessibleAfterViewing;
    } else {
      videosInfo['isUploadedHWApproved'] = false;
      videosInfo['videoAllowedAttemps'] = +videoAllowedAttemps;
      videosInfo['numberOfWatches'] = 0;
      videosInfo['isUserUploadPerviousHWAndApproved'] = true;
      videosInfo['isHWIsUploaded'] = false;
      videosInfo['isUserEnterQuiz'] = true;
      videosInfo['accessibleAfterViewing'] = '';
    }

    // Update chapter with video object
    await Chapter.findOneAndUpdate(
      { _id: ChaptersIds },
      { $push: { [`${VideoType}`]: VideoObject } }
    ).then((resultChapter) => {
      User.updateMany(
        { Grade: resultChapter.chapterGrade },
        {
          $push: {
            videosInfo: videosInfo,
          },
        },
        {
          upsert: true,
        }
      )
        .then((result) => {
          res.status(201).redirect('/teacher/addVideo');
        })
        .catch((error) => {
          res.send('error can you refresh and try again');
        });
    });
  } catch (error) {
    // Handle errors
    console.error('Error adding video:', error.message);
    res.status(500).redirect('/teacher/addVideo?error=true');
  }
};

// =================================================== END ADD Videos ================================================ //

// =================================================== Start Handle Videos ================================================ //

const handleVideos_get = (req, res) => {
  res.render('teacher/handleVideos', {
    title: 'Handle Videos',
    path: req.path,
    chaptersData: null,
    chapterData: null,
    videoData: null,
    nextPage: null,
    previousPage: null,
  });
};

const getAllChaptersInHandle = async (req, res) => {
  try {
    const data = [];
    const { chapterGrade } = req.body;
    await Chapter.find({
      chapterGrade: chapterGrade,
    }).then((result) => {
      result.forEach((cahpter) => {
        data.push({
          chapterName: cahpter.chapterName,
          chapterId: cahpter._id,
          chapterLectures: cahpter.chapterLectures,
        });
      });
      res.status(200).render('teacher/handleVideos', {
        title: 'AddVideo',
        path: req.path,
        chaptersData: data,
        chapterData: null,
        videoData: null,
        nextPage: null,
        previousPage: null,
      });
    });
  } catch (error) {
    console.log(error);
  }
};

let ChapterId;
const getChapterDataToEdit = async (req, res) => {
  try {
    let data = Object();
    const { ChaptersIds } = req.body;
    ChapterId = ChaptersIds;
    await Chapter.findById(ChaptersIds).then((result) => {
      data = {
        chapterName: result.chapterName,
        chapterAccessibility: result.chapterAccessibility,
        chapterPrice: result.chapterPrice,
        chapterLectures: result.chapterLectures,
        chapterSummaries: result.chapterSummaries,
        chapterSolvings: result.chapterSolvings,
      };

      res.status(200).render('teacher/handleVideos', {
        title: 'AddVideo',
        path: req.path,
        chapterData: data,
        chaptersData: null,
        videoData: null,
        nextPage: null,
        previousPage: null,
      });
    });
  } catch (error) {
    console.log(error);
  }
};

const editChapterData = async (req, res) => {
  try {
    const { chapterName, chapterAccessibility, chapterPrice } = req.body;
    const updateData = {
      chapterName: chapterName,
      chapterAccessibility: chapterAccessibility,
      chapterPrice: chapterPrice, // Example field to update
    };
    await Chapter.findByIdAndUpdate(ChapterId, updateData, { new: true })
      .then((result) => {
        res.status(200).redirect('/teacher/handleVideos');
        ChapterId = '';
      })
      .catch((err) => {
        console.log(err);
      });
  } catch (error) {
    console.log(error);
  }
};

let VideoID;
let videoType;
const getSingleVideoAllData = async (req, res) => {
  try {
    VideoID = req.params.videoCode;
    let videoData;
    let perPage = 300;
    let page = req.query.page || 1;
    console.log(page);
    Chapter.findOne(
      { _id: ChapterId },
      {
        chapterLectures: { $elemMatch: { _id: VideoID } },
        chapterSummaries: { $elemMatch: { _id: VideoID } },
        chapterSolvings: { $elemMatch: { _id: VideoID } },
        chapterGrade: 1,
      }
    )
      .then(async (result) => {
        if (!result) {
          // Handle the case where the Chapter document is not found
          console.log('Chapter not found');
          return res.status(404).send('Chapter not found');
        }

        if (result['chapterLectures'].length > 0) {
          videoData = result['chapterLectures'][0];
          videoType = 'chapterLectures';
        } else if (result['chapterSummaries'].length > 0) {
          videoData = result['chapterSummaries'][0];
          videoType = 'chapterSummaries';
        } else {
          videoData = result['chapterSolvings'][0];
          videoType = 'chapterSolvings';
        }

        const data = [];
        await Chapter.find({ chapterGrade: result.chapterGrade }).then(
          (result) => {
            result.forEach((cahpter) => {
              data.push({
                chapterName: cahpter.chapterName,
                chapterId: cahpter._id,
                chapterLectures: cahpter.chapterLectures,
              });
            });
          }
        );

        // let totalWatches = 0;
        // User.find({videosInfo: { $elemMatch: { _id: VideoID , numberOfWatches: { $gt: 0 } }}},{Username:1,Code:1,videosInfo:1}).then((result)=>{

        //   result.forEach(user => {
        //     user.videosInfo.forEach(videoInfo => {
        //       if (videoInfo._id === VideoID) {
        //         totalWatches += videoInfo.numberOfWatches;
        //       }
        //     });
        //   });

        // })

        await User.aggregate([
          {
            $match: {
              videosInfo: {
                $elemMatch: {
                  _id: VideoID,
                  numberOfWatches: { $gt: 0 },
                },
              },
            },
          },
          {
            $project: {
              Username: 1,
              Code: 1,
              videosInfo: 1,
            },
          },
          {
            $sort: {
              createdAt: 1,
            },
          },
        ])
          .skip(perPage * page - perPage)
          .limit(perPage)
          .exec()
          .then(async (result) => {
            result.forEach((user) => {
              // Filter the videosInfo array for each user
              user.videosInfo = user.videosInfo.filter(
                (videoInfo) => videoInfo._id === VideoID
              );
            });

            // Now you can add totalWatches to your videoData object
            videoData['totalWatches'] = result.length;
            videoData['VideoID'] = VideoID;
            videoData['usersWatchedData'] = result;

            const count = await User.countDocuments({});
            const nextPage = parseInt(page) + 1;
            const hasNextPage = nextPage <= Math.ceil(count / perPage);
            const hasPreviousPage = page > 1; // Check if current page is greater than 1
            res.render('teacher/handleVideos', {
              title: 'AddVideo',
              path: req.path,
              chapterData: null,
              chaptersData: data,
              videoData: videoData,

              // current: page,
              nextPage: hasNextPage ? nextPage : null,
              previousPage: hasPreviousPage ? page - 1 : null, // Calculate previous page
            });
          })
          .catch((error) => {
            console.error(error);
            // Handle the error here
          });
      })
      .catch((error) => {
        console.error(error);
      });
  } catch (error) {
    console.error(error);
  }
};

const updateVideoData = async (req, res) => {
  const {
    videoId,
    videoTitle,
    paymentStatus,
    prerequisites,
    permissionToShow,
    videoAllowedAttemps,
    AccessibleAfterViewing,
    videoPrice,
  } = req.body;

  try {
    const result = await Chapter.findOneAndUpdate(
      {
        _id: ChapterId,
        [`${videoType}._id`]: VideoID,
      },
      {
        $set: {
          [`${videoType}.$.videoTitle`]: videoTitle || '',
          [`${videoType}.$.paymentStatus`]: paymentStatus || '',
          [`${videoType}.$.prerequisites`]: prerequisites || '',
          [`${videoType}.$.permissionToShow`]: permissionToShow || '',
          [`${videoType}.$.videoAllowedAttemps`]: +videoAllowedAttemps || 0,
          [`${videoType}.$.AccessibleAfterViewing`]:
            AccessibleAfterViewing || '',
          [`${videoType}.$.videoPrice`]: videoPrice || 0,
        },
      },
      {
        new: true,
      }
    );

    User.updateMany(
      { Grade: result.chapterGrade },
      {
        $set: {
          'videosInfo.$[elem].videoPurchaseStatus':
            paymentStatus === 'Pay' ? false : true,
          'videosInfo.$[elem].isVideoPrepaid':
            paymentStatus === 'Pay' ? true : false,
          'videosInfo.$[elem].prerequisites': prerequisites,
          'videosInfo.$[elem].isUploadedHWApproved':
            prerequisites !== 'WithHw' && prerequisites !== 'WithExamaAndHw'
              ? true
              : false,
          'videosInfo.$[elem].videoAllowedAttemps': +videoAllowedAttemps,
          'videosInfo.$[elem].isUserUploadPerviousHWAndApproved':
            prerequisites !== 'WithHw' && prerequisites !== 'WithExamaAndHw'
              ? true
              : false,
          'videosInfo.$[elem].isHWIsUploaded': false,
          'videosInfo.$[elem].accessibleAfterViewing': AccessibleAfterViewing,
          'videosInfo.$[elem].isUserEnterQuiz':
            prerequisites !== 'WithExam' && prerequisites !== 'WithExamaAndHw'
              ? true
              : false,
        },
      },
      {
        new: true,
        arrayFilters: [{ 'elem._id': VideoID }],
      }
    ).then(() => {
      res.status(201).redirect(`/teacher/handleVideo/${VideoID}`);
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error updating video data');
  }
};

const addViewsToStudent = async (req, res) => {
  const videoId = req.params.VideoID;
  const userId = req.query.UserId;
  const { NumberOfWatchesWillAdded } = req.body;
  console.log(videoId);
  User.findOneAndUpdate(
    {
      _id: userId,
    },
    {
      $inc: {
        'videosInfo.$[elem].videoAllowedAttemps': +NumberOfWatchesWillAdded,
      },
    },
    {
      new: true,
      arrayFilters: [{ 'elem._id': videoId }], // Match the specific videoId within the videosInfo array
    }
  )
    .then((result) => {
      console.log(result);
      res.redirect(`/teacher/handleVideo/${VideoID}`);
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send('Internal Server Error');
    });
};

const convertToExcel = async (req, res) => {
  try {
    const videoId = req.params.VideoID;

    // Fetch user data
    const users = await User.aggregate([
      {
        $match: {
          videosInfo: {
            $elemMatch: {
              _id: videoId,
              numberOfWatches: { $gt: 0 },
            },
          },
        },
      },
      {
        $project: {
          Username: 1,
          Code: 1,
          phone: 1,
          parentPhone: 1,
        },
      },
      {
        $sort: {
          createdAt: 1,
        },
      },
    ]);
    console.log(users);
    // Create a new Excel workbook
    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet('Users Data');

    const headerRow = worksheet.addRow([
      '#',
      'User Name',
      'Student Code',
      'Student Phone',
      'Parent Phone',
    ]);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFF00' },
    };

    // Add user data to the worksheet with alternating row colors
    let c = 0;
    users.forEach((user) => {
      c++;
      const row = worksheet.addRow([
        c,
        user.Username,
        user.Code,
        user.phone,
        user.parentPhone,
      ]);
      // Apply alternating row colors
      if (c % 2 === 0) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'DDDDDD' },
        };
      }
    });

    const excelBuffer = await workbook.xlsx.writeBuffer();

    // Set response headers for file download
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=users_data.xlsx'
    );

    // Send Excel file as response
    res.send(excelBuffer);
  } catch (error) {
    console.error('Error generating Excel file:', error);
    res.status(500).send('Error generating Excel file');
  }
};

// =================================================== END Handle Videos ================================================ //

// =================================================== Student Requests ================================================ //

let query;
const studentsRequests_get = async (req, res) => {
  try {
    const { Grade, studentPlace } = req.query;
    let grade = Grade || 'Grade1';
    let StudentPlace = studentPlace || 'All';
    // Define the base query object
    query = { Grade: grade };

    // If studentPlace is not "All", include it in the query

    if (StudentPlace !== 'All') {
      query.place = StudentPlace;
    }

    let perPage = 50;
    let page = req.query.page || 1;

    await User.find(query, {
      Username: 1,
      Code: 1,
      createdAt: 1,
      updatedAt: 1,
      subscribe: 1,
    })
      .sort({ subscribe: 1, createdAt: 1 })
      .skip(perPage * page - perPage)
      .limit(perPage)
      .exec()

      .then(async (result) => {
        const count = await User.countDocuments({});
        const nextPage = parseInt(page) + 1;
        const hasNextPage = nextPage <= Math.ceil(count / perPage);
        const hasPreviousPage = page > 1; // Check if current page is greater than 1

        res.render('teacher/studentsRequests', {
          title: 'StudentsRequests',
          path: req.path,
          modalData: null,
          modalDelete: null,
          studentsRequests: result,
          studentPlace: StudentPlace,
          Grade: grade,
          isSearching: false,
          nextPage: hasNextPage ? nextPage : null,
          previousPage: hasPreviousPage ? page - 1 : null, // Calculate previous page
        });
      });
  } catch (error) {
    console.log(error);
  }
};

const searchForUser = async (req, res) => {
  const { searchBy, searchInput } = req.body;
  try {
    await User.find(
      { [`${searchBy}`]: searchInput },
      { Username: 1, Code: 1, createdAt: 1, updatedAt: 1, subscribe: 1 }
    ).then((result) => {
      res.render('teacher/studentsRequests', {
        title: 'StudentsRequests',
        path: req.path,
        modalData: null,
        modalDelete: null,
        studentsRequests: result,
        studentPlace: query.place || 'All',
        Grade: query.Grade,
        isSearching: true,
        nextPage: null,
        previousPage: null, // Calculate previous page
      });
    });
  } catch (error) {}
};

const converStudentRequestsToExcel = async (req, res) => {
  try {
    // Fetch user data
    const users = await User.find(query, {
      Username: 1,
      Email: 1,
      gov: 1,
      Markez: 1,
      gender: 1,
      phone: 1,
      WhatsApp: 1,
      parentPhone: 1,
      place: 1,
      Code: 1,
      createdAt: 1,
      updatedAt: 1,
      subscribe: 1,
    });

    // Create a new Excel workbook
    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet('Users Data');

    const headerRow = worksheet.addRow([
      '#',
      'User Name',
      'Student Code',
      'Student Phone',
      'Parent Phone',
      'Government',
      'Markez',
      'createdAt',
      'subscribe',
    ]);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFF00' },
    };

    // Add user data to the worksheet with alternating row colors
    let c = 0;
    users.forEach((user) => {
      c++;
      const row = worksheet.addRow([
        c,
        user.Username,
        user.Code,
        user.phone,
        user.WhatsApp,
        user.parentPhone,
        user.gov,
        user.Markez,
        user.createdAt.toLocaleDateString(),
        user.subscribe,
      ]);

      // Apply different fill color based on subscription status
      if (!user.subscribe) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF0000' },
        }; // Red fill for non-subscribed users
      } else if (c % 2 === 0) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'DDDDDD' },
        }; // Alternate fill color for subscribed users
      }
    });

    const excelBuffer = await workbook.xlsx.writeBuffer();

    // Set response headers for file download
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="UsersData.xlsx"`
    );

    // Send Excel file as response
    res.send(excelBuffer);
  } catch (error) {
    console.error('Error occurred:', error);
    res.status(500).send('An error occurred while generating Excel file.');
  }
};

const getSingleUserAllData = async (req, res) => {
  try {
    const studentID = req.params.studentID;
    await User.findOne(
      { _id: studentID },
      {
        Username: 1,
        Email: 1,
        gov: 1,
        Markez: 1,
        gender: 1,
        phone: 1,
        WhatsApp: 1,
        parentPhone: 1,
        place: 1,
        Code: 1,
        createdAt: 1,
        updatedAt: 1,
        subscribe: 1,
        PasswordWithOutHash: 1,
      }
    ).then((result) => {
      res.render('teacher/studentsRequests', {
        title: 'StudentsRequests',
        path: req.path,
        modalData: result,
        modalDelete: null,
        studentsRequests: null,
        studentPlace: query.place || 'All',
        Grade: query.Grade,
        isSearching: false,
        nextPage: null,
        previousPage: null, // Calculate previous page
      });
    });
  } catch (error) {}
};

const updateUserData = async (req, res) => {
  try {
    const {
      Username,
      Email,
      phone,
      parentPhone,
      WhatsApp,
      gov,
      Markez,
      subscribe,
    } = req.body;
    const studentID = req.params.studentID;
    let Subscribe;
    if (subscribe == 'true') {
      Subscribe = true;
    } else {
      Subscribe = false;
    }
    // Assuming you have a User model and you're using Mongoose
    const updatedUser = await User.findOneAndUpdate(
      { _id: studentID },
      {
        Username: Username,
        Email: Email,
        phone: phone,
        parentPhone: parentPhone,
        WhatsApp: WhatsApp,
        gov: gov,
        Markez: Markez,
        subscribe: Subscribe,
      },
      { new: true } // To return the updated document
    );

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Redirect to the desired page after successful update
    res
      .status(201)
      .redirect(
        `/teacher/studentsRequests?Grade=${query.Grade}&studentPlace=All`
      );
  } catch (error) {
    // Handle errors appropriately
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const confirmDeleteStudent = async (req, res) => {
  try {
    const studentID = req.params.studentID;
    res.render('teacher/studentsRequests', {
      title: 'StudentsRequests',
      path: req.path,
      modalData: null,
      modalDelete: studentID,
      studentsRequests: null,
      studentPlace: query.place || 'All',
      Grade: query.Grade,
      isSearching: false,
      nextPage: null,
      previousPage: null, // Calculate previous page
    });
  } catch (error) {}
};

const DeleteStudent = async (req, res) => {
  try {
    const studentID = req.params.studentID;
    if (!studentID) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    if (
      studentID == '668138aeebc1138a4277c47a' ||
      studentID == '668138edebc1138a4277c47c' ||
      studentID == '66813909ebc1138a4277c47e'
    ) {
      return res.status(400).json({ error: 'You can not delete this user' });
    }
    await User.findByIdAndDelete(studentID).then((result) => {
      res
        .status(200)
        .redirect(
          `/teacher/studentsRequests?Grade=${query.Grade}&studentPlace=All`
        );
    });
  } catch (error) {
    console.log(error);
  }
};
// =================================================== END Student Requests ================================================ //

// ===================================================  MyStudent ================================================ //

const searchToGetOneUserAllData = async (req, res) => {
  const { searchBy, searchInput } = req.query;

  try {
    const result = await User.findOne({ [`${searchBy}`]: searchInput });

    const attendance = await Card.findOne({ userId: result._id });

    res.render('teacher/myStudent', {
      title: 'Mystudent',
      path: req.path,
      userData: result,
      attendance: attendance.cardHistory,
    });
  } catch (error) {}
};

const convertToExcelAllUserData = async (req, res) => {
  const { studetCode } = req.params;
  console.log(studetCode);
  try {
    await User.findOne({ Code: +studetCode })
      .then(async (user) => {
        // Create a new Excel workbook
        const workbook = new Excel.Workbook();
        const worksheet = workbook.addWorksheet('Users Data');
        const Header = worksheet.addRow([`بيانات الطالب ${user.Username} `]);
        Header.getCell(1).alignment = { horizontal: 'center' }; // Center align the text
        Header.font = { bold: true, size: 16 };
        Header.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'DDDDDD' },
        };
        worksheet.mergeCells('A1:H1');
        worksheet.addRow();
        const headerRowUserBasicInfo = worksheet.addRow([
          'اسم الطالب',
          'كود الطالب ',
          'رقم هاتف الطالب',
          'رقم هاتف ولي الامر',
        ]);
        headerRowUserBasicInfo.font = { bold: true };
        headerRowUserBasicInfo.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFF00' },
        };

        // Add user data to the worksheet with alternating row colors

        const rowUserBasicInfo = worksheet.addRow([
          user.Username,
          user.Code,
          user.phone,
          user.parentPhone,
        ]);
        rowUserBasicInfo.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'DDDDDD' },
        };

        const headerRowUserVideoInfo = worksheet.addRow([
          '#',
          'اسم الفيديو',
          'عدد مرات المشاهده',
          'عدد المشاهدات المتبقيه ',
          'تاريخ اول مشاهده ',
          'تاريخ اخر مشاهده ',
          'رفع الواجب ',
          'حل الامتحان ',
          'حاله الشراء ',
        ]);
        headerRowUserVideoInfo.font = { bold: true };
        headerRowUserVideoInfo.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '9fea0c' },
        };
        let c = 0;

        user['videosInfo'].forEach((data) => {
          c++;
          let homeWork, Exam;
          if (data.prerequisites == 'WithOutExamAndHW') {
            homeWork = 'لا يوجد';
            Exam = 'لا يوجد';
          } else if (data.prerequisites == 'WithExamaAndHw') {
            homeWork = data.isHWIsUploaded ? 'تم الرفع' : 'لم يُرفع';
            Exam = data.isUserEnterQuiz ? 'تم الدخول' : 'لم يدخل';
          } else if (data.prerequisites == 'WithHw') {
            homeWork = data.isHWIsUploaded ? 'تم الرفع' : 'لم يُرفع';
          } else {
            Exam = data.isUserEnterQuiz ? 'تم الدخول' : 'لم يدخل';
          }

          const headerRowUserVideoInfo = worksheet.addRow([
            c,
            data.videoName,
            data.numberOfWatches,
            data.videoAllowedAttemps,
            new Date(data.fristWatch).toLocaleDateString() || 'لم يشاهد بعد',
            new Date(data.lastWatch).toLocaleDateString() || 'لم يشاهد بعد',
            homeWork,
            Exam,
            data.isVideoPrepaid
              ? data.videoPurchaseStatus
                ? 'تم الشراء'
                : 'لم يتم الشراء'
              : 'الفيديو مجاني',
          ]);

          if (c % 2 === 0) {
            headerRowUserVideoInfo.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'DDDDDD' },
            };
          }
        });
        const headerRowUserQuizInfo = worksheet.addRow([
          '#',
          'اسم الامتحان',
          'تاريخ الحل ',
          'مده الحل ',
          ' درجه الامتحان ',
          'حاله الشراء ',
        ]);
        headerRowUserQuizInfo.font = { bold: true };
        headerRowUserQuizInfo.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '10a1c2' },
        };

        let cq = 0;
        user['quizesInfo'].forEach((data) => {
          cq++;
          const headerRowUserQuizInfo = worksheet.addRow([
            cq,
            data.quizName,
            new Date(data.solvedAt).toLocaleDateString() || 'لم يحل',
            data.solveTime || 'لم يحل',
            data.questionsCount + '/' + data.score,
            data.isQuizPrepaid
              ? data.quizPurchaseStatus
                ? 'تم الشراء'
                : 'لم يتم الشراء'
              : 'الامتحان مجاني',
          ]);
          if (cq % 2 === 0) {
            headerRowUserQuizInfo.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'DDDDDD' },
            };
          }
        });

        const excelBuffer = await workbook.xlsx.writeBuffer();

        // Set response headers for file download
        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
          'Content-Disposition',
          'attachment; filename=users_data.xlsx'
        );

        // Send Excel file as response
        res.send(excelBuffer);
      })
      .catch((error) => {
        console.log(error);
      });
  } catch (error) {
    console.log(error);
  }
};

// =================================================== END MyStudent ================================================ //

// =================================================== Add Quiz ================================================ //

let grade;
let quizQuestions = [];
let getQuizAllData;
const addQuiz_get = async (req, res) => {
  const videoData = [];
  const quizData = [];
  getQuizAllData = null;
  quizQuestions = [];
  const { Grade } = req.query;
  grade = Grade;
  await Chapter.find({
    chapterGrade: Grade,
  }).then(async (result) => {
    result.forEach((cahpter) => {
      videoData.push({
        chapterLectures: cahpter.chapterLectures,
      });
    });

    await Quiz.find({
      Grade: Grade,
    }).then((result) => {
      result.forEach((quiz) => {
        quizData.push({
          quizName: quiz.quizName,
          _id: quiz._id,
        });
      });
    });
  });

  res.render('teacher/addQuiz', {
    title: 'AddQuiz',
    path: req.path,
    questions: quizQuestions,
    videoData: videoData,
    quizData: quizData,
    Grade: Grade,
    getQuizAllData: getQuizAllData || null,
  });
};

const addQuestion = (req, res) => {
  const { Qtitle, answer1, answer2, answer3, answer4, ranswer, questionPhoto } =
    req.body;

  const Code = Math.floor(Math.random() * 1000) + 6000;

  let question = {};

  question = {
    questionPhoto: questionPhoto,
    qNumber: quizQuestions.length + 1,
    title: Qtitle,
    answer1: answer1,
    answer2: answer2,
    answer3: answer3,
    answer4: answer4,
    ranswer: ranswer,
    code: +Code,
  };

  quizQuestions.push(question);
  res.render('teacher/addQuiz', {
    title: 'AddQuiz',
    path: req.path,
    questions: quizQuestions,
    videoData: null,
    quizData: null,
    Grade: null,
    getQuizAllData: getQuizAllData || null,
  });
};

const deleteQuestion = (req, res) => {
  const id = req.params.code;
  console.log(id);
  // Find the index of the question with the matching code
  const indexToDelete = quizQuestions.findIndex(
    (question) => question.code === parseInt(id)
  );

  if (indexToDelete !== -1) {
    // If a question with the matching code is found, remove it from the array
    quizQuestions.splice(indexToDelete, 1);
  }

  res.render('teacher/addQuiz', {
    title: 'AddQuiz',
    path: req.path,
    questions: quizQuestions,
    videoData: null,
    quizData: null,
    Grade: null,
    getQuizAllData: getQuizAllData || null,
  });
};

const updateQuestion = (req, res) => {
  const {
    Qtitle,
    answer1,
    answer2,
    answer3,
    answer4,
    ranswer,
    code,
    questionPhoto,
  } = req.body;

  // Find the index of the question with the matching code
  const indexToUpdate = quizQuestions.findIndex(
    (question) => question.code === parseInt(code)
  );

  if (indexToUpdate !== -1) {
    // If a question with the matching code is found, update its properties
    quizQuestions[indexToUpdate] = {
      questionPhoto: questionPhoto,
      title: Qtitle,
      qNumber: quizQuestions[indexToUpdate].qNumber,
      answer1: answer1,
      answer2: answer2,
      answer3: answer3,
      answer4: answer4,
      ranswer: ranswer,
      code: +code,
    };
  }

  res.render('teacher/addQuiz', {
    title: 'AddQuiz',
    path: req.path,
    questions: quizQuestions,
    videoData: null,
    quizData: null,
    Grade: null,
    getQuizAllData: getQuizAllData || null,
  });
};

const getQuizAlldata = async (req, res) => {
  try {
    const { quizId } = req.query;

    const quiz = await Quiz.findOne({ _id: quizId });
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    res.status(200).json({
      questions: quiz.Questions,
      getQuizAllData: quiz,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error });
  }
};


const deleteQuiz = (req, res) => {
  try {
    const { quizID } = req.params;
    console.log(quizID);
    let QuizID = new mongoose.Types.ObjectId(quizID);
    User.updateMany(
      { 'quizesInfo.quizId': QuizID }, // Match users where the quiz is present in quizesInfo array
      { $pull: { quizesInfo: { quizId: QuizID } } } // Pull the quiz from quizesInfo array
    ).then((result) => {
      console.log(result);
      Quiz.findByIdAndDelete({ _id: quizID })
        .then(() => {
          res.redirect('/teacher/addQuiz');
        })
        .catch((error) => {
          res.send(error.message);
        });
    });
  } catch (error) {}
};

const updateQuiz = (req, res) => {
  try {
    const { quizID } = req.params;
    const { quizStatus, permissionToShow, quizName, timeOfQuiz ,questions } = req.body;
    console.log(quizID, quizStatus, permissionToShow);
    let updatedDate = {};
    if (quizStatus == 'Active') {
      updatedDate['isQuizActive'] = true;
    } else {
      updatedDate['isQuizActive'] = false;
    }

    if (permissionToShow == 'apper') {
      updatedDate['permissionToShow'] = true;
    } else {
      updatedDate['permissionToShow'] = false;
    }
    updatedDate['Questions'] = quizQuestions;
    updatedDate['quizName'] = quizName;
    updatedDate['timeOfQuiz'] = timeOfQuiz;
    updatedDate['Questions'] = questions;

    Quiz.findByIdAndUpdate({ _id: quizID }, updatedDate).then(() => {
      res.status(200).send({message: 'تم تعديل الامتحان بنجاح'});
    });
  } catch (error) {}
};

const quizSubmit = (req, res) => {
  const {
    quizName,
    timeOfQuiz,
    Grade,
    prepaidStatus,
    questions,
    sampleQuestions,
  } = req.body;
  const quiz = new Quiz({
    quizName,
    timeOfQuiz,
    Grade,
    prepaidStatus: prepaidStatus == 'Pay' ? true : false,
    Questions: questions,
    sampleQuestions,
  });
  console.log(quiz);
  try{
    quiz.save().then(()=>{
      User.updateMany(
        { Grade: Grade },
        {
          $push: {
            quizesInfo: {
              quizId: quiz._id,
              quizName: quizName,

              questionsCount: sampleQuestions,
            },
          },
        }
      ).then(() => {
        // return res
        // .status(404)
        // .json({ message: 'تم رفع الامتحان بنجاج' });
        console.log('done');
        res.status(200).send({ message: 'تم رفع الامتحان بنجاح' });
      });
    })
  }catch(error){
    console.log(error);
    res.status(200).send({ message: 'تم رفع الامتحان بنجاح' });

  }
};

// =========================================== END Add Quiz =================================================== //

// =================================================== Handle Quizzes ================================================ //

let quizGrade;
let QuizId;
const handleQuizzes = (req, res) => {
  quizGrade = null;
  QuizId = null;
  res.render('teacher/handleQuizzes', {
    title: 'handleQuizzes',
    path: req.path,
    quizzesNamesData: null,
    studetsData: null,
    quizID: null,
    nextPage: null,
    previousPage: null,
    isSearching: false,
  });
};

const getQuizzesNames = async (req, res) => {
  try {
    const { Grade } = req.query;
    quizGrade = Grade;
    await Quiz.find({ Grade: Grade }, { quizName: 1 }).then((result) => {
      console.log(result);
      res.render('teacher/handleQuizzes', {
        title: 'handleQuizzes',
        path: req.path,
        quizzesNamesData: result,
        studetsData: null,
        quizID: null,
        nextPage: null,
        previousPage: null,
        isSearching: false,
      });
    });
  } catch (error) {}
};

const getStudentsDataOfQuiz = async (req, res) => {
  try {
    const { quizID } = req.query;
    let perPage = 10000;
    let page = req.query.page || 1;

    const objectId = new mongoose.Types.ObjectId(quizID);
    QuizId = objectId;
    console.log(quizGrade, objectId, quizID);
    await User.aggregate([
      {
        $match: {
          Grade: quizGrade,
          quizesInfo: {
            $elemMatch: {
              quizId: objectId,
              isEnterd: true,
            },
          },
        },
      },
      {
        $project: {
          Username: 1,
          Code: 1,
          quizesInfo: 1,
          quizesInfo: {
            $filter: {
              input: '$quizesInfo',
              as: 'quiz',
              cond: {
                $eq: ['$$quiz.quizId', QuizId],
              },
            },
          },
        },
      },
      {
        $sort: {
          'quizesInfo.score': -1,
        },
      },
    ])
      .skip(perPage * page - perPage)
      .limit(perPage)
      .exec()
      .then(async (result) => {
        console.log(result);
        const count = await User.countDocuments({});
        const nextPage = parseInt(page) + 1;
        const hasNextPage = nextPage <= Math.ceil(count / perPage);
        const hasPreviousPage = page > 1; // Check if current page is greater than 1
        res.render('teacher/handleQuizzes', {
          title: 'handleQuizzes',
          path: req.path,
          quizzesNamesData: null,
          studetsData: result,
          quizID: quizID,
          nextPage: hasNextPage ? nextPage : null,
          previousPage: hasPreviousPage ? page - 1 : null,
          isSearching: false,
        });
      });
  } catch (error) {}
};

const searchForUserInQuiz = async (req, res) => {
  const { searchBy, searchInput } = req.query;
  try {
    console.log(searchBy, searchInput, QuizId);

    await User.aggregate([
      {
        $match: {
          [`${searchBy}`]: searchBy == 'Code' ? +searchInput : searchInput,
          quizesInfo: {
            $elemMatch: {
              quizId: QuizId,
            },
          },
        },
      },
      {
        $project: {
          Username: 1,
          Code: 1,
          quizesInfo: {
            $filter: {
              input: '$quizesInfo',
              as: 'quiz',
              cond: {
                $eq: ['$$quiz.quizId', QuizId],
              },
            },
          },
        },
      },
      {
        $sort: {
          createdAt: 1,
        },
      },
    ]).then((result) => {
      console.log(result.length);

      res.render('teacher/handleQuizzes', {
        title: 'handleQuizzes',
        path: req.path,
        quizzesNamesData: null,
        studetsData: result.length > 0 ? result : null,
        quizID: null,
        nextPage: null,
        previousPage: null,
        isSearching: true,
      });
    });
  } catch (error) {}
};

const convertToExcelQuiz = async (req, res) => {
  try {
    const users = await User.aggregate([
      {
        $match: {
          Grade: quizGrade,
          quizesInfo: {
            $elemMatch: {
              quizId: QuizId,
              isEnterd: true,
            },
          },
        },
      },
      {
        $project: {
          Username: 1,
          Code: 1,
          quizesInfo: 1,
          phone: 1,
          parentPhone: 1,
          quizesInfo: {
            $filter: {
              input: '$quizesInfo',
              as: 'quiz',
              cond: {
                $eq: ['$$quiz.quizId', QuizId],
              },
            },
          },
        },
      },
      {
        $sort: {
          'quizesInfo.score': -1,
        },
      },
    ]);

    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet('Users Data');

    const headerRow = worksheet.addRow([
      '#',
      'User Name',
      'Student Code',
      'Student Phone',
      'Parent Phone',
      'Quiz Grade',
    ]);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFF00' },
    };

    // Add user data to the worksheet with alternating row colors
    let c = 0;
    users.forEach((user) => {
      c++;
      const row = worksheet.addRow([
        c,
        user.Username,
        user.Code,
        user.phone,
        user.parentPhone,
        user['quizesInfo'][0]['score'],
      ]);
      // Apply alternating row colors
      if (c % 2 === 0) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'DDDDDD' },
        };
      }
    });

    const excelBuffer = await workbook.xlsx.writeBuffer();

    // Set response headers for file download
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=users_data.xlsx'
    );

    // Send Excel file as response
    res.send(excelBuffer);
  } catch (error) {
    console.error('Error generating Excel file:', error);
    res.status(500).send('Error generating Excel file');
  }
};

const changeEnterToQuiz = async (req, res) => {
  try {
    const quizID = req.params.quizID;
    const UserId = req.query.UserId;
    console.log(QuizId, UserId);
    const user = await User.findById(UserId);
    if (!user) {
      throw new Error('User not found');
    }

    const quiz = user.quizesInfo.find((q) => q.quizId.equals(QuizId));
    if (!quiz) {
      throw new Error('Quiz not found');
    }

    const newTotalscore = user.totalScore - quiz.score;

    User.findOneAndUpdate(
      {
        _id: UserId,
      },
      {
        'quizesInfo.$[elem].isEnterd': false,
        'quizesInfo.$[elem].inProgress': false,
        'quizesInfo.$[elem].solvedAt': null,
        'quizesInfo.$[elem].solveTime': null,
        'quizesInfo.$[elem].answers': [],
        'quizesInfo.$[elem].score': 0,
        'quizesInfo.$[elem].endTime': null,
        totalScore: newTotalscore,
      },
      {
        new: true,
        arrayFilters: [{ 'elem.quizId': QuizId }],
      }
    ).then((result) => {
      console.log(result);
      res.redirect(`/teacher/getStudentsDataOfQuiz?quizID=${QuizId}`);
    });
  } catch (error) {}
};

// =================================================== END Handle Quizzes ================================================ //

// =================================================== Codes ================================================ //

const Codes_get = (req, res) => {
  res.render('teacher/Codes', {
    title: 'Codes',
    path: req.path,
    data: null,
    Grade: null,
    type: null,
  });
};

let Type;
const getChptersOrVideosData = async (req, res) => {
  try {
    const { type, Grade } = req.query;
    Type = type;
    const data = [];

    if (Type == 'Chapter' || Type == 'Video') {
      await Chapter.find(
        { chapterGrade: Grade },
        {
          chapterName: 1,
          chapterAccessibility: 1,
          chapterLectures: 1,
          chapterSummaries: 1,
          chapterSolvings: 1,
        }
      ).then((result) => {
        result.forEach((resData) => {
          if (type == 'Chapter') {
            if (resData.chapterAccessibility == 'EnterInPay') {
              data.push({ Name: resData.chapterName, _id: resData._id });
            }
          } else if (type == 'Video') {
            resData['chapterLectures'].forEach((lec) => {
              if (lec.paymentStatus == 'Pay') {
                data.push({ Name: lec.videoTitle, _id: lec._id });
              }
            });
            resData['chapterSummaries'].forEach((sum) => {
              if (sum.paymentStatus == 'Pay') {
                data.push({ Name: sum.videoTitle, _id: sum._id });
              }
            });
            resData['chapterSolvings'].forEach((solv) => {
              if (solv.paymentStatus == 'Pay') {
                data.push({ Name: solv.videoTitle, _id: solv._id });
              }
            });
          }
        });

        res.render('teacher/Codes', {
          title: 'Codes',
          path: req.path,
          data: data,
          Grade: Grade,
          type: type,
        });
      });
    } else {
      await Quiz.find(
        { Grade: Grade },
        { quizName: 1, _id: 1, prepaidStatus: 1 }
      ).then((result) => {
        result.forEach((quiz) => {
          if (quiz.prepaidStatus) {
            data.push({ Name: quiz.quizName, _id: quiz._id });
          }
        });
        res.render('teacher/Codes', {
          title: 'Codes',
          path: req.path,
          data: data,
          Grade: Grade,
          type: type,
        });
      });
    }
  } catch (error) {}
};

const createSpecificCodes = async (req, res) => {
  try {
    req.io.emit('creatingSCodes', { nCodesFinished: 0, numberOfCodes: 0 });

    const { IDOfVideoOrChapter, numberOfCodes } = req.body;

    // Validate the inputs
    if (!IDOfVideoOrChapter || !numberOfCodes || !Type) {
      return res
        .status(400)
        .json({ message: 'Name and number of codes are required.' });
    }

    // Generate the specified number of codes
    const generatedCodes = [];
    for (let i = 0; i < +numberOfCodes; i++) {
      const code = generateCode(); // Function to generate code
      generatedCodes.push(code);
    }

    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet('Codes Data');

    const headerRow = worksheet.addRow(['#', 'Code']);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFF00' },
    };
    let c = 0;
    for (const code of generatedCodes) {
      // console.log(code)

      await Code.create({
        Code: code,
        isUsed: false,
        codeType: Type,
        codeFor: IDOfVideoOrChapter,
        usedBy: null,
        usedIn: null,
      }).then((result) => {
        console.log(result);
      });

      c++;
      req.io.emit('creatingSCodes', {
        nCodesFinished: c,
        numberOfCodes: numberOfCodes,
      });
      const row = worksheet.addRow([c, code]);
      // Apply alternating row colors
      if (c % 2 === 0) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'DDDDDD' },
        };
      }
    }

    // Add user data to the worksheet with alternating row colors

    const excelBuffer = await workbook.xlsx.writeBuffer();

    // Set response headers for file download
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=Codes_data.xlsx'
    );

    // Send Excel file as response
    res.send(excelBuffer);
  } catch (error) {
    return res
      .status(400)
      .json({ message: `back and Re make the request again please ${error}` });
  }
};

const createGeneralCodes = async (req, res) => {
  try {
    req.io.emit('creatingCodes', { code: 0 });
    const { numberOfCodes } = req.body;

    // Validate the inputs
    if (!numberOfCodes) {
      return res
        .status(400)
        .json({ message: 'Name and number of codes are required.' });
    }

    // Generate the specified number of codes
    const generatedCodes = [];
    for (let i = 0; i < +numberOfCodes; i++) {
      const code = generateCode(); // Function to generate code
      generatedCodes.push(code);
    }

    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet('Codes Data');

    const headerRow = worksheet.addRow(['#', 'Code']);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFF00' },
    };
    let c = 0;
    for (const code of generatedCodes) {
      // console.log(code)

      await Code.create({
        Code: code,
        isUsed: false,
        codeType: 'General',
        codeFor: null,
        usedBy: null,
        usedIn: null,
      }).then((result) => {
        console.log(result);
      });

      c++;
      req.io.emit('creatingCodes', {
        nCodesFinished: c,
        numberOfCodes: numberOfCodes,
      });

      const row = worksheet.addRow([c, code]);
      // Apply alternating row colors
      if (c % 2 === 0) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'DDDDDD' },
        };
      }
    }

    // Add user data to the worksheet with alternating row colors

    const excelBuffer = await workbook.xlsx.writeBuffer();

    // Set response headers for file download
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=Codes_data.xlsx'
    );

    // Send Excel file as response
    res.send(excelBuffer);
  } catch (error) {
    return res
      .status(400)
      .json({ message: `back and Re make the request again please ${error}` });
  }
};

function generateCode() {
  // Generate a UUID
  const uuid = uuidv4();

  // Extract only the numbers from the UUID
  const numbers = uuid.replace(/\D/g, '');

  // Take the first 10 digits
  const code = numbers.substring(0, 12);

  return code;
}

// =================================================== END Codes ================================================ //

// =================================================== Handel Codes ================================================ //
let t, g, n;
const handelCodes_get = async (req, res) => {
  try {
    const { type, Grade, name, excel } = req.query;
    t = type;
    g = Grade;
    n = name;
    let perPage = 50;
    let page = req.query.page || 1;

    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet('Codes Data');

    const headerRow = worksheet.addRow([
      '#',
      'الكود',
      'حاله الاستخدام',
      'كود المستخدم',
      '	استخدم في ',
      'تاريخ الاستخدام',
    ]);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFF00' },
    };

    const data = [];
    await Chapter.find(
      { chapterGrade: Grade },
      {
        chapterName: 1,
        chapterAccessibility: 1,
        chapterLectures: 1,
        chapterSummaries: 1,
        chapterSolvings: 1,
      }
    ).then((result) => {
      result.forEach((resData) => {
        if (type == 'Chapter') {
          if (resData.chapterAccessibility == 'EnterInPay') {
            data.push({ Name: resData.chapterName, _id: resData._id });
          }
        } else {
          resData['chapterLectures'].forEach((lec) => {
            if (lec.paymentStatus == 'Pay') {
              data.push({ Name: lec.videoTitle, _id: lec._id });
            }
          });
          resData['chapterSummaries'].forEach((sum) => {
            if (sum.paymentStatus == 'Pay') {
              data.push({ Name: sum.videoTitle, _id: sum._id });
            }
          });
          resData['chapterSolvings'].forEach((solv) => {
            if (solv.paymentStatus == 'Pay') {
              data.push({ Name: solv.videoTitle, _id: solv._id });
            }
          });
        }
      });
    });

    if (excel) {
      if (type == 'General') {
        await Code.find({ codeType: type })
          .sort({ isUsed: 1 })

          .then(async (Codes) => {
            let c = 0;
            Codes.forEach((code) => {
              c++;
              const row = worksheet.addRow([
                c,
                code.Code,
                code.isUsed ? 'مستخدم' : 'غير مستخدم',
                code.usedBy || 'غير مستخدم',
                code.usedIn || 'غير مستخدم',
                code.createdAt.toLocaleDateString() ===
                code.updatedAt.toLocaleDateString()
                  ? 'غير مستخدم'
                  : code.updatedAt.toLocaleDateString(),
              ]);
              // Apply alternating row colors
              if (c % 2 === 0) {
                row.fill = {
                  type: 'pattern',
                  pattern: 'solid',
                  fgColor: { argb: 'DDDDDD' },
                };
              }
            });

            const excelBuffer = await workbook.xlsx.writeBuffer();
            // Set response headers for file download
            res.setHeader(
              'Content-Type',
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            );
            res.setHeader(
              'Content-Disposition',
              'attachment; filename=users_data.xlsx'
            );

            // Send Excel file as response
            res.send(excelBuffer);
          });
      } else if (type == 'Video' || type == 'Chapter') {
        res.render('teacher/handelCodes', {
          title: 'Codes',
          path: req.path,
          namesData: data,
          CodesData: null,
          type: type,
          Grade: Grade,
          name: null,
          nextPage: null,
          previousPage: null,
          currentPage: null,
        });
      } else {
        if (name) {
          await Code.find({ codeFor: name })
            .sort({ isUsed: 1 })

            .then(async (Codes) => {
              let c = 0;
              Codes.forEach((code) => {
                c++;
                const row = worksheet.addRow([
                  c,
                  code.Code,
                  code.isUsed ? 'مستخدم' : 'غير مستخدم',
                  code.usedBy || 'غير مستخدم',
                  code.usedIn || 'غير مستخدم',
                  code.createdAt.toLocaleDateString() ===
                  code.updatedAt.toLocaleDateString()
                    ? 'غير مستخدم'
                    : code.updatedAt.toLocaleDateString(),
                ]);
                // Apply alternating row colors
                if (c % 2 === 0) {
                  row.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'DDDDDD' },
                  };
                }
              });

              const excelBuffer = await workbook.xlsx.writeBuffer();
              // Set response headers for file download
              res.setHeader(
                'Content-Type',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
              );
              res.setHeader(
                'Content-Disposition',
                'attachment; filename=users_data.xlsx'
              );

              // Send Excel file as response
              res.send(excelBuffer);
            });
        } else {
          res.render('teacher/handelCodes', {
            title: 'handel Codes',
            path: req.path,
            namesData: null,
            CodesData: null,
            type: null,
            Grade: null,
            name: null,
            nextPage: null,
            previousPage: null,
            currentPage: null,
          });
        }
      }
    } else {
      if (type == 'General') {
        await Code.find({ codeType: type })
          .sort({ isUsed: 1 })
          .skip(perPage * page - perPage)
          .limit(perPage)
          .exec()
          .then(async (result) => {
            const count = await Code.countDocuments({});
            const nextPage = parseInt(page) + 1;
            const hasNextPage = nextPage <= Math.ceil(count / perPage);
            const hasPreviousPage = page > 1;
            res.render('teacher/handelCodes', {
              title: 'Codes',
              path: req.path,
              namesData: null,
              CodesData: result,
              type: type,
              Grade: null,
              name: null,
              nextPage: hasNextPage ? nextPage : null,
              previousPage: hasPreviousPage ? page - 1 : null,
              currentPage: page,
            });
          });
      } else if (type == 'Video' || type == 'Chapter') {
        res.render('teacher/handelCodes', {
          title: 'Codes',
          path: req.path,
          namesData: data,
          CodesData: null,
          type: type,
          Grade: Grade,
          name: null,
          nextPage: null,
          previousPage: null,
          currentPage: null,
        });
      } else {
        if (name) {
          await Code.find({ codeFor: name })
            .sort({ isUsed: 1 })
            .skip(perPage * page - perPage)
            .limit(perPage)
            .exec()
            .then(async (result) => {
              const count = await Code.countDocuments({});
              const nextPage = parseInt(page) + 1;
              const hasNextPage = nextPage <= Math.ceil(count / perPage);
              const hasPreviousPage = page > 1;

              res.render('teacher/handelCodes', {
                title: 'Codes',
                path: req.path,
                namesData: null,
                CodesData: result,
                type: null,
                Grade: null,
                name: name,
                nextPage: hasNextPage ? nextPage : null,
                previousPage: hasPreviousPage ? page - 1 : null,
                currentPage: page,
              });
            });
        } else {
          res.render('teacher/handelCodes', {
            title: 'handel Codes',
            path: req.path,
            namesData: null,
            CodesData: null,
            type: null,
            Grade: null,
            name: null,
            nextPage: null,
            previousPage: null,
            currentPage: null,
          });
        }
      }
    }
  } catch (error) {
    return res
      .status(400)
      .json({ message: `back and Re make the request again please ${error}` });
  }
};

const searchToGetCode = async (req, res) => {
  try {
    const { searchInput } = req.query;
    await Code.find({ Code: searchInput }).then((result) => {
      res.render('teacher/handelCodes', {
        title: 'Codes',
        path: req.path,
        namesData: null,
        CodesData: result,
        type: t || null,
        Grade: g || null,
        name: n || null,
        nextPage: null,
        previousPage: null,
        currentPage: null,
      });
    });
  } catch (error) {}
};

// ================================================== END Handel Codes ================================================ //

const PDFPost_get = (req, res) => {
  res.render('teacher/PDFPost', { title: 'PDFPost', path: req.path });
};

const PDFPost_post = async (req, res) => {
  const { pdfName, pdfLink, status, pdfGrade, price } = req.body;

  const pdf = new PDF({
    pdfName: pdfName,
    pdfLink: pdfLink,
    pdfStatus: status,
    pdfGrade: pdfGrade,
    pdfPrice: status == 'Free' ? 0 : price,
  });
  pdf
    .save()
    .then((result) => {
      res.redirect('/teacher/PDFPost');
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('An error occurred while saving the pdf.');
    });
};

// =================================================== Add Card  &&  Attendance =================================================== //
const addCardGet = async (req, res) => {
  res.render('teacher/addCard', { title: 'addCard', path: req.path });
};

const addCardToStudent = async (req, res) => {
  const { studentCode, assignedCard } = req.body;

  // Check for missing fields
  if (!studentCode || !assignedCard) {
    return res
      .status(400)
      .json({
        message: 'studentCode and assignedCard are required',
        Username: null,
      });
  }

  try {
    const userByCode = await User.findOne(
      { Code: studentCode },
      { Username: 1, Code: 1 }
    );
    if (!userByCode) {
      return res
        .status(400)
        .json({
          message: 'هاذا الطالب غير موجود تأكد من الكود',
          Username: null,
        });
    }

    const cardByCode = await Card.findOne({ userCode: userByCode.Code });
    if (cardByCode) {
      return res
        .status(400)
        .json({
          message: 'هاذا الطالب لديه بطاقه بالفعل',
          Username: userByCode.Username,
        });
    }

    const card = new Card({
      cardId: assignedCard,
      userId: userByCode._id,
      userCode: userByCode.Code,
    });
    card
      .save()
      .then((result) => {
        return res
          .status(200)
          .json({
            message: 'تم اضافه بيانات الكارت للطالب بنجاح',
            Username: userByCode.Username,
          });
      })
      .catch((err) => {
        console.error(err);
        return res
          .status(500)
          .json({ message: 'يبدو ان هناك خطأ ما ', Username: null });
      });
  } catch (error) {
    console.error('Error adding card:', error);
    return res
      .status(500)
      .json({ message: 'يبدو ان هناك خطأ ما ', Username: null });
  }
};

const getAttendedUsers = async (req, res) => {
  const { CardGrade, centerName, GroupTime } = req.body;
  console.log(CardGrade, centerName, GroupTime);
  try {
    // Query the database to find the attendance record for the specified session
    const attendanceRecord = await Attendance.findOne({
      Grade: CardGrade,
      CenterName: centerName,
      GroupTime: GroupTime,
      Date: new Date().toISOString().split('T')[0], // Check attendance for today
    }).populate('Students', { Username: 1, Code: 1, phone: 1, parentPhone: 1 });

    if (!attendanceRecord) {
      return res
        .status(404)
        .json({ message: 'No attendance record found for this session.' });
    }

    // Return the list of attended students
    res.status(200).json({ students: attendanceRecord.Students });
  } catch (error) {
    console.error('Error fetching attended students:', error);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

const attendUser = async (req, res) => {
  const { CardGrade, centerName, GroupTime, CardType, attendeeID } = req.body;

  if (!CardGrade || !centerName || !GroupTime || !CardType || !attendeeID) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  let studentDataByCard;
  if (CardType == 'Card') {
    studentDataByCard = await Card.findOne({ cardId: attendeeID }).populate(
      'userId',
      {
        Username: 1,
        Code: 1,
        parentPhone: 1,
        phone: 1,
      }
    );
  } else if (CardType == 'Code') {
    studentDataByCard = await Card.findOne({
      userCode: attendeeID,
    }).populate('userId', {
      Username: 1,
      Code: 1,
      parentPhone: 1,
      phone: 1,
    });
  }

  if (!studentDataByCard) {
    return res.status(400).json({ message: 'هذا الكارت غير موجود' });
  }

  const studentData = studentDataByCard.userId;

  // Check if this attendance record already exists in the cardHistory
  const existingHistory = studentDataByCard.cardHistory.some((history) => {
    return (
      history.centerName === centerName &&
      history.GroupTime === GroupTime &&
      new Date(history.dateOfAttend).toDateString() ===
        new Date().toDateString() // Ensure same day comparison
    );
  });

  if (existingHistory) {
    return res.status(400).json({ message: 'تم اضافه هذا الطالب من قبل' });
  }

  // Update the card history if not already recorded

  if (CardType == 'Card') {
    await Card.findOneAndUpdate(
      { cardId: attendeeID },
      {
        $push: {
          cardHistory: {
            centerName: centerName,
            GroupTime: GroupTime,
            isAttend: true,
            dateOfAttend: new Date(),
          },
        },
      }
    );
  } else if (CardType == 'Code') {
    await Card.findOneAndUpdate(
      { userCode: attendeeID },
      {
        $push: {
          cardHistory: {
            centerName: centerName,
            GroupTime: GroupTime,
            isAttend: true,
            dateOfAttend: new Date(),
          },
        },
      }
    );
  }

  // Find or create attendance record and populate students' data
  const today = new Date().toISOString().split('T')[0]; // Getting the current date in 'YYYY-MM-DD' format

  const attendanceRecord = await Attendance.findOneAndUpdate(
    {
      Grade: CardGrade,
      CenterName: centerName,
      Date: today,
      GroupTime: GroupTime,
    },
    {
      $addToSet: { Students: studentData._id }, // Ensure students are added without duplicates
    },
    { new: true, upsert: true }
  ).populate('Students', { Username: 1, Code: 1, parentPhone: 1, phone: 1 });

  if (attendanceRecord) {
    return res
      .status(200)
      .json({ message: 'Attendance updated successfully', attendanceRecord });
  } else {
    return res.status(500).json({ message: 'يبدو ان هناك مشكله ما ' });
  }
};

const removeAttendance = async (req, res) => {
  const { studentId } = req.params;
  const { CardGrade, centerName, GroupTime } = req.body;
  try {
    // Find the attendance record
    const today = new Date().toISOString().split('T')[0]; // Getting the current date in 'YYYY-MM-DD' format
    const objectId = new mongoose.Types.ObjectId(studentId);

    const attendanceRecord = await Attendance.findOneAndUpdate(
      {
        Grade: CardGrade,
        CenterName: centerName,
        Date: today,
        GroupTime: GroupTime,
      },
      {
        $pull: { Students: objectId }, // Remove the student from the attendance list
      },
      { new: true }
    );

    if (!attendanceRecord) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    // Optionally: Remove from the student's cardHistory as well
    await Card.findOneAndUpdate(
      { userId: studentId },
      {
        $pull: {
          cardHistory: {
            centerName: centerName,
            GroupTime: GroupTime,
            dateOfAttend: {
              $gte: new Date(today),
              $lt: new Date(today + 'T23:59:59Z'),
            },
          },
        },
      }
    );

    return res
      .status(200)
      .json({ message: 'Student attendance removed successfully' });
  } catch (error) {
    console.error('Error removing attendance:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const convertAttendanceToExcel = async (req, res) => {
  try {
    const { CardGrade, centerName, GroupTime } = req.body;

    // Query the database to find the attendance record for the specified session
    const attendanceRecord = await Attendance.findOne({
      Grade: CardGrade,
      CenterName: centerName,
      GroupTime: GroupTime,
      Date: new Date().toISOString().split('T')[0], // Check attendance for today
    }).populate('Students', { Username: 1, Code: 1, phone: 1, parentPhone: 1 });
    let nphone = 0;
    req.io.emit('sendingToParents', {
      nPhone: nphone,
    });

    attendanceRecord['Students'].forEach(async (student) => {
      let message = `
        تم حضور الطالب : ${student.Username} الان في سنتر ${centerName} في مجموعه الساعه ${GroupTime}
      `;
      await waapi
        .postInstancesIdClientActionSendMessage(
          {
            chatId: `2${student.parentPhone}@c.us`,
            message: message,
          },
          { id: instanceID }
        )
        .then((result) => {
          req.io.emit('sendingToParents', {
            nPhone: ++nphone,
          });
        });
    });

    if (!attendanceRecord) {
      return res
        .status(404)
        .json({ message: 'No attendance record found for this session.' });
    }

    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet('Attendance Data');

    const headerH1Row = worksheet.addRow([
      'Grade',
      'Center Name',
      'Group Time',
      'Date',
    ]);

    const headerH2Row = worksheet.addRow([
      CardGrade,
      centerName,
      GroupTime,
      new Date().toISOString().split('T')[0],
    ]);

    const headerRow = worksheet.addRow([
      '#',
      'Student Name',
      'Student Code',
      'Student Phone',
      'Parent Phone',
    ]);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFF00' },
    };

    // Add user data to the worksheet with alternating row colors
    let c = 0;
    attendanceRecord.Students.forEach((student) => {
      c++;
      const row = worksheet.addRow([
        c,
        student.Username,
        student.Code,
        student.phone,
        student.parentPhone,
      ]);
      // Apply alternating row colors
      if (c % 2 === 0) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'DDDDDD' },
        };
      }
    });

    const excelBuffer = await workbook.xlsx.writeBuffer();

    // Set response headers for file download
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=attendance_data.xlsx'
    );

    // Send Excel file as response
    res.send(excelBuffer);
  } catch (error) {
    console.error('Error generating Excel file:', error);
    res.status(500).send('Error generating Excel file');
  }
};

// =================================================== END Add Card  &&  Attendance =================================================== //

// =================================================== Handel Attendance =================================================== //

const handelAttendanceGet = async (req, res) => {
  res.render('teacher/handelAttendance', {
    title: 'handelAttendance',
    path: req.path,
  });
};

const getDates = async (req, res) => {
  const { CardGrade, centerName, GroupTime } = req.body;
  try {
    const Dates = await Attendance.find({
      Grade: CardGrade,
      CenterName: centerName,
      GroupTime: GroupTime,
    }).distinct('Date');
    if (!Dates) {
      return res
        .status(404)
        .json({ message: 'No attendance record found for this session.' });
    }

    console.log(Dates);
    res.status(200).json({ Dates });
  } catch (error) {
    console.error('Error fetching attendance dates:', error);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

const getAttendees = async (req, res) => {
  const { CardGrade, centerName, GroupTime, date } = req.body;
  console.log(CardGrade, centerName, GroupTime, Date);
  try {
    const attendanceRecord = await Attendance.findOne({
      Grade: CardGrade,
      CenterName: centerName,
      GroupTime: GroupTime,
      Date: date,
    }).populate('Students', { Username: 1, Code: 1, phone: 1, parentPhone: 1 });

    if (!attendanceRecord) {
      return res
        .status(404)
        .json({ message: 'No attendance record found for this session.' });
    }

    res.status(200).json({ students: attendanceRecord.Students });
  } catch (error) {
    console.error('Error fetching attendees:', error);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

const convertAttendeesToExcel = async (req, res) => {
  try {
    const { CardGrade, centerName, GroupTime, date } = req.body;

    // Query the database to find the attendance record for the specified session
    const attendanceRecord = await Attendance.findOne({
      Grade: CardGrade,
      CenterName: centerName,
      GroupTime: GroupTime,
      Date: date,
    }).populate('Students', { Username: 1, Code: 1, phone: 1, parentPhone: 1 });

    if (!attendanceRecord) {
      return res
        .status(404)
        .json({ message: 'No attendance record found for this session.' });
    }

    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet('Attendance Data');

    const headerH1Row = worksheet.addRow([
      'Grade',
      'Center Name',
      'Group Time',
      'Date',
    ]);

    const headerH2Row = worksheet.addRow([
      CardGrade,
      centerName,
      GroupTime,
      new Date().toISOString().split('T')[0],
    ]);

    const headerRow = worksheet.addRow([
      '#',
      'Student Name',
      'Student Code',
      'Student Phone',
      'Parent Phone',
    ]);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFF00' },
    };

    // Add user data to the worksheet with alternating row colors
    let c = 0;
    attendanceRecord.Students.forEach((student) => {
      c++;
      const row = worksheet.addRow([
        c,
        student.Username,
        student.Code,
        student.phone,
        student.parentPhone,
      ]);
      // Apply alternating row colors
      if (c % 2 === 0) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'DDDDDD' },
        };
      }
    });

    const excelBuffer = await workbook.xlsx.writeBuffer();

    // Set response headers for file download
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=attendance_data.xlsx'
    );

    // Send Excel file as response
    res.send(excelBuffer);
  } catch (error) {
    console.error('Error generating Excel file:', error);
    res.status(500).send('Error generating Excel file');
  }
};

// =================================================== END Handel Attendance =================================================== //

// =================================================== Whats App =================================================== //

const whatsApp_get = (req, res) => {
  res.render('teacher/whatsApp', { title: 'whatsApp', path: req.path });
};

const delay2 = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const sendGradeMessages = async (req, res) => {
  const {
    phoneCloumnName,
    gradeCloumnName,
    nameCloumnName,
    dataToSend,
    quizName,
  } = req.body;

  let n = 0;
  req.io.emit('sendingMessages', {
    nMessages: n,
  });

  try {
    for (const student of dataToSend) {
      let message = `
        عزيزي ولي امر الطالب : ${student[nameCloumnName]}.
        
        نود إبلاغكم بأنه تم تسجيل درجة ابنكم بنجاح في امتحان : ${quizName}.
        
        الدرجة التي حصل عليها: ${student[gradeCloumnName]}.
        
        نتمنى لابنكم المزيد من التفوق والنجاح.
        
        مع تحيات فريق التعليم.
      `;

      try {
        await waapi.postInstancesIdClientActionSendMessage(
          {
            chatId: `20${student[phoneCloumnName]}@c.us`,
            message: message,
          },
          { id: instanceID }
        );

        console.log('Message sent successfully');
        req.io.emit('sendingMessages', {
          nMessages: ++n,
        });

        // Add delay between messages to prevent getting banned
        await delay2(10000); // 3-second delay between messages
      } catch (err) {
        console.error('Error sending message:', err);

        // Optional: Handle specific errors based on status code
        if (err.response && err.response.status === 429) {
          console.error('Rate limit reached, slowing down...');
          await delay2(2300); // 10-second delay if rate-limited
        } else if (err.response && err.response.status === 403) {
          console.error('Account banned or number blocked:', err);
          // Optional: Add logic to notify admin about the issue
        }
      }
    }

    res.status(200).json({ message: 'Messages sent successfully' });
  } catch (error) {
    console.error('Error in sending grade messages:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getRandomDelay = () => {
  const min = 2000; // Minimum delay of 2 seconds
  const max = 5000; // Maximum delay of 5 seconds
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const sendMessages = async (req, res) => {
  const { phoneCloumnName, nameCloumnName, dataToSend, message, imageCaption } =
    req.body;

  let n = 0;
  req.io.emit('sendingMessages', {
    nMessages: n,
  });

  try {
    for (const student of dataToSend) {
      console.log(student, student[phoneCloumnName], message);

      let theMessage = `
      عزيزي الطالب : ${student[nameCloumnName]}
      ${message}
      `;

      // Send the message to the student
      // const base64Image = fs.readFileSync(imageCaption, { encoding: 'base64' });

      if (imageCaption) {
        await waapi
          .postInstancesIdClientActionSendMedia(
            {
              chatId: `20${student[phoneCloumnName]}@c.us`, // Target chat ID
              mediaBase64: imageCaption,
              mediaName: 'image.png', // ✅ Added file extension (important)
              mediaCaption: theMessage,
              asSticker: false, // Set true if you want to send as a sticker
            },
            { id: instanceID } // Replace with your actual instance ID
          )
          .then((result) => {
            console.log(result);
            req.io.emit('sendingMessages', {
              nMessages: ++n,
            });
          })
          .catch((err) => {
            console.error(err);
          });
      } else {
        await waapi
          .postInstancesIdClientActionSendMessage(
            {
              chatId: `20${student[phoneCloumnName]}@c.us`,
              message: theMessage,
            },
            { id: instanceID }
          )
          .then((result) => {
            console.log(result);
            req.io.emit('sendingMessages', {
              nMessages: ++n,
            });
          })
          .catch((err) => {
            console.error(err);
          });
      }

      // Add random delay to avoid getting banned
      await delay(getRandomDelay());
    }

    res.status(200).json({ message: 'Messages sent successfully' });
  } catch (error) {
    console.error('Error sending messages:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// =================================================== END Whats App =================================================== //

// =================================================== Home Work =================================================== //

const getVideosToHW = async (req, res) => {
  const Grade = req.params.Grade;

  try {
    const videos = await Chapter.find(
      { chapterGrade: Grade },
      { chapterName: 1, chapterLectures: 1 }
    );

    if (videos.length === 0) {
      return res
        .status(404)
        .json({ message: 'No chapters found for this grade.' });
    }

    res.status(200).json({ videos: videos[0].chapterLectures });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getAllStudentsHW = async (req, res) => {
  const { videoID } = req.params;
  console.log(videoID);
  try {
    const students = await User.aggregate([
      {
        $match: {
          videosInfo: {
            $elemMatch: {
              _id: videoID,
              isHWIsUploaded: true,
            },
          },
        },
      },
      {
        $project: {
          Username: 1,
          Code: 1,
          videosInfo: {
            $filter: {
              input: '$videosInfo',
              as: 'video',
              cond: {
                $and: [
                  { $eq: ['$$video._id', videoID] },
                  { $eq: ['$$video.isHWIsUploaded', true] },
                ],
              },
            },
          },
        },
      },
      {
        $sort: {
          createdAt: 1,
        },
      },
    ]);

    console.log(students);
    if (students.length === 0) {
      return res.status(404).json({
        message: 'No students found who uploaded homework for this video.',
      });
    }

    res.status(200).json({ students });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const showHW = async (req, res) => {
  const { videoID, studentCode } = req.params;
  try {
    // Find the user with the specific studentCode and retrieve the specific video data
    const user = await User.findOne(
      { Code: studentCode },
      { videosInfo: { $elemMatch: { _id: videoID } } } // Only retrieve the matching video
    );

    // Check if the user and video were found
    if (!user || user.videosInfo.length === 0) {
      return res.status(404).json({ message: 'Video not found' });
    }

    // Return the video data
    res.status(200).json(user.videosInfo[0]); // Return the video data
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const acceptHW = async (req, res) => {
  const { videoID, studentCode } = req.params;

  try {
    // Find the user with the specific studentCode and update the specific video data
    const user = await User.findOneAndUpdate(
      { Code: studentCode, 'videosInfo._id': videoID },
      {
        $set: {
          'videosInfo.$.isUploadedHWApproved': true,
        },
      }
    );

    // Check if the user and video were found
    if (!user) {
      return res.status(404).json({ message: 'Video not found' });
    }

    // Return the video data

    res.status(200).json({ message: 'Homework accepted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};



const myStudentIds_get = async (req, res) => {
  res.render('teacher/myStudentIds', { title: 'myStudentIds', path: req.path });
}


const getCardsData = async (req, res) => {
  try {
    // Extract the start and end date from query parameters
    const { start, end } = req.query;


       if (!start || !end) {
         const cards = await Card.find().populate('userId', {
           Username: 1,
           Code: 1,
         });
         // Filter out items with null userId
         const filteredCards = cards.filter((item) => item.userId !== null);
         console.log('Fetched cards:', cards);
         return res.status(200).json({ cards: filteredCards });
       }

    console.log('Received query parameters:', start, end);

    // Convert query parameters to Date objects
    const startDate = new Date(start);
    const endDate = new Date(end);
    endDate.setHours(23, 59, 59, 999); // Adjust the end date to include the entire day

    // Log the converted dates for debugging
    console.log('Converted start date:', startDate);
    console.log('Converted end date:', endDate);

    // Query the database for cards within the date range

 
    const cards = await Card.find({
      createdAt: {
        $gte: startDate,
        $lte: endDate,
      },
    }).populate('userId', { Username: 1, Code: 1 });

      const filteredCards = cards.filter((item) => item.userId !== null);


    // Respond with the data or an empty array if none is found
    res.status(200).json({ cards: filteredCards });
  } catch (error) {
    // Log the error and respond with an error message
    console.error('Error fetching cards:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

   

const convertToExcelIds = async (req, res) => {
  try {
    // Extract the start and end date from query parameters
    const { start, end } = req.query;

    // Convert query parameters to Date objects
    const startDate = new Date(start);
    const endDate = new Date(end);

    // Query the database for cards within the date range
    const cards = await Card.find({
      createdAt: {
        $gte: startDate,
        $lte: endDate,
      },
    }).populate('userId', { Username: 1, Code: 1 });

    // Create a new Excel workbook
    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet('Card Data');

    // Add headers to the worksheet

    const headerRow = worksheet.addRow([
      'صاحب الكارت',
      'اسم الطالب',
      'كود الطالب',
      'تاريخ الانشاء',
      'اخر استخدام',
    ]);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFF00' },
    };

    // Add card data to the worksheet with alternating row colors

    let c = 0;
    
    cards.forEach((card) => {
      c++;
      const row = worksheet.addRow([
        card.cardId,
        card.userId.Username,
        card.userId.Code,
        card.createdAt.toLocaleDateString(),
        card.updatedAt.toLocaleDateString(),
      ]);
      // Apply alternating row colors
      if (c % 2 === 0) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'DDDDDD' },
        };
      }
    }
      
      );

    const excelBuffer = await workbook.xlsx.writeBuffer();

    // Set response headers for file download

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=cards_data.xlsx'
    );

    // Send Excel file as response
    res.send(excelBuffer);




  } catch (error) {
    // Log the error and respond with an error message
    console.error('Error generating Excel file:', error);
    res.status(500).send('Error generating Excel file');
  }
}
// =================================================== Log Out =================================================== //
const logOut = async (req, res) => {
  // Clearing the token cookie
  res.clearCookie('token');
  // Redirecting to the login page or any other desired page
  res.redirect('../login');
};

module.exports = {
  dash_get,
  addVideo_get,
  addQuiz_get,
  myStudent_get,
  homeWork_get,
  handelCodes_get,
  Codes_get,
  studentsRequests_get,
  confirmDeleteStudent,
  DeleteStudent,
  addQuestion,
  deleteQuestion,
  updateQuestion,
  getQuizAlldata,
  deleteQuiz,
  updateQuiz,
  quizSubmit,
  handleQuizzes,
  getQuizzesNames,
  getStudentsDataOfQuiz,
  searchForUserInQuiz,
  convertToExcelQuiz,

  addVideo_post,
  // uploadVideo,
  chapter_post,
  getAllChapters,

  handleVideos_get,
  getAllChaptersInHandle,
  getChapterDataToEdit,
  editChapterData,
  getSingleVideoAllData,
  updateVideoData,
  addViewsToStudent,
  convertToExcel,
  searchForUser,
  converStudentRequestsToExcel,
  getSingleUserAllData,
  updateUserData,

  searchToGetOneUserAllData,
  convertToExcelAllUserData,
  changeEnterToQuiz,
  // convertToPDFAllUserData

  // getVideosToQuiz

  // Codes
  getChptersOrVideosData,
  createSpecificCodes,
  createGeneralCodes,

  searchToGetCode,

  // PDF
  PDFPost_get,
  PDFPost_post,

  addCardGet,
  addCardToStudent,
  getAttendedUsers,
  attendUser,
  removeAttendance,
  convertAttendanceToExcel,

  handelAttendanceGet,
  getDates,
  getAttendees,
  convertAttendeesToExcel,

  // HomeWork Page

  getVideosToHW,
  getAllStudentsHW,
  showHW,
  acceptHW,

  // WhatsApp

  whatsApp_get,
  sendGradeMessages,
  sendMessages,

  myStudentIds_get,
  getCardsData,
  convertToExcelIds,

  logOut,
};
