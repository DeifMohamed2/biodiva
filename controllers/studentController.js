const Quiz = require('../models/Quiz');
const User = require('../models/User');
const Chapter = require('../models/Chapter');
const Code = require('../models/Code');
const PDFs = require('../models/PDFs');
const mongoose = require('mongoose');
const crypto = require('crypto');

// Import WhatsApp functionality
const wasender = require('../utils/wasender');

// Note: Using frontend Cloudinary upload instead of server-side processing

// ==================  WhatsApp Helper Functions  ====================== //

async function sendWasenderMessage(
  message,
  phone,
  adminPhone,
  isExcel = false,
  countryCode = '20'
) {
  try {
    // Skip if phone number is missing or invalid
    const phoneAsString = (
      typeof phone === 'string' ? phone : String(phone || '')
    ).trim();
    if (!phoneAsString) {
      console.warn('Skipping message - No phone number provided');
      return { success: false, message: 'No phone number provided' };
    }

    console.log('Sending message to:', phoneAsString);

    // Use the simplified sendTextMessage function from wasender
    const response = await wasender.sendTextMessage(
      message,
      phoneAsString,
      countryCode
    );

    if (!response.success) {
      console.error(`Failed to send message: ${response.message}`);
      return {
        success: false,
        message: `Failed to send message: ${response.message}`,
      };
    }

    return { success: true, data: response.data };
  } catch (err) {
    console.error('Error sending WhatsApp message:', err.message);
    return { success: false, message: err.message };
  }
}

// Function to send quiz completion message to parent
async function sendQuizCompletionMessage(
  student,
  quiz,
  score,
  totalQuestions,
  isRetake = false,
  previousScore = null
) {
  try {
    // Check if parent phone exists
    if (!student.parentPhone) {
      console.log(`No parent phone found for student ${student.Username}`);
      return { success: false, message: 'No parent phone number' };
    }

    // Calculate percentage
    const percentage =
      totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

    // Determine if this is a retake and if score improved
    let retakeMessage = '';
    if (isRetake && previousScore !== null) {
      const scoreImprovement = score - previousScore;
      const previousPercentage =
        totalQuestions > 0
          ? Math.round((previousScore / totalQuestions) * 100)
          : 0;

      if (scoreImprovement > 0) {
        retakeMessage = `\n🔄 *محاولة إعادة* - تحسن الدرجة من ${previousScore}/${totalQuestions} (${previousPercentage}%) إلى ${score}/${totalQuestions} (${percentage}%)`;
      } else if (scoreImprovement < 0) {
        retakeMessage = `\n🔄 *محاولة إعادة* - انخفضت الدرجة من ${previousScore}/${totalQuestions} (${previousPercentage}%) إلى ${score}/${totalQuestions} (${percentage}%)`;
      } else {
        retakeMessage = `\n🔄 *محاولة إعادة* - نفس الدرجة ${score}/${totalQuestions} (${percentage}%)`;
      }
    }

    // Determine status message
    let statusMessage = '';
    if (percentage >= 60) {
      statusMessage = '✅ *نجح الطالب*';
    } else {
      statusMessage = '⚠️ *يمكن للطالب إعادة الامتحان*';
    }

    // Format the message
    const message = `🎓 *نتيجة الامتحان* 🎓

الطالب: *${student.Username}*
الامتحان: *${quiz.quizName}*
الدرجة: *${score}/${totalQuestions}*
النسبة: *${percentage}%*
${retakeMessage}

${statusMessage}

📅 تاريخ الامتحان: ${new Date().toLocaleDateString('ar-EG')}
⏰ وقت الامتحان: ${new Date().toLocaleTimeString('ar-EG')}

نتمنى لطالبك المزيد من التقدم والنجاح 🌟

---
*منصة Biodiva التعليمية*`;

    // Send the message
    const result = await sendWasenderMessage(
      message,
      student.parentPhone,
      '01028772548'
    );

    if (result.success) {
      console.log(
        `Quiz completion message sent to parent of ${student.Username}`
      );
      return { success: true, message: 'Message sent successfully' };
    } else {
      console.error(
        `Failed to send quiz completion message: ${result.message}`
      );
      return { success: false, message: result.message };
    }
  } catch (error) {
    console.error('Error in sendQuizCompletionMessage:', error);
    return { success: false, message: error.message };
  }
}

// ==================  END WhatsApp Helper Functions  ====================== //

// ==================  Dash  ====================== //

const dash_get = async (req, res) => {
  try {
    const userGrade = req.userData.Grade;

    // Get user's chapters with proper filtering
    const userChapters = await Chapter.find({
      chapterGrade: userGrade,
      ARorEN: req.userData.ARorEN,
    }).select('chapterName _id');

    // Get user's quizzes
    const userQuizzes = await Quiz.find({
      Grade: userGrade,
      isQuizActive: true,
    }).select('quizName _id');

    // Get top ranked users for the podium
    const rankedUsers = await User.find({
      Grade: userGrade,
      isTeacher: false,
      totalScore: { $gt: 0 },
    })
      .sort({ totalScore: -1 })
      .limit(10)
      .select('Username totalScore totalQuestions');

    // Calculate user statistics
    const totalVideosWatched = req.userData.videosInfo
      ? req.userData.videosInfo.filter((video) => video.numberOfWatches > 0)
          .length
      : 0;

    const totalQuizzesTaken = req.userData.quizesInfo
      ? req.userData.quizesInfo.filter((quiz) => quiz.isEnterd).length
      : 0;

    const averageScore =
      req.userData.totalQuestions > 0
        ? Math.round(
            (req.userData.totalScore / req.userData.totalQuestions) * 100
          )
        : 0;

    // Get recent activities
    const recentActivities = [];

    // Add recent video watches
    if (req.userData.videosInfo) {
      req.userData.videosInfo
        .filter((video) => video.lastWatch)
        .sort((a, b) => new Date(b.lastWatch) - new Date(a.lastWatch))
        .slice(0, 3)
        .forEach((video) => {
          recentActivities.push({
            type: 'video',
            title: video.videoName,
            date: video.lastWatch,
            icon: 'play_circle',
          });
        });
    }

    // Add recent quiz attempts
    if (req.userData.quizesInfo) {
      req.userData.quizesInfo
        .filter((quiz) => quiz.isEnterd)
        .slice(0, 2)
        .forEach((quiz) => {
          recentActivities.push({
            type: 'quiz',
            title: 'اختبار',
            score: quiz.Score,
            icon: 'quiz',
          });
        });
    }

    // Sort activities by date
    recentActivities.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.render('student/dash', {
      title: 'Dashboard',
      path: req.path,
      userData: req.userData,
      stats: {
        totalVideosWatched,
        totalQuizzesTaken,
        averageScore,
        chaptersOwned: req.userData.chaptersPaid.length,
        videosOwned: req.userData.videosPaid.length,
      },
      userChapters,
      userQuizzes,
      rankedUsers,
      recentActivities,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).send('Internal Server Error');
  }
};

// ==================  END Dash  ====================== //

// ==================  Chapter  ====================== //

const chapters_get = async (req, res) => {
  try {
    const chapters = await Chapter.find({
      chapterGrade: req.userData.Grade,
      ARorEN: req.userData.ARorEN,
    }).sort({ createdAt: 1 });

    const paidChapters = chapters.map((chapter) => {
      const isPaid = req.userData.hasChapterAccess(chapter._id);

      // Calculate chapter statistics
      const chapterData = chapter.toObject();
      chapterData.isPaid = isPaid;

      // Count content
      chapterData.stats = {
        videos:
          (chapterData.chapterLectures?.length || 0) +
          (chapterData.chapterSummaries?.length || 0) +
          (chapterData.chapterSolvings?.length || 0),
        totalContent:
          (chapterData.chapterLectures?.length || 0) +
          (chapterData.chapterSummaries?.length || 0) +
          (chapterData.chapterSolvings?.length || 0),
      };

      return chapterData;
    });

    res.render('student/chapters', {
      title: 'Chapters',
      path: req.path,
      chapters: paidChapters,
      userData: req.userData,
      error: req.query.error,
    });
  } catch (error) {
    console.error('Chapters error:', error);
    res.status(500).send('Internal Server Error');
  }
};

const buyChapter = async (req, res) => {
  try {
    const chapterId = req.params.chapterId;
    const code = req.body.code;

    // Validate chapter exists and user can access it
    const chapterData = await Chapter.findById(chapterId);
    if (!chapterData) {
      return res.redirect('/student/chapters?error=chapter_not_found');
    }

    // Check if user can purchase content for this grade
    if (!req.userData.canPurchaseContent(chapterData.chapterGrade)) {
      return res.redirect('/student/chapters?error=grade_mismatch');
    }

    // Check if user already has access
    if (req.userData.hasChapterAccess(chapterId)) {
      return res.redirect('/student/chapter/' + chapterId);
    }

    // Find and validate code (specific chapter code or general chapter code)
    const codeData = await Code.findOne({
      Code: code.toUpperCase(),
      isUsed: false,
      $or: [{ codeType: 'Chapter' }, { codeType: 'GeneralChapter' }],
      isActive: true,
    });

    if (!codeData) {
      return res.redirect('/student/chapters?error=invalid_code');
    }

    // IMPORTANT: If this is a GeneralChapter code, check if specific codes exist for this chapter
    // General codes should NOT work if specific codes exist for the chapter
    const isGeneralCode = codeData.codeType === 'GeneralChapter' || 
                          (codeData.isGeneralCode && (!codeData.chapterId || codeData.chapterId === null));
    
    if (isGeneralCode) {
      console.log('This is a general chapter code, checking if specific codes exist for chapter:', chapterId);
      // Check if any specific Chapter codes exist for this chapter (codeType='Chapter' with matching chapterId)
      const specificCodeExists = await Code.findOne({
        codeType: 'Chapter',
        chapterId: new mongoose.Types.ObjectId(chapterId),
        isActive: true
      });

      if (specificCodeExists) {
        console.log('Specific code exists for this chapter, rejecting general code');
        return res.redirect('/student/chapters?error=specific_code_required');
      }
    }

    // Validate code can be used by this user
    const codeValidation = codeData.canBeUsedBy(req.userData);
    if (!codeValidation.valid) {
      return res.redirect(
        '/student/chapters?error=' + encodeURIComponent(codeValidation.reason)
      );
    }

    // Check if code is for this specific chapter (only for non-general codes)
    if (
      !codeData.isGeneralCode &&
      codeData.chapterId &&
      codeData.chapterId.toString() !== chapterId
    ) {
      return res.redirect('/student/chapters?error=code_chapter_mismatch');
    }

    // Additional check for grade compatibility (unless code works for all grades)
    if (
      !codeData.isAllGrades &&
      !req.userData.canPurchaseContent(chapterData.chapterGrade)
    ) {
      return res.redirect('/student/chapters?error=grade_mismatch');
    }

    // Process purchase
    if (codeData.isGeneralCode && codeData.codeType === 'GeneralChapter') {
      // Treat general chapter code as purchasing this specific chapter
      await req.userData.addChapterPurchase(chapterData, code);
    } else {
      // Grant specific chapter access
      await req.userData.addChapterPurchase(chapterData, code);
    }
    await codeData.markAsUsed(req.userData);

    // Grant access to all videos in chapter
    const allVideos = [
      ...(chapterData.chapterLectures || []),
      ...(chapterData.chapterSummaries || []),
      ...(chapterData.chapterSolvings || []),
    ];

    // Update user's video access
    for (const video of allVideos) {
      const videoInfo = req.userData.videosInfo.find(
        (v) => v._id.toString() === video._id.toString()
      );
      if (videoInfo && !videoInfo.videoPurchaseStatus) {
        videoInfo.videoPurchaseStatus = true;
        videoInfo.purchaseDate = new Date();
        videoInfo.purchaseCode = code;

        // Ensure videosPaid is an array
        if (!req.userData.videosPaid) {
          req.userData.videosPaid = [];
        }

        if (!req.userData.videosPaid.includes(video._id)) {
          req.userData.videosPaid.push(video._id);
        }
      }
    }

    await req.userData.save();

    res.redirect(
      '/student/chapter/' + chapterId + '?success=chapter_purchased'
    );
  } catch (error) {
    console.error('Buy chapter error:', error);
    res.redirect('/student/chapters?error=purchase_failed');
  }
};

// ================== End Chapter  ====================== //

// ==================  Lecture  ====================== //

const lecture_get = async (req, res) => {
  try {
    const cahpterId = req.params.cahpterId;
    const chapter = await Chapter.findById(cahpterId, {
      chapterLectures: 1,
      chapterAccessibility: 1,
    });
    const isPaid = req.userData.hasChapterAccess(cahpterId);
    const paidVideos = chapter.chapterLectures.map((lecture) => {
      const isPaidVideo = req.userData.hasVideoAccess(lecture._id);
      const videoUser = req.userData.videosInfo.find(
        (video) => video._id == lecture._id
      );
      let videoPrerequisitesName;
      let isUserCanEnter = true;

      if (
        lecture.prerequisites == 'WithExamaAndHw' ||
        lecture.prerequisites == 'WithExam' ||
        lecture.prerequisites == 'WithHw'
      ) {
        const video = req.userData.videosInfo.find(
          (video) => video._id == lecture.AccessibleAfterViewing
        );
        videoPrerequisitesName = video ? video.videoName : null;
        if (lecture.prerequisites == 'WithExamaAndHw') {
          isUserCanEnter =
            videoUser?.isUserEnterQuiz &&
            videoUser?.isUserUploadPerviousHWAndApproved;
        } else if (lecture.prerequisites == 'WithExam') {
          isUserCanEnter = videoUser?.isUserEnterQuiz;
        } else if (lecture.prerequisites == 'WithHw') {
          isUserCanEnter = videoUser?.isUserUploadPerviousHWAndApproved;
        }
      }

      return {
        ...lecture,
        isPaid: isPaidVideo,
        Attemps: videoUser?.videoAllowedAttemps ?? 0,
        videoPrerequisitesName: videoPrerequisitesName || null,
        isUserCanEnter: isUserCanEnter,
      };
    });

    if (chapter.chapterAccessibility === 'EnterInFree' || isPaid) {
      res.render('student/videos', {
        title: 'Lecture',
        path: req.path,
        chapterLectures: paidVideos,
        userData: req.userData,
        chapterId: cahpterId,
      });
    } else {
      res.redirect('/student/chapters');
    }
  } catch (error) {
    console.error('Lecture error:', error);
    res.status(500).send('Internal Server Error');
  }
};

const sum_get = async (req, res) => {
  try {
    const cahpterId = req.params.cahpterId;
    const chapter = await Chapter.findById(cahpterId, {
      chapterSummaries: 1,
      chapterAccessibility: 1,
    });
    const isPaid = req.userData.hasChapterAccess(cahpterId);
    const paidVideos = chapter.chapterSummaries.map((lecture) => {
      const isPaidVideo = req.userData.hasVideoAccess(lecture._id);
      const videoUser = req.userData.videosInfo.find(
        (video) => video._id == lecture._id
      );
      let videoPrerequisitesName;
      let isUserCanEnter = true;

      if (
        lecture.prerequisites == 'WithExamaAndHw' ||
        lecture.prerequisites == 'WithExam' ||
        lecture.prerequisites == 'WithHw'
      ) {
        const video = req.userData.videosInfo.find(
          (video) => video._id == lecture.AccessibleAfterViewing
        );
        videoPrerequisitesName = video ? video.videoName : null;
        if (lecture.prerequisites == 'WithExamaAndHw') {
          isUserCanEnter =
            videoUser?.isUserEnterQuiz &&
            videoUser?.isUserUploadPerviousHWAndApproved;
        } else if (lecture.prerequisites == 'WithExam') {
          isUserCanEnter = videoUser?.isUserEnterQuiz;
        } else if (lecture.prerequisites == 'WithHw') {
          isUserCanEnter = videoUser?.isUserUploadPerviousHWAndApproved;
        }
      }

      return {
        ...lecture,
        isPaid: isPaidVideo,
        Attemps: videoUser?.videoAllowedAttemps ?? 0,
        videoPrerequisitesName: videoPrerequisitesName || null,
        isUserCanEnter: isUserCanEnter,
      };
    });

    if (chapter.chapterAccessibility === 'EnterInFree' || isPaid) {
      res.render('student/videos', {
        title: 'Summary',
        path: req.path,
        chapterLectures: paidVideos,
        userData: req.userData,
        chapterId: cahpterId,
      });
    } else {
      res.redirect('/student/chapters');
    }
  } catch (error) {
    console.error('Summary error:', error);
    res.status(500).send('Internal Server Error');
  }
};

const solv_get = async (req, res) => {
  try {
    const cahpterId = req.params.cahpterId;
    const chapter = await Chapter.findById(cahpterId, {
      chapterSolvings: 1,
      chapterAccessibility: 1,
    });
    const isPaid = req.userData.hasChapterAccess(cahpterId);
    const paidVideos = chapter.chapterSolvings.map((lecture) => {
      const isPaidVideo = req.userData.hasVideoAccess(lecture._id);
      const videoUser = req.userData.videosInfo.find(
        (video) => video._id == lecture._id
      );
      let videoPrerequisitesName;
      let isUserCanEnter = true;

      if (
        lecture.prerequisites == 'WithExamaAndHw' ||
        lecture.prerequisites == 'WithExam' ||
        lecture.prerequisites == 'WithHw'
      ) {
        const video = req.userData.videosInfo.find(
          (video) => video._id == lecture.AccessibleAfterViewing
        );
        videoPrerequisitesName = video ? video.videoName : null;
        if (lecture.prerequisites == 'WithExamaAndHw') {
          isUserCanEnter =
            videoUser?.isUserEnterQuiz &&
            videoUser?.isUserUploadPerviousHWAndApproved;
        } else if (lecture.prerequisites == 'WithExam') {
          isUserCanEnter = videoUser?.isUserEnterQuiz;
        } else if (lecture.prerequisites == 'WithHw') {
          isUserCanEnter = videoUser?.isUserUploadPerviousHWAndApproved;
        }
      }

      return {
        ...lecture,
        isPaid: isPaidVideo,
        Attemps: videoUser?.videoAllowedAttemps ?? 0,
        videoPrerequisitesName: videoPrerequisitesName || null,
        isUserCanEnter: isUserCanEnter,
      };
    });

    if (chapter.chapterAccessibility === 'EnterInFree' || isPaid) {
      res.render('student/videos', {
        title: 'Solving',
        path: req.path,
        chapterLectures: paidVideos,
        userData: req.userData,
        chapterId: cahpterId,
      });
    } else {
      res.redirect('/student/chapters');
    }
  } catch (error) {
    console.error('Solving error:', error);
    res.status(500).send('Internal Server Error');
  }
};

// ================== End Lecture  ====================== //

// ==================  Watch  ====================== //
async function updateWatchInUser(req, res, videoId, chapterID) {
  const videoInfo = req.userData.videosInfo.find(
    (video) => video._id.toString() === videoId.toString()
  );

  if (!videoInfo || videoInfo.videoAllowedAttemps <= 0) {
    return res.redirect('/student/chapter/' + chapterID);
  }

  const updateFields = {
    'videosInfo.$.lastWatch': Date.now(),
    ...(videoInfo.fristWatch ? {} : { 'videosInfo.$.fristWatch': Date.now() }),
  };

  const incFields = {
    'videosInfo.$.numberOfWatches': 1,
    'videosInfo.$.videoAllowedAttemps': -1,
  };

  await User.findOneAndUpdate(
    { _id: req.userData._id, 'videosInfo._id': videoId },
    {
      $set: updateFields,
      $inc: incFields,
    }
  );
}

const getVideoWatch = async (req, res) => {
  const videoType = req.params.videoType;
  const chapterID = req.params.chapterID;
  const VideoId = req.params.VideoId;

  const chapter = await Chapter.findById(chapterID, {
    chapterLectures: 1,
    chapterSummaries: 1,
    chapterSolvings: 1,
  });

  let video = null;
  if (videoType == 'lecture') {
    video = chapter.chapterLectures.find((video) => video._id == VideoId);
  } else if (videoType == 'sum') {
    video = chapter.chapterSummaries.find((video) => video._id == VideoId);
  } else if (videoType == 'solv') {
    video = chapter.chapterSolvings.find((video) => video._id == VideoId);
  }

  if (!video) {
    return res.status(404).send('Video not found');
  }

  const hasChapterAccess = req.userData.hasChapterAccess(chapterID);
  const hasVideoAccess = req.userData.hasVideoAccess(VideoId);

  if (video.paymentStatus == 'Pay') {
    if (hasVideoAccess || hasChapterAccess) {
      await updateWatchInUser(req, res, VideoId, chapterID);

      // Get homework submission for this video (now available for any video)
      let homeworkSubmission = null;
      homeworkSubmission =
        req.userData.homeworkSubmissions &&
        req.userData.homeworkSubmissions.find(
          (submission) => submission.videoId.toString() === VideoId.toString()
        );

      res.render('student/watch', {
        title: 'Watch',
        path: req.path,
        video: video,
        userData: req.userData,
        homeworkSubmission: homeworkSubmission,
      });
    } else {
      res.redirect('/student/chapter/' + chapterID);
    }
  } else {
    await updateWatchInUser(req, res, VideoId, chapterID);

    // Get homework submission for this video (now available for any video)
    let homeworkSubmission = null;
    homeworkSubmission =
      req.userData.homeworkSubmissions &&
      req.userData.homeworkSubmissions.find(
        (submission) => submission.videoId.toString() === VideoId.toString()
      );

    res.render('student/watch', {
      title: 'Watch',
      path: req.path,
      video: video,
      userData: req.userData,
      homeworkSubmission: homeworkSubmission,
    });
  }
};

const watch_get = async (req, res) => {
  try {
    await getVideoWatch(req, res);
  } catch (error) {
    console.error('Watch error:', error);
    res.status(500).send('Internal Server Error');
  }
};

const uploadHW = async (req, res) => {
  try {
    const VideoId = req.params.VideoId;
    const userId = req.userData._id;

    // Update the specific video's isHWIsUploaded field
    await User.findOneAndUpdate(
      { _id: userId, 'videosInfo._id': VideoId },
      { $set: { 'videosInfo.$.isHWIsUploaded': true } }
    );

    // Optionally, you can call getVideoWatch after updating the field
    await getVideoWatch(req, res);
  } catch (error) {
    res.status(500).send(error.message);
  }
};

// New comprehensive homework submission function
const submitHomework = async (req, res) => {
  try {
    const { videoId, notes, files } = req.body;
    const userId = req.userData._id;

    if (!videoId) {
      return res
        .status(400)
        .json({ success: false, message: 'Video ID is required' });
    }

    // Check if video exists (allow homework submission even without video access)
    const userVideo = req.userData.videosInfo.find(
      (video) => video._id.toString() === videoId
    );
    if (!userVideo) {
      // If user doesn't have video access, we still allow homework submission
      // This is useful for students who want to submit homework for videos they don't have access to yet
      console.log(
        'User submitting homework for video without access:',
        videoId
      );
    }

    // Allow homework submission for any video (removed prerequisite check)
    // Students can now submit homework for any video they have access to

    // Check if homework is already submitted and approved (only if user has video access)
    if (userVideo && userVideo.isUserUploadPerviousHWAndApproved) {
      return res.status(400).json({
        success: false,
        message: 'Homework already submitted and approved',
      });
    }

    // Handle file uploads - files should already be uploaded to Cloudinary from frontend
    const uploadedFiles = [];
    if (files && files.length > 0) {
      // Files are already uploaded to Cloudinary from frontend
      uploadedFiles.push(...files);
    } else {
      return res
        .status(400)
        .json({ success: false, message: 'At least one file is required' });
    }

    // Create homework submission record
    const homeworkSubmission = {
      _id: new mongoose.Types.ObjectId(),
      videoId: new mongoose.Types.ObjectId(videoId),
      studentId: new mongoose.Types.ObjectId(userId),
      studentName: req.userData.Username,
      studentCode: req.userData.Code || req.userData.Code.toString(),
      files: uploadedFiles,
      notes: notes || '',
      status: 'pending', // pending, approved, rejected
      submittedAt: new Date(),
      reviewedAt: null,
      reviewedBy: null,
      reviewNotes: null,
    };

    // Save homework submission to database
    const updateData = {
      $push: {
        homeworkSubmissions: homeworkSubmission,
      },
    };

    // Only update video info if user has video access
    if (userVideo) {
      updateData.$set = {
        'videosInfo.$[video].isHWIsUploaded': true,
        'videosInfo.$[video].homeworkSubmissionId': homeworkSubmission._id,
      };
    }

    await User.findOneAndUpdate(
      { _id: userId },
      updateData,
      userVideo
        ? {
            arrayFilters: [
              { 'video._id': new mongoose.Types.ObjectId(videoId) },
            ],
          }
        : {}
    );

    res.json({
      success: true,
      message: 'Homework submitted successfully',
      submissionId: homeworkSubmission._id,
    });
  } catch (error) {
    console.error('Homework submission error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ================== END Watch  ====================== //

// ================== Ranking  ====================== //

const ranking_get = async (req, res) => {
  try {
    const { searchInput } = req.query;
    let perPage = 20;
    let page = req.query.page || 1;

    if (searchInput) {
      // Find the student with the given Code
      const student = await User.findOne({ Code: searchInput }).exec();

      // Find all students and sort them by totalScore
      const allStudents = await User.find(
        {},
        { Username: 1, Code: 1, totalScore: 1 }
      ).sort({ totalScore: -1 });

      // Find the index of the student in the sorted array
      const userRank =
        allStudents.findIndex((s) => s.Code === +searchInput) + 1;
      console.log(userRank);
      const paginatedStudents = await User.find(
        { Code: searchInput },
        { Username: 1, Code: 1, totalScore: 1 }
      ).sort({ totalScore: -1 });

      const count = await User.countDocuments({});

      const nextPage = parseInt(page) + 1;
      const hasNextPage = nextPage <= Math.ceil(count / perPage);
      const hasPreviousPage = page > 1;

      res.render('student/ranking', {
        title: 'Ranking',
        path: req.path,
        isSearching: true,
        userData: req.userData,
        rankedUsers: paginatedStudents,
        nextPage: hasNextPage ? nextPage : null,
        previousPage: hasPreviousPage ? page - 1 : null,
        userRank: userRank, // Include user's rank in the response
      });

      return;
    } else {
      await User.find(
        { Grade: req.userData.Grade },
        { Username: 1, Code: 1, totalScore: 1 }
      )
        .sort({ totalScore: -1 })
        .then(async (result) => {
          const count = await Code.countDocuments({});
          const nextPage = parseInt(page) + 1;
          const hasNextPage = nextPage <= Math.ceil(count / perPage);
          const hasPreviousPage = page > 1;

          res.render('student/ranking', {
            title: 'Ranking',
            path: req.path,
            userData: req.userData,
            rankedUsers: result,
            nextPage: hasNextPage ? nextPage : null,
            previousPage: hasPreviousPage ? page - 1 : null,
            userRank: null,
            isSearching: false,
          });
        })
        .catch((err) => {
          console.log(err);
        });
      return;
    }
  } catch (error) {
    console.log();
  }
};

// ================== END Ranking  ====================== //

// ================== Exams  ====================== //

// ================== Exams  ====================== //
const exams_get = async (req, res) => {
  try {
    // Get the top 3 ranked users by total score
    const rankedUsers = await User.find(
      { Grade: req.userData.Grade },
      { Username: 1, userPhoto: 1 }
    )
      .sort({ totalScore: -1 })
      .limit(3)
      .lean();

    // Get all active and visible exams for the user's grade
    const exams = await Quiz.find({
      Grade: req.userData.Grade,
      isQuizActive: true, // Only show active quizzes
      permissionToShow: true, // Only show quizzes that are set to be visible
    })
      .sort({ createdAt: 1 })
      .lean();

    // Map through the exams and add additional information
    // Performance: avoid per-exam aggregation/ranking. Compute only minimal data needed for listing.
    const paidExams = exams.map((exam) => {
      const isPaid = Array.isArray(req.userData.examsPaid)
        ? req.userData.examsPaid.includes(exam._id)
        : false;
      const quizUser =
        req.userData.quizesInfo &&
        req.userData.quizesInfo.find(
          (quiz) => quiz._id.toString() === exam._id.toString()
        );

      const quizInfo = quizUser
        ? {
            isEnterd: quizUser.isEnterd,
            inProgress: quizUser.inProgress,
            Score: quizUser.Score,
          }
        : null;

      return { ...exam, isPaid, quizUser: quizInfo };
    });

    res.render('student/exams', {
      title: 'Exams',
      path: req.path,
      userData: req.userData,
      rankedUsers,
      exams: paidExams,
    });
  } catch (error) {
    res.send(error.message);
  }
};

const buyQuiz = async (req, res) => {
  try {
    const quizId = req.params.quizId;
    const chapterId = req.params.chapterId;
    const code = req.body.code;

    // For legacy route support (if no chapterId)
    const redirectBase = chapterId
      ? `/student/chapter/${chapterId}/quizzes`
      : '/student/exams';

    // Validate quiz exists
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found',
        redirect: `${redirectBase}?error=quiz_not_found`,
      });
    }

    // Check grade compatibility
    if (!req.userData.canPurchaseContent(quiz.Grade)) {
      return res.status(403).json({
        success: false,
        message: 'Grade mismatch',
        redirect: `${redirectBase}?error=grade_mismatch`,
      });
    }

    // Check if user already has access
    const hasSpecificAccess = Array.isArray(req.userData.examsPaid)
      ? req.userData.examsPaid.some((id) => id.toString() === quizId.toString())
      : false;

    if (hasSpecificAccess) {
      const targetUrl = chapterId
        ? `/student/chapter/${chapterId}/quiz/${quizId}`
        : `/student/quiz/${quizId}`;
      return res.status(200).json({
        success: true,
        message: 'Already have access',
        redirect: targetUrl,
      });
    }

    // Find and validate code (specific quiz code or general quiz code)
    const codeData = await Code.findOne({
      Code: code.toUpperCase(),
      isUsed: false,
      $or: [{ codeType: 'Quiz' }, { codeType: 'GeneralQuiz' }],
      isActive: true,
    });

    if (!codeData) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or used code',
        redirect: `${redirectBase}?error=invalid_code`,
      });
    }

    // IMPORTANT: If this is a GeneralQuiz code, check if specific codes exist for this quiz
    // General codes should NOT work if specific codes exist for the quiz
    const isGeneralCode = codeData.codeType === 'GeneralQuiz' || 
                          (codeData.isGeneralCode && (!codeData.contentId || codeData.contentId === null));
    
    if (isGeneralCode) {
      console.log('This is a general quiz code, checking if specific codes exist for quiz:', quizId);
      // Check if any specific Quiz codes exist for this quiz (codeType='Quiz' with matching contentId)
      const specificCodeExists = await Code.findOne({
        codeType: 'Quiz',
        contentId: new mongoose.Types.ObjectId(quizId),
        isActive: true
      });

      if (specificCodeExists) {
        console.log('Specific code exists for this quiz, rejecting general code');
        return res.status(400).json({
          success: false,
          message: 'This quiz requires a specific code. General codes cannot be used for quizzes with specific codes.',
          redirect: `${redirectBase}?error=specific_code_required`,
        });
      }
    }

    // Check if code is for this specific quiz (only for non-general codes)
    if (
      !codeData.isGeneralCode &&
      codeData.contentId &&
      codeData.contentId.toString() !== quizId.toString()
    ) {
      return res.status(400).json({
        success: false,
        message: 'Code is not for this quiz',
        redirect: `${redirectBase}?error=code_quiz_mismatch`,
      });
    }

    // Validate code can be used by this user
    const codeValidation = codeData.canBeUsedBy(req.userData);
    if (!codeValidation.valid) {
      return res.status(400).json({
        success: false,
        message: codeValidation.reason,
        redirect: `${redirectBase}?error=${encodeURIComponent(
          codeValidation.reason
        )}`,
      });
    }

    // Additional check for grade compatibility (unless code works for all grades)
    if (!codeData.isAllGrades && !req.userData.canPurchaseContent(quiz.Grade)) {
      return res.status(403).json({
        success: false,
        message: 'Grade mismatch',
        redirect: `${redirectBase}?error=grade_mismatch`,
      });
    }

    // Process quiz purchase
    if (codeData.isGeneralCode && codeData.codeType === 'GeneralQuiz') {
      // Treat general quiz code as purchase for this specific quiz
      if (!req.userData.examsPaid) {
        req.userData.examsPaid = [];
      }
      const quizObjectId = new mongoose.Types.ObjectId(quizId);
      if (!req.userData.examsPaid.some((id) => id.toString() === quizObjectId.toString())) {
        req.userData.examsPaid.push(quizObjectId);
      }

      const quizInfo = req.userData.quizesInfo.find(
        (q) => q._id.toString() === quizId
      );
      if (quizInfo) {
        quizInfo.quizPurchaseStatus = true;
      }

      await req.userData.save();
    } else {
      // Grant specific quiz access
      if (!req.userData.examsPaid) {
        req.userData.examsPaid = [];
      }
      const quizObjectId = new mongoose.Types.ObjectId(quizId);
      if (!req.userData.examsPaid.some((id) => id.toString() === quizObjectId.toString())) {
        req.userData.examsPaid.push(quizObjectId);
      }

      // Update quiz info if exists
      const quizInfo = req.userData.quizesInfo.find(
        (q) => q._id.toString() === quizId
      );
      if (quizInfo) {
        quizInfo.quizPurchaseStatus = true;
      }

      await req.userData.save();
    }
    await codeData.markAsUsed(req.userData);

    // Return success response with redirect
    const successUrl = chapterId
      ? `/student/chapter/${chapterId}/quiz/${quizId}?success=quiz_purchased`
      : `/student/quiz/${quizId}?success=quiz_purchased`;
    return res.status(200).json({
      success: true,
      message: 'Quiz purchased successfully',
      redirect: successUrl,
    });
  } catch (error) {
    console.error('Buy quiz error:', error);
    const errorUrl = req.params.chapterId
      ? `/student/chapter/${req.params.chapterId}/quizzes?error=purchase_failed`
      : '/student/exams?error=purchase_failed';
    return res.status(500).json({
      success: false,
      message: 'Purchase failed',
      redirect: errorUrl,
    });
  }
};
// ================== END Exams  ====================== //

// ================== quiz  ====================== //
const quiz_get = async (req, res) => {
  try {
    const quizId = req.params.quizId;
    const quiz = await Quiz.findById(quizId);

    console.log('Quiz found:', quiz ? quiz.quizName : 'Not found');
    if (!quiz) {
      return res.redirect('/student/exams');
    }

    // Check if quiz is active and visible
    if (!quiz.permissionToShow || !quiz.isQuizActive) {
      console.log('Quiz not active or not visible');
      return res.redirect('/student/exams');
    }

    // Check quiz access (free or specific purchase)
    const hasSpecificQuizAccess = Array.isArray(req.userData.examsPaid)
      ? req.userData.examsPaid.some((id) => id.toString() === quizId.toString())
      : false;
    const isFreeQuiz = !quiz.prepaidStatus || quiz.quizPrice === 0;

    console.log('Quiz access check:', {
      isFreeQuiz,
      hasSpecificQuizAccess,
      prepaidStatus: quiz.prepaidStatus,
      quizPrice: quiz.quizPrice,
    });

    // Allow access if: free quiz or specific access
    if (!isFreeQuiz && !hasSpecificQuizAccess) {
      console.log('No access to paid quiz');
      return res.redirect('/student/exams');
    }

    // Check if user already completed this quiz
    const quizUser =
      req.userData.quizesInfo &&
      req.userData.quizesInfo.find(
        (q) => q._id.toString() === quiz._id.toString()
      );

    // If quiz is completed (isEnterd = true), don't allow retake
    if (quizUser && quizUser.isEnterd && !quizUser.inProgress) {
      console.log('Quiz already completed');
      return res.redirect('/student/exams');
    }

    console.log('Rendering quiz preparation page');
    res.render('student/quiz-preparation', {
      title: 'Quiz',
      path: req.path,
      quiz: quiz,
      userData: req.userData,
      question: null,
    });
  } catch (error) {
    console.error('Quiz get error:', error);
    res.send(error.message);
  }
};

const quizWillStart = async (req, res) => {
  try {
    const quizId = req.params.quizId;
    const quiz = await Quiz.findById(quizId);

    if (!quiz) {
      return res
        .status(404)
        .json({ success: false, message: 'Quiz not found' });
    }

    // Check quiz access (free or specific purchase)
    const hasSpecificQuizAccess = Array.isArray(req.userData.examsPaid)
      ? req.userData.examsPaid.some((id) => id.toString() === quizId.toString())
      : false;
    const isFreeQuiz = !quiz.prepaidStatus || quiz.quizPrice === 0;

    // Allow access if: free quiz or specific access
    if (!isFreeQuiz && !hasSpecificQuizAccess) {
      return res
        .status(403)
        .json({ success: false, message: 'No access to this quiz' });
    }

    // Find or create quiz user info
    let quizUser =
      req.userData.quizesInfo &&
      req.userData.quizesInfo.find(
        (q) => q._id.toString() === quiz._id.toString()
      );

    // If quiz is completed, don't allow retake
    if (quizUser && quizUser.isEnterd && !quizUser.inProgress) {
      return res
        .status(400)
        .json({ success: false, message: 'Quiz already completed' });
    }

    const durationInMinutes = quiz.timeOfQuiz;
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + durationInMinutes * 60000);

    console.log('Starting quiz:', quiz.quizName);
    console.log('Quiz user exists:', !!quizUser);
    console.log('Start time:', startTime);
    console.log('End time:', endTime);

    // Generate random question indices for this user
    const questionsToShow = quiz.questionsToShow || quiz.questionsCount;
    let randomQuestionIndices = [];

    // Always randomize order; then take the first questionsToShow
    const allIndices = Array.from(
      { length: quiz.Questions.length },
      (_, i) => i
    );

    for (let i = allIndices.length - 1; i > 0; i--) {
      const j = crypto.randomInt(0, i + 1);
      [allIndices[i], allIndices[j]] = [allIndices[j], allIndices[i]];
    }

    randomQuestionIndices = allIndices.slice(0, questionsToShow);
    console.log('Generated random question indices at quiz start:', {
      userId: req.userData._id,
      quizId: quiz._id,
      totalQuestions: quiz.Questions.length,
      questionsToShow: questionsToShow,
      randomIndices: randomQuestionIndices
    });

    if (!quizUser) {
      // Create new quiz info for user
      console.log('Creating new quiz info for user');
      const newQuizInfo = {
        _id: quiz._id,
        quizName: quiz.quizName,
        chapterId: quiz.chapterId || null,
        isEnterd: false,
        inProgress: true,
        Score: 0,
        answers: [],
        randomQuestionIndices: randomQuestionIndices, // Set random indices immediately
        startTime: startTime,
        endTime: endTime,
        quizPurchaseStatus: !quiz.prepaidStatus || isFreeQuiz || hasSpecificQuizAccess,
      };

      await User.findByIdAndUpdate(req.userData._id, {
        $push: { quizesInfo: newQuizInfo },
      });

      console.log('Quiz started with random indices:', randomQuestionIndices);
      return res.json({ success: true, message: 'Quiz started successfully' });
    } else if (!quizUser.endTime || !quizUser.inProgress) {
      // Update existing quiz info with start time and new random indices
      console.log('Updating existing quiz info with start time and new random indices');

      await User.findOneAndUpdate(
        { _id: req.userData._id, 'quizesInfo._id': quiz._id },
        {
          $set: {
            'quizesInfo.$.startTime': startTime,
            'quizesInfo.$.endTime': endTime,
            'quizesInfo.$.inProgress': true,
            'quizesInfo.$.isEnterd': false,
            'quizesInfo.$.answers': [], // Clear previous answers
            'quizesInfo.$.Score': 0, // Reset score
            'quizesInfo.$.randomQuestionIndices': randomQuestionIndices, // Set new random indices
          },
        }
      );

      console.log('Quiz timer updated with new random indices:', randomQuestionIndices);
      return res.json({
        success: true,
        message: 'Quiz timer updated successfully',
      });
    } else {
      // Check if existing quiz time is still valid
      const currentTime = new Date().getTime();
      const existingEndTime = new Date(quizUser.endTime).getTime();

      if (currentTime >= existingEndTime) {
        return res
          .status(400)
          .json({ success: false, message: 'Quiz time has expired' });
      }

      // Quiz already started and still valid, continue
      console.log('Quiz already started, continuing');
      return res.json({ success: true, message: 'Quiz already in progress' });
    }
  } catch (error) {
    console.error('Quiz will start error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const escapeSpecialCharacters = (text) => {
  try {
    // Attempt to parse the JSON string
    const parsedText = JSON.parse(text);
    // If parsing succeeds, stringify it back and escape special characters
    const escapedText = JSON.stringify(parsedText, (key, value) => {
      if (typeof value === 'string') {
        return value.replace(/["\\]/g, '\\$&');
      }
      return value;
    });
    return escapedText;
  } catch (error) {
    // If parsing fails, return the original text
    return text;
  }
};

const quiz_start = async (req, res) => {
  try {
    const quizId = req.params.quizId;
    const quiz = await Quiz.findById(quizId);

    console.log('=== QUIZ START DEBUG ===');
    console.log('Quiz ID:', quizId);
    console.log('Quiz found:', quiz ? quiz.quizName : 'NOT FOUND');
    console.log(
      'User quizesInfo count:',
      req.userData.quizesInfo ? req.userData.quizesInfo.length : 0
    );

    const userQuizInfo =
      req.userData.quizesInfo &&
      req.userData.quizesInfo.find(
        (q) => q._id.toString() === quiz._id.toString()
      );

    console.log('UserQuizInfo found:', !!userQuizInfo);
    if (userQuizInfo) {
      console.log('UserQuizInfo details:', {
        isEnterd: userQuizInfo.isEnterd,
        inProgress: userQuizInfo.inProgress,
        hasEndTime: !!userQuizInfo.endTime,
        randomQuestionIndices: userQuizInfo.randomQuestionIndices,
      });
    }

    // Redirect if quiz not found
    if (!quiz || !quiz.permissionToShow || !quiz.isQuizActive) {
      return res.redirect('/student/exams');
    }

    // Check quiz access (free or specific purchase)
    const hasSpecificQuizAccess = Array.isArray(req.userData.examsPaid)
      ? req.userData.examsPaid.some((id) => id.toString() === quizId.toString())
      : false;
    const isFreeQuiz = !quiz.prepaidStatus || quiz.quizPrice === 0;

    // Allow access if: free quiz or specific access
    if (!isFreeQuiz && !hasSpecificQuizAccess) {
      return res.redirect('/student/exams');
    }

    // If quiz is completed, don't allow retake
    if (userQuizInfo && userQuizInfo.isEnterd && !userQuizInfo.inProgress) {
      console.log('Quiz already completed');
      return res.redirect('/student/exams');
    }

    // Redirect if quiz is not yet started
    if (!userQuizInfo || !userQuizInfo.endTime) {
      return res.redirect('/student/exams');
    }

    // Check if quiz time has expired
    const currentTime = new Date().getTime();
    const endTime = new Date(userQuizInfo.endTime).getTime();

    if (currentTime >= endTime) {
      console.log('Quiz time expired, auto-finishing quiz');
      // Auto-finish the quiz if time is up - reset for retake since no answers were submitted
      await User.findOneAndUpdate(
        { _id: req.userData._id, 'quizesInfo._id': quiz._id },
        {
          $set: {
            'quizesInfo.$.inProgress': false,
            'quizesInfo.$.isEnterd': false,
            'quizesInfo.$.solvedAt': null,
            'quizesInfo.$.endTime': null,
            'quizesInfo.$.startTime': null,
            'quizesInfo.$.answers': [],
            'quizesInfo.$.Score': 0,
            'quizesInfo.$.randomQuestionIndices': [],
          },
        }
      );
      return res.redirect('/student/exams?message=quiz_time_expired');
    }

    // Check if we need to generate random questions for this user
    console.log(
      'Current userQuizInfo.randomQuestionIndices:',
      userQuizInfo.randomQuestionIndices
    );
    console.log(
      'Type of randomQuestionIndices:',
      typeof userQuizInfo.randomQuestionIndices
    );
    console.log('Is array?', Array.isArray(userQuizInfo.randomQuestionIndices));
    console.log(
      'Length:',
      userQuizInfo.randomQuestionIndices
        ? userQuizInfo.randomQuestionIndices.length
        : 'undefined'
    );

    // Always check and generate random indices if needed (regenerate if empty or invalid)
    const questionsToShow = quiz.questionsToShow || quiz.questionsCount;
    let needsRandomGeneration = false;
    
    if (
      !userQuizInfo.randomQuestionIndices ||
      !Array.isArray(userQuizInfo.randomQuestionIndices) ||
      userQuizInfo.randomQuestionIndices.length === 0 ||
      userQuizInfo.randomQuestionIndices.length !== questionsToShow
    ) {
      needsRandomGeneration = true;
      console.log('Random indices need to be generated:', {
        exists: !!userQuizInfo.randomQuestionIndices,
        isArray: Array.isArray(userQuizInfo.randomQuestionIndices),
        length: userQuizInfo.randomQuestionIndices?.length,
        expectedLength: questionsToShow
      });
    }

    if (needsRandomGeneration) {
      let randomIndices = [];

      // Always generate randomized indices, then take first questionsToShow
      // Create an array of all question indices
      const allIndices = Array.from(
        { length: quiz.Questions.length },
        (_, i) => i
      );

      // Shuffle the array using cryptographically-strong Fisher-Yates
      for (let i = allIndices.length - 1; i > 0; i--) {
        const j = crypto.randomInt(0, i + 1);
        [allIndices[i], allIndices[j]] = [allIndices[j], allIndices[i]];
      }

      // Take the first 'questionsToShow' indices (already shuffled)
      randomIndices = allIndices.slice(0, questionsToShow);
      
      console.log('Generated random indices for user:', {
        userId: req.userData._id,
        quizId: quiz._id,
        totalQuestions: quiz.Questions.length,
        questionsToShow: questionsToShow,
        randomIndices: randomIndices
      });

      // Save these indices to the user's quiz info with explicit user ID filter
      console.log('Saving random indices to database for user:', req.userData._id);
      const updateResult = await User.findOneAndUpdate(
        { 
          _id: req.userData._id, 
          'quizesInfo._id': quiz._id 
        },
        { 
          $set: { 'quizesInfo.$.randomQuestionIndices': randomIndices } 
        },
        { new: true }
      );

      if (!updateResult) {
        console.error('Failed to update randomQuestionIndices in database');
        // Fallback: try to find and update the quiz info manually
        const user = await User.findById(req.userData._id);
        if (user && user.quizesInfo) {
          const quizInfoIndex = user.quizesInfo.findIndex(
            (q) => q._id.toString() === quiz._id.toString()
          );
          if (quizInfoIndex !== -1) {
            user.quizesInfo[quizInfoIndex].randomQuestionIndices = randomIndices;
            await user.save();
            console.log('Fallback: Updated randomQuestionIndices via save()');
          }
        }
      } else {
        console.log('Successfully saved random indices to database');
      }

      // Refresh userQuizInfo from database to get the saved indices
      const refreshedUser = await User.findById(req.userData._id);
      if (refreshedUser && refreshedUser.quizesInfo) {
        const refreshedQuizInfo = refreshedUser.quizesInfo.find(
          (q) => q._id.toString() === quiz._id.toString()
        );
        if (refreshedQuizInfo && refreshedQuizInfo.randomQuestionIndices) {
          userQuizInfo.randomQuestionIndices = refreshedQuizInfo.randomQuestionIndices;
          console.log('Refreshed userQuizInfo.randomQuestionIndices from database:', 
            userQuizInfo.randomQuestionIndices
          );
        } else {
          // If refresh failed, use the generated indices
          userQuizInfo.randomQuestionIndices = randomIndices;
          console.log('Using locally generated randomIndices:', randomIndices);
        }
      } else {
        // Fallback: use locally generated indices
        userQuizInfo.randomQuestionIndices = randomIndices;
        console.log('Fallback: Using locally generated randomIndices:', randomIndices);
      }
    } else {
      console.log('Using existing randomQuestionIndices:', userQuizInfo.randomQuestionIndices);
    }

    // Final safety check for randomQuestionIndices
    if (
      !userQuizInfo.randomQuestionIndices ||
      userQuizInfo.randomQuestionIndices.length === 0
    ) {
      console.log(
        'CRITICAL ERROR: randomQuestionIndices still empty after generation!'
      );
      console.log('Falling back to sequential indices');
      userQuizInfo.randomQuestionIndices = Array.from(
        { length: quiz.questionsCount },
        (_, i) => i
      );
    }

    console.log(
      'Final randomQuestionIndices before rendering:',
      userQuizInfo.randomQuestionIndices
    );

    // Parse query parameter for question number (1-based for UI)
    let questionNumber = parseInt(req.query.qNumber) || 1;

    // Ensure question number is within bounds
    const maxQuestions = userQuizInfo.randomQuestionIndices.length;
    console.log('Max questions available:', maxQuestions);
    console.log('Requested question number:', questionNumber);

    if (questionNumber > maxQuestions) {
      questionNumber = maxQuestions;
    }

    // Get the actual question index from the randomized indices (0-based)
    const actualQuestionIndex =
      userQuizInfo.randomQuestionIndices[questionNumber - 1];
    console.log(
      'Actual question index for question',
      questionNumber,
      ':',
      actualQuestionIndex
    );

    // Find the current question using the randomized index
    const question = quiz.Questions[actualQuestionIndex];

    if (!question) {
      console.log('Question not found at index', actualQuestionIndex);
      console.log('Total questions in quiz:', quiz.Questions.length);
      console.log('Question not found, redirecting to exams');
      return res.redirect('/student/exams');
    }

    // Normalize image field names for backward compatibility
    if (question.questionPhoto && !question.image) {
      question.image = question.questionPhoto;
    }

    console.log(
      'Successfully found question:',
      question.title || question.question
    );
    console.log('Question fields:', Object.keys(question));
    console.log('Question image field:', question.image);
    console.log('Question questionPhoto field:', question.questionPhoto);
    console.log(
      'Question has image?',
      !!(question.image || question.questionPhoto)
    );

    // Add the question number and total questions to the question object
    question.qNumber = questionNumber;
    question.totalQuestions = maxQuestions;
    question.actualIndex = actualQuestionIndex; // Store the actual index for answer tracking

    // Escape special characters in question text
    if (question.title) {
      question.title = escapeSpecialCharacters(question.title);
    }
    if (question.question) {
      question.question = escapeSpecialCharacters(question.question);
    }
    if (question.answer1) {
      question.answer1 = escapeSpecialCharacters(question.answer1);
    }
    if (question.answer2) {
      question.answer2 = escapeSpecialCharacters(question.answer2);
    }
    if (question.answer3) {
      question.answer3 = escapeSpecialCharacters(question.answer3);
    }
    if (question.answer4) {
      question.answer4 = escapeSpecialCharacters(question.answer4);
    }

    res.render('student/quiz-taking', {
      title: 'Quiz',
      path: req.path,
      quiz,
      userData: req.userData,
      question,
      userQuizInfo,
      maxQuestions,
    });
  } catch (error) {
    console.error('Quiz start error:', error);
    res.status(500).send('Internal Server Error');
  }
};

const quizFinish = async (req, res) => {
  try {
    const quizId = req.params.quizId;
    const quizObjId = new mongoose.Types.ObjectId(quizId);

    const quiz = await Quiz.findById(quizId);
    const userQuizInfo =
      req.userData.quizesInfo &&
      req.userData.quizesInfo.find(
        (q) => q._id.toString() === quiz._id.toString()
      );

    console.log('Finishing quiz:', quiz ? quiz.quizName : 'Not found');
    console.log('Quiz data received:', req.body);

    if (!quiz) {
      return res
        .status(404)
        .json({ success: false, message: 'Quiz not found' });
    }

    if (!userQuizInfo) {
      return res
        .status(400)
        .json({ success: false, message: 'Quiz not started' });
    }

    if (userQuizInfo.isEnterd && !userQuizInfo.inProgress) {
      return res
        .status(400)
        .json({ success: false, message: 'Quiz already completed' });
    }

    const quizData = req.body;
    let clientAnswers = quizData.answers || [];

    // Get the number of questions shown to the student
    const questionsShown = userQuizInfo.randomQuestionIndices
      ? userQuizInfo.randomQuestionIndices.length
      : quiz.questionsCount;

    console.log('Server-side score calculation starting...');
    console.log('Client answers received:', clientAnswers);
    console.log('Questions shown count:', questionsShown);
    console.log('User stored answers:', userQuizInfo.answers);

    // Convert client answers to new format and merge with existing answers
    // Build finalAnswers array where index corresponds to display order (i)
    const finalAnswers = [];

    if (userQuizInfo.randomQuestionIndices) {
      userQuizInfo.randomQuestionIndices.forEach((questionIndex, i) => {
        const question = quiz.Questions[questionIndex];
        const questionActualId = question._id
          ? question._id.toString()
          : null;

        // Look for existing answer by display index first (most reliable)
        let existingAnswer = userQuizInfo.answers.find(
          (a) => a.questionIndex === i
        );

        // If not found by display index, try to match by actual question ID
        if (!existingAnswer && questionActualId) {
          existingAnswer = userQuizInfo.answers.find(
            (a) => a.questionId === questionActualId
          );
        }

        // If no existing answer, check client answers
        if (!existingAnswer && clientAnswers[i]) {
          existingAnswer = {
            questionId: questionActualId || `q_${i}`,
            questionIndex: i,
            selectedAnswer: clientAnswers[i],
            answeredAt: new Date(),
          };
        }

        // Store answer at position i (display index) for direct access
        finalAnswers[i] = existingAnswer || null;
      });
    }

    console.log('Final answers array:', finalAnswers);

    // Calculate the actual score based on correct answers (server-side calculation for security)
    let calculatedScore = 0;

    if (userQuizInfo.randomQuestionIndices) {
      console.log(
        'Using randomQuestionIndices:',
        userQuizInfo.randomQuestionIndices
      );
      userQuizInfo.randomQuestionIndices.forEach((questionIndex, i) => {
        const question = quiz.Questions[questionIndex];
        const questionId = question._id
          ? question._id.toString()
          : `q_${questionIndex}`;

        // Get answer directly by display index (i) - this ensures correct matching
        const userAnswerObj = finalAnswers[i];

        console.log(
          `\n--- Question ${i + 1} (Pool Index ${questionIndex}) ---`
        );
        console.log('Question ID:', questionId);
        console.log('Question object:', question ? 'Found' : 'NOT FOUND');
        console.log('User answer object:', userAnswerObj);

        if (userAnswerObj && question) {
          const selectedAnswer = userAnswerObj.selectedAnswer;
          const answerIndex = parseInt(selectedAnswer.replace('answer', ''));
          console.log(`Selected answer: ${selectedAnswer}`);
          console.log(`Parsed answerIndex: ${answerIndex}`);
          console.log(`Correct answer (ranswer): ${question.ranswer}`);
          console.log(
            `Comparison: ${answerIndex} === ${question.ranswer} = ${
              answerIndex === question.ranswer
            }`
          );

          if (question.ranswer === answerIndex) {
            calculatedScore += 1; // Each correct answer is worth 1 point
            console.log(`✓ CORRECT! Score incremented to ${calculatedScore}`);
          } else {
            console.log(
              `✗ INCORRECT - Expected ${question.ranswer}, got ${answerIndex}`
            );
          }
        } else {
          console.log('Skipping - no answer or question not found');
        }
      });
    } else {
      console.log(
        'WARNING: No randomQuestionIndices found, cannot calculate score properly'
      );
    }

    console.log(
      `Final calculated score: ${calculatedScore} out of ${questionsShown}`
    );

    const finalScore = calculatedScore; // Use server-calculated score for security

    // Calculate percentage to determine if student can retake
    const percentage =
      questionsShown > 0 ? Math.round((finalScore / questionsShown) * 100) : 0;

    console.log(
      `Quiz completion: Score ${finalScore}/${questionsShown} (${percentage}%)`
    );

    // Update user's quiz info
    let updateResult;

    if (percentage >= 60) {
      // Student passed - mark as completed
      updateResult = await User.findOneAndUpdate(
        { _id: req.userData._id, 'quizesInfo._id': quizObjId },
        {
          $set: {
            'quizesInfo.$.answers': finalAnswers,
            'quizesInfo.$.Score': finalScore,
            'quizesInfo.$.inProgress': false,
            'quizesInfo.$.isEnterd': true,
            'quizesInfo.$.solvedAt': Date.now(),
            'quizesInfo.$.endTime': null,
            'quizesInfo.$.startTime': null,
          },
          $inc: {
            totalScore: finalScore,
            totalQuestions: questionsShown,
            examsEnterd: 1,
          },
        },
        { new: true }
      );
    } else {
      // Student failed - reset quiz for retake
      updateResult = await User.findOneAndUpdate(
        { _id: req.userData._id, 'quizesInfo._id': quizObjId },
        {
          $set: {
            'quizesInfo.$.answers': [],
            'quizesInfo.$.Score': 0,
            'quizesInfo.$.inProgress': false,
            'quizesInfo.$.isEnterd': false,
            'quizesInfo.$.solvedAt': null,
            'quizesInfo.$.endTime': null,
            'quizesInfo.$.startTime': null,
            'quizesInfo.$.randomQuestionIndices': [],
          },
        },
        { new: true }
      );
    }

    if (updateResult) {
      // Check if there's a corresponding video for the quiz in user's videosInfo
      if (quiz.videoWillbeOpen) {
        const videoInfo =
          req.userData.videosInfo &&
          req.userData.videosInfo.find(
            (video) => video._id.toString() === quiz.videoWillbeOpen.toString()
          );

        if (videoInfo) {
          // Only unlock video if student scored 60% or above
          if (percentage >= 60 && !videoInfo.isUserEnterQuiz) {
            // Update the video's entry to mark it as entered by the user
            await User.findOneAndUpdate(
              { _id: req.userData._id, 'videosInfo._id': videoInfo._id },
              { $set: { 'videosInfo.$.isUserEnterQuiz': true } }
            );
            console.log(
              `Video unlocked for user after passing quiz with ${percentage}%`
            );
          } else if (percentage < 60) {
            // Ensure video remains locked if score is below 60%
            await User.findOneAndUpdate(
              { _id: req.userData._id, 'videosInfo._id': videoInfo._id },
              { $set: { 'videosInfo.$.isUserEnterQuiz': false } }
            );
            console.log(
              `Video remains locked - student scored ${percentage}% (need 60%+)`
            );
          }
        }
      }

      // Send quiz completion notification to parent
      try {
        await sendQuizCompletionMessage(
          req.userData,
          quiz,
          finalScore,
          questionsShown,
          false, // isRetake - not tracking retakes currently
          null   // previousScore
        );
      } catch (notificationError) {
        console.error('Failed to send parent notification:', notificationError);
        // Don't fail the quiz completion if notification fails
      }

      console.log('Quiz finish response:', {
        finalScore,
        questionsShown,
        questionsPool: quiz.Questions.length,
        maxScore: questionsShown,
      });

      return res.json({
        success: true,
        message:
          percentage >= 60
            ? 'Quiz completed successfully!'
            : 'Quiz failed - You can retake for better score',
        score: finalScore,
        totalQuestions: questionsShown,
        percentage: percentage,
        canRetake: percentage < 60,
        questionsPool: quiz.Questions.length, // Total questions in the pool
        maxScore: questionsShown, // Maximum possible score for questions shown (1 point each)
        videoUnlocked: percentage >= 60 && quiz.videoWillbeOpen ? true : false,
      });
    } else {
      return res
        .status(500)
        .json({ success: false, message: 'Failed to save quiz results' });
    }
  } catch (error) {
    console.error('Quiz finish error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ================== Quiz Review ====================== //
const quiz_review = async (req, res) => {
  try {
    const quizId = req.params.quizId;
    const quiz = await Quiz.findById(quizId);

    console.log('=== QUIZ REVIEW DEBUG START ===');
    console.log('Quiz ID:', quizId);
    console.log('Quiz found:', quiz ? quiz.quizName : 'NOT FOUND');

    if (!quiz) {
      console.log('Quiz not found, redirecting to exams');
      return res.redirect('/student/exams');
    }

    // Find user's quiz info
    const userQuizInfo =
      req.userData.quizesInfo &&
      req.userData.quizesInfo.find(
        (q) => q._id.toString() === quiz._id.toString()
      );

    console.log('User quiz info found:', !!userQuizInfo);
    console.log(
      'Quiz completed (isEnterd):',
      userQuizInfo ? userQuizInfo.isEnterd : 'N/A'
    );

    // Check if user has completed this quiz
    if (!userQuizInfo || !userQuizInfo.isEnterd) {
      console.log(
        'Quiz not completed or user info missing, redirecting to exams'
      );
      return res.redirect('/student/exams');
    }

    // Get the questions that were actually shown to the user
    let userQuestions = [];
    let questionsShown = 0;

    if (
      userQuizInfo.randomQuestionIndices &&
      userQuizInfo.randomQuestionIndices.length > 0
    ) {
      // Use the saved random indices
      console.log(
        'Using saved randomQuestionIndices:',
        userQuizInfo.randomQuestionIndices
      );
      userQuestions = userQuizInfo.randomQuestionIndices
        .map((index) => {
          const question = quiz.Questions[index];
          if (question) {
            // Normalize image field names for backward compatibility
            const normalizedQuestion = { ...question };
            if (normalizedQuestion.questionPhoto && !normalizedQuestion.image) {
              normalizedQuestion.image = normalizedQuestion.questionPhoto;
            }
            return {
              ...normalizedQuestion,
              originalIndex: index,
            };
          }
          return null;
        })
        .filter((q) => q !== null);
      questionsShown = userQuestions.length;
    } else {
      // Fallback: use sequential questions based on questionsToShow
      const questionsToShow = quiz.questionsToShow || quiz.questionsCount;
      console.log(
        'No randomQuestionIndices found, using fallback with questionsToShow:',
        questionsToShow
      );

      userQuestions = quiz.Questions.slice(0, questionsToShow).map(
        (question, index) => {
          // Normalize image field names for backward compatibility
          const normalizedQuestion = { ...question };
          if (normalizedQuestion.questionPhoto && !normalizedQuestion.image) {
            normalizedQuestion.image = normalizedQuestion.questionPhoto;
          }
          return {
            ...normalizedQuestion,
            originalIndex: index,
          };
        }
      );
      questionsShown = userQuestions.length;
    }

    console.log('Total questions in pool:', quiz.Questions.length);
    console.log('Questions shown to user:', questionsShown);
    console.log(
      'User answers array length:',
      userQuizInfo.answers ? userQuizInfo.answers.length : 0
    );

    // Calculate answered count based on saved answers only (summary will trust saved Score)
    let answeredCount = 0;

    userQuestions.forEach((question, index) => {
      const questionId = question._id
        ? question._id.toString()
        : `q_${question.originalIndex}`;

      // Find the user's answer for this specific question
      let userAnswerObj = null;
      if (userQuizInfo.answers && Array.isArray(userQuizInfo.answers)) {
        // New format: array of objects
        userAnswerObj = userQuizInfo.answers.find(
          (a) =>
            a.questionId === questionId ||
            a.questionIndex === index ||
            a.questionIndex === question.originalIndex
        );
      } else if (userQuizInfo.answers && userQuizInfo.answers[index]) {
        // Legacy format: simple array
        userAnswerObj = {
          selectedAnswer: userQuizInfo.answers[index],
        };
      }

      console.log(
        `Question ${
          index + 1
        } (ID: ${questionId}): userAnswerObj=${JSON.stringify(
          userAnswerObj
        )}, correctAnswer=${question.ranswer}`
      );

      if (userAnswerObj && userAnswerObj.selectedAnswer) {
        answeredCount++;
      } else {
        console.log(`Question ${index + 1}: UNANSWERED`);
      }
    });

    // Summary consistency: trust saved score and derive incorrect/unanswered from answered count
    const correctAnswers = userQuizInfo.Score || 0;
    const unansweredQuestions = Math.max(0, questionsShown - answeredCount);
    const incorrectAnswers = Math.max(0, answeredCount - correctAnswers);

    console.log('Final stats:', {
      correctAnswers,
      incorrectAnswers,
      unansweredQuestions,
      totalShown: questionsShown,
      userScore: userQuizInfo.Score,
    });
    console.log('=== QUIZ REVIEW DEBUG END ===');

    // Check if answers should be shown after quiz
    const shouldShowAnswers = quiz.showAnswersAfterQuiz !== false; // Default to true if not set

    // If answers shouldn't be shown, redirect to exams page
    if (!shouldShowAnswers) {
      return res.redirect('/student/exams?message=answers_hidden');
    }

    res.render('student/quiz-review', {
      title: 'مراجعة الامتحان',
      path: req.path,
      quiz: quiz,
      userData: req.userData,
      userQuizInfo: userQuizInfo,
      userQuestions: userQuestions,
      questionsShown: questionsShown,
      totalQuestionsPool: quiz.Questions.length,
      correctAnswers: correctAnswers,
      incorrectAnswers: incorrectAnswers,
      unansweredQuestions: unansweredQuestions,
      shouldShowAnswers: shouldShowAnswers, // Pass this to the view
    });
  } catch (error) {
    console.error('Quiz review error:', error);
    res.redirect('/student/exams');
  }
};

// Save quiz answer to server
const saveQuizAnswer = async (req, res) => {
  try {
    const quizId = req.params.quizId;
    const { questionIndex, answer, questionId } = req.body;

    console.log('Saving answer:', {
      quizId,
      questionIndex,
      answer,
      questionId,
    });

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res
        .status(404)
        .json({ success: false, message: 'Quiz not found' });
    }

    // Find user's quiz info
    const userQuizInfo =
      req.userData.quizesInfo &&
      req.userData.quizesInfo.find(
        (q) => q._id.toString() === quiz._id.toString()
      );

    if (!userQuizInfo) {
      return res
        .status(400)
        .json({ success: false, message: 'Quiz not started' });
    }

    // Get the actual question ID from the quiz if not provided
    let actualQuestionId = questionId;
    if (!actualQuestionId && userQuizInfo.randomQuestionIndices) {
      // Get the question from the randomized indices
      const poolIndex = userQuizInfo.randomQuestionIndices[questionIndex];
      if (poolIndex !== undefined && quiz.Questions[poolIndex]) {
        const question = quiz.Questions[poolIndex];
        actualQuestionId = question.id || question._id?.toString() || `q_${poolIndex}`;
      }
    }
    
    // Fallback to index-based ID if still not found
    if (!actualQuestionId) {
      actualQuestionId = `q_${questionIndex}`;
    }
    
    // Create or update answer object
    const answerObj = {
      questionId: actualQuestionId, // Use stable question ID
      questionIndex: questionIndex, // Display index for quick lookup
      selectedAnswer: answer,
      answeredAt: new Date(),
    };

    // Remove existing answer for this question if any (match by display index first)
    // This ensures we remove the correct answer even if questionId format changed
    await User.findOneAndUpdate(
      { _id: req.userData._id, 'quizesInfo._id': quiz._id },
      { $pull: { 'quizesInfo.$.answers': { questionIndex: questionIndex } } }
    );

    // Add new answer
    await User.findOneAndUpdate(
      { _id: req.userData._id, 'quizesInfo._id': quiz._id },
      { $push: { 'quizesInfo.$.answers': answerObj } }
    );

    console.log('Answer saved successfully:', answerObj);
    res.json({ success: true, message: 'Answer saved successfully' });
  } catch (error) {
    console.error('Error saving quiz answer:', error);
    res.status(500).json({ success: false, message: 'Failed to save answer' });
  }
};

// ================== END quiz  ====================== //

const settings_get = async (req, res) => {
  try {
    // Ensure userData is available
    if (!req.userData) {
      return res.status(401).redirect('/login');
    }

    res.render('student/settings', {
      title: 'Settings',
      path: req.path,
      userData: req.userData,
    });
  } catch (error) {
    console.error('Error in settings_get:', error);
    res.status(500).send(error.message);
  }
};

const settings_post = async (req, res) => {
  try {
    const { Username, gov, userPhoto } = req.body;
    console.log(Username, gov);
    const user = await User.findByIdAndUpdate(req.userData._id, {
      Username: Username,
      gov: gov,
      userPhoto: userPhoto,
    });

    res.redirect('/student/settings');
  } catch (error) {
    res.send(error.message);
  }
};

// end OF SETTINGS

// ==================  PDFs  ====================== //

const PDFs_get = async (req, res) => {
  try {
    const PDFdata = await PDFs.find({ pdfGrade: req.userData.Grade }).sort({
      createdAt: 1,
    });
    console.log(PDFdata);

    const PaidPDFs = PDFdata.map((PDF) => {
      // Ensure PDFsPaid is an array and ONLY use it for access (ignore general access)
      const pdfsPaid = req.userData.PDFsPaid || [];
      const isPaid = pdfsPaid.some(
        (pdf) => pdf.toString() === PDF._id.toString()
      );
      console.log('PDF access check:', {
        pdfId: PDF._id,
        pdfName: PDF.pdfName,
        pdfsPaid: pdfsPaid.length,
        isPaid
      });
      return { ...PDF.toObject(), isPaid };
    });
    res.render('student/PDFs', {
      title: 'PDFs',
      path: req.path,
      PDFs: PaidPDFs,
      userData: req.userData,
    });
  } catch (error) {
    res.send(error.message);
  }
};

const getPDF = async (req, res) => {
  try {
    const pdfId = req.params.PDFID;
    const pdf = await PDFs.findById(pdfId);

    if (!pdf) {
      return res.status(404).send('PDF not found');
    }

    console.log('PDF access request:', { pdfId, pdfName: pdf.pdfName });

    // Fetch fresh user snapshot to avoid stale session data after purchase
    const freshUser = await User.findById(req.userData._id).select(
      'PDFsPaid'
    );

    // Check if user has access to this PDF (only via explicit purchase)
    const pdfsPaid = (freshUser && freshUser.PDFsPaid) || [];
    const isPaid = pdfsPaid.some((pdf) => pdf.toString() === pdfId.toString());

    console.log('User access check:', {
      isPaid,
      pdfStatus: pdf.pdfStatus,
      pdfsPaid: pdfsPaid.length,
      pdfsPaidArray: pdfsPaid.map((p) => p.toString()),
      pdfId: pdfId
    });

    // Access control logic: treat any non-Free status as paid (handles 'Paid' and legacy 'Pay')
    if (pdf.pdfStatus !== 'Free') {
      if (!isPaid) {
        return res.redirect('/student/PDFs?error=access_denied');
      }
    }

    // Check if PDF has Google Drive integration
    if (pdf.googleDriveFileId) {
      console.log(
        'Using Google Drive integration for PDF:',
        pdf.googleDriveFileId
      );

      // Generate secure view URL
      const secureViewUrl = pdf.generateSecureViewUrl();

      // Track PDF view and user access
      await pdf.incrementViewCount();

      // Track user's PDF access
      const userPDFAccess = req.userData.pdfAccess || [];
      const existingAccess = userPDFAccess.find(
        (access) => access.pdfId.toString() === pdfId
      );

      if (!existingAccess) {
        // First time accessing this PDF
        userPDFAccess.push({
          pdfId: pdfId,
          firstAccess: new Date(),
          lastAccess: new Date(),
          viewCount: 1,
          totalViewTime: 0,
        });
      } else {
        // Update existing access
        existingAccess.lastAccess = new Date();
        existingAccess.viewCount += 1;
      }

      req.userData.pdfAccess = userPDFAccess;
      await req.userData.save();

      // Store user's view start time for time-limited access
      const viewStartTime = new Date();

      res.render('student/ViewPDF', {
        title: `View PDF - ${pdf.pdfName}`,
        path: req.path,
        pdf: pdf,
        userData: req.userData,
        secureViewUrl: secureViewUrl,
        viewStartTime: viewStartTime,
        isGoogleDrive: true,
        securitySettings: {
          allowDownload: pdf.allowDownload,
          allowPrint: pdf.allowPrint,
          allowCopy: pdf.allowCopy,
          maxViews: pdf.maxViews,
          viewTimeLimit: pdf.viewTimeLimit,
        },
      });
    } else if (pdf.pdfLink) {
      console.log('Using legacy PDF link');

      // Track PDF view
      await pdf.incrementViewCount();

      res.render('student/ViewPDF', {
        title: `View PDF - ${pdf.pdfName}`,
        path: req.path,
        pdf: pdf,
        userData: req.userData,
        secureViewUrl: pdf.pdfLink,
        isGoogleDrive: false,
        securitySettings: {
          allowDownload: pdf.allowDownload,
          allowPrint: pdf.allowPrint,
          allowCopy: pdf.allowCopy,
          maxViews: pdf.maxViews,
          viewTimeLimit: pdf.viewTimeLimit,
        },
      });
    } else {
      return res.status(400).send('PDF source not configured');
    }
  } catch (error) {
    console.error('PDF access error:', error);
    res.status(500).send('Internal server error');
  }
};

const buyPDF = async (req, res) => {
  try {
    const pdfId = req.params.PDFID;
    const code = req.body.code;

    // Validate PDF exists
    const pdf = await PDFs.findById(pdfId);
    if (!pdf) {
      return res.redirect('/student/PDFs?error=pdf_not_found');
    }

    // Check grade compatibility
    if (!req.userData.canPurchaseContent(pdf.pdfGrade)) {
      return res.redirect('/student/PDFs?error=grade_mismatch');
    }

    // Find and validate code (specific PDF code or general PDF code)
    const codeData = await Code.findOne({
      Code: code.toUpperCase(),
      isUsed: false,
      $or: [{ codeType: 'PDF' }, { codeType: 'GeneralPDF' }],
      isActive: true,
    });

    if (!codeData) {
      return res.redirect('/student/PDFs?error=invalid_code');
    }

    // IMPORTANT: If this is a GeneralPDF code, check if specific codes exist for this PDF
    // General codes should NOT work if specific codes exist for the PDF
    const isGeneralCode = codeData.codeType === 'GeneralPDF' || 
                          (codeData.isGeneralCode && (!codeData.contentId || codeData.contentId === null));
    
    if (isGeneralCode) {
      console.log('This is a general PDF code, checking if specific codes exist for PDF:', pdfId);
      // Check if any specific PDF codes exist for this PDF (codeType='PDF' with matching contentId)
      const specificCodeExists = await Code.findOne({
        codeType: 'PDF',
        contentId: new mongoose.Types.ObjectId(pdfId),
        isActive: true
      });

      if (specificCodeExists) {
        console.log('Specific code exists for this PDF, rejecting general code');
        return res.redirect('/student/PDFs?error=specific_code_required');
      }
    }

    // Validate code can be used by this user
    const codeValidation = codeData.canBeUsedBy(req.userData);
    if (!codeValidation.valid) {
      return res.redirect(
        `/student/PDFs?error=${encodeURIComponent(codeValidation.reason)}`
      );
    }

    // Check if code is for this specific PDF (only for non-general codes)
    if (
      !codeData.isGeneralCode &&
      codeData.contentId &&
      codeData.contentId.toString() !== pdfId.toString()
    ) {
      return res.redirect('/student/PDFs?error=code_pdf_mismatch');
    }

    // Additional check for grade compatibility (unless code works for all grades)
    if (
      !codeData.isAllGrades &&
      !req.userData.canPurchaseContent(pdf.pdfGrade)
    ) {
      return res.redirect('/student/PDFs?error=grade_mismatch');
    }

    // Process PDF purchase (treat GeneralPDF as specific purchase for this pdf)
    if (codeData.isGeneralCode && codeData.codeType === 'GeneralPDF') {
      console.log('Redeeming GeneralPDF code as specific PDF purchase:', {
        user: req.userData.Username,
        code,
        pdfId
      });
    }

    // Grant PDF access (works for both GeneralPDF and specific PDF codes)
    {
      console.log('Adding PDF purchase:', {
        pdfId: pdfId,
        pdfName: pdf.pdfName,
        code: code,
        userId: req.userData._id,
      });

      // Ensure PDFsPaid is an array
      if (!req.userData.PDFsPaid) {
        req.userData.PDFsPaid = [];
      }

      const pdfObjectId = new mongoose.Types.ObjectId(pdfId);
      if (
        !req.userData.PDFsPaid.some((p) => p.toString() === pdfId.toString())
      ) {
        req.userData.PDFsPaid.push(pdfObjectId);
      }

      console.log('PDF added to user PDFsPaid:', {
        pdfId: pdfId,
        pdfObjectId: pdfObjectId,
        pdfsPaidLength: req.userData.PDFsPaid.length,
      });
    }

    await codeData.markAsUsed(req.userData);
    await req.userData.save();

    console.log('PDF purchase successful:', {
      pdfId,
      userId: req.userData._id,
      isGeneral: codeData.isGeneralCode,
    });

    // Redirect to PDF view with success message
    return res.redirect(`/student/getPDF/${pdfId}?success=purchase_completed`);
  } catch (error) {
    console.error('Buy PDF error:', error);
    return res.redirect('/student/PDFs?error=server_error');
  }
};

// ================== END PDFs  ====================== //

// Enhanced video purchase with proper redirect
const buyVideo = async (req, res) => {
  try {
    const videoId = req.params.videoId;
    const chapterId = req.params.chapterId;
    const code = req.body.code;

    console.log('Buy video request:', { videoId, chapterId, code });

    // Validate chapter and video exist
    const chapter = await Chapter.findById(chapterId);
    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Chapter not found',
        redirect: '/student/chapters?error=chapter_not_found',
      });
    }

    // Find video in chapter
    let video = null;
    let videoType = '';

    console.log('Searching for video:', videoId, 'in chapter:', chapterId);
    console.log(
      'Chapter lectures count:',
      chapter.chapterLectures ? chapter.chapterLectures.length : 0
    );
    console.log(
      'Chapter summaries count:',
      chapter.chapterSummaries ? chapter.chapterSummaries.length : 0
    );
    console.log(
      'Chapter solvings count:',
      chapter.chapterSolvings ? chapter.chapterSolvings.length : 0
    );

    if (chapter.chapterLectures) {
      video = chapter.chapterLectures.find(
        (lecture) => lecture._id.toString() === videoId
      );
      if (video) {
        videoType = 'lecture';
        console.log(
          'Found video in lectures:',
          video.lectureName || video.videoName
        );
      }
    }
    if (!video && chapter.chapterSummaries) {
      video = chapter.chapterSummaries.find(
        (summary) => summary._id.toString() === videoId
      );
      if (video) {
        videoType = 'summary';
        console.log(
          'Found video in summaries:',
          video.lectureName || video.videoName
        );
      }
    }
    if (!video && chapter.chapterSolvings) {
      video = chapter.chapterSolvings.find(
        (solving) => solving._id.toString() === videoId
      );
      if (video) {
        videoType = 'solving';
        console.log(
          'Found video in solvings:',
          video.lectureName || video.videoName
        );
      }
    }

    if (!video) {
      console.log('Video not found in any chapter section');
      return res.status(404).json({
        success: false,
        message: 'Video not found',
        redirect: `/student/chapter/${chapterId}?error=video_not_found`,
      });
    }

    console.log('Video found successfully:', {
      videoId: video._id,
      videoName: video.lectureName || video.videoName,
      videoType: videoType,
      paymentStatus: video.paymentStatus,
      prerequisites: video.prerequisites,
      accessibleAfterViewing: video.AccessibleAfterViewing,
    });

    // Check prerequisites before allowing purchase
    if (video.prerequisites && video.prerequisites !== 'none') {
      console.log('Video has prerequisites:', video.prerequisites);

      if (video.AccessibleAfterViewing) {
        // Find the prerequisite video info in user's videosInfo
        const prerequisiteVideoInfo = req.userData.videosInfo.find(
          (v) => v._id.toString() === video.AccessibleAfterViewing.toString()
        );

        console.log(
          'Prerequisite video info found:',
          prerequisiteVideoInfo ? 'Yes' : 'No'
        );

        if (prerequisiteVideoInfo) {
          let canPurchase = true;
          let prerequisiteMessage = '';

          if (video.prerequisites === 'WithExamaAndHw') {
            canPurchase =
              prerequisiteVideoInfo.isUserEnterQuiz &&
              prerequisiteVideoInfo.isUserUploadPerviousHWAndApproved;
            if (!canPurchase) {
              prerequisiteMessage = 'يجب إكمال الاختبار وتسليم الواجب أولاً';
            }
          } else if (video.prerequisites === 'WithExam') {
            canPurchase = prerequisiteVideoInfo.isUserEnterQuiz;
            if (!canPurchase) {
              prerequisiteMessage = 'يجب إكمال الاختبار أولاً';
            }
          } else if (video.prerequisites === 'WithHw') {
            canPurchase =
              prerequisiteVideoInfo.isUserUploadPerviousHWAndApproved;
            if (!canPurchase) {
              prerequisiteMessage = 'يجب تسليم الواجب أولاً';
            }
          }

          if (!canPurchase) {
            console.log('Prerequisites not met:', prerequisiteMessage);
            return res.status(400).json({
              success: false,
              message: prerequisiteMessage,
              redirect: `/student/chapter/${chapterId}?error=prerequisites_not_met&message=${encodeURIComponent(
                prerequisiteMessage
              )}`,
            });
          }
        } else {
          console.log('Prerequisite video not found in user videosInfo');
          return res.status(400).json({
            success: false,
            message: 'المتطلبات السابقة غير مكتملة',
            redirect: `/student/chapter/${chapterId}?error=prerequisites_not_found`,
          });
        }
      }
    }

    // Check grade compatibility
    if (!req.userData.canPurchaseContent(chapter.chapterGrade)) {
      return res.status(403).json({
        success: false,
        message: 'Grade mismatch',
        redirect: `/student/chapter/${chapterId}?error=grade_mismatch`,
      });
    }

    // Check if user already has access
    console.log('Checking if user already has access to video:', videoId);
    console.log('User videosPaid array:', req.userData.videosPaid);
    console.log(
      'User videosInfo count:',
      req.userData.videosInfo ? req.userData.videosInfo.length : 0
    );

    const hasAccess = req.userData.hasVideoAccess(videoId, video);
    console.log('User has access to video:', hasAccess);

    if (hasAccess) {
      console.log('User already has access, redirecting');
      return res.status(200).json({
        success: true,
        message: 'Already have access',
        redirect: `/student/chapter/${chapterId}/video/${videoId}`,
      });
    }

    // Find and validate code (specific video code or general video code)
    console.log('Searching for code:', code);
    const codeData = await Code.findOne({
      Code: code,
      isUsed: false,
      $or: [{ codeType: 'Video' }, { codeType: 'GeneralVideo' }],
      isActive: true,
    });

    console.log('Code found:', codeData ? 'Yes' : 'No');
    if (codeData) {
      console.log('Code details:', {
        code: codeData.Code,
        codeType: codeData.codeType,
        isGeneralCode: codeData.isGeneralCode,
        contentId: codeData.contentId,
        isUsed: codeData.isUsed,
        isActive: codeData.isActive,
      });
    }

    if (!codeData) {
      console.log('Code not found or invalid');
      return res.status(400).json({
        success: false,
        message: 'Invalid or used code',
        redirect: `/student/chapter/${chapterId}?error=invalid_code`,
      });
    }

    // IMPORTANT: If this is a GeneralVideo code, check if specific codes exist for this video
    // General codes should NOT work if specific codes exist for the video
    const isGeneralCode = codeData.codeType === 'GeneralVideo' || 
                          (codeData.isGeneralCode && (!codeData.contentId || codeData.contentId === null));
    
    if (isGeneralCode) {
      console.log('This is a general code, checking if specific codes exist for video:', videoId);
      // Check if any specific Video codes exist for this video (codeType='Video' with matching contentId)
      const specificCodeExists = await Code.findOne({
        codeType: 'Video',
        contentId: new mongoose.Types.ObjectId(videoId),
        isActive: true
      });

      if (specificCodeExists) {
        console.log('Specific code exists for this video, rejecting general code');
        console.log('Found specific code:', {
          code: specificCodeExists.Code,
          contentId: specificCodeExists.contentId,
          isGeneralCode: specificCodeExists.isGeneralCode
        });
        return res.status(400).json({
          success: false,
          message: 'This video requires a specific code. General codes cannot be used for videos with specific codes.',
          redirect: `/student/chapter/${chapterId}?error=specific_code_required`,
        });
      }
    }

    // Check if code is for this specific video (if contentId is specified)
    if (
      codeData.contentId &&
      codeData.contentId.toString() !== videoId.toString()
    ) {
      return res.status(400).json({
        success: false,
        message: 'Code is not for this video',
        redirect: `/student/chapter/${chapterId}?error=code_video_mismatch`,
      });
    }

    // Validate code can be used by this user (including all grades check)
    console.log('Validating code for user:', req.userData.Username);
    const codeValidation = codeData.canBeUsedBy(req.userData);
    console.log('Code validation result:', codeValidation);

    if (!codeValidation.valid) {
      console.log('Code validation failed:', codeValidation.reason);
      return res.status(400).json({
        success: false,
        message: codeValidation.reason,
        redirect: `/student/chapter/${chapterId}?error=${encodeURIComponent(
          codeValidation.reason
        )}`,
      });
    }

    // Additional check for grade compatibility (unless code works for all grades)
    if (
      !codeData.isAllGrades &&
      !req.userData.canPurchaseContent(chapter.chapterGrade)
    ) {
      return res.status(403).json({
        success: false,
        message: 'Grade mismatch',
        redirect: `/student/chapter/${chapterId}?error=grade_mismatch`,
      });
    }

    // Process video purchase (treat GeneralVideo as specific purchase for this video)
    if (codeData.isGeneralCode && codeData.codeType === 'GeneralVideo') {
      console.log('Redeeming GeneralVideo code as specific video purchase:', {
        user: req.userData.Username,
        code,
        videoId
      });
    }

    // Grant video access (works for both GeneralVideo and specific Video codes)
    {
      console.log('Adding video purchase:', {
        videoId: videoId,
        videoName: video.videoName || video.lectureName,
        chapterId: chapterId,
        code: code,
        userId: req.userData._id,
      });

      try {
        await req.userData.addVideoPurchase(
          videoId,
          video.videoName || video.lectureName,
          chapterId,
          code
        );
        console.log(
          'Video purchase successful. User videosPaid array length:',
          req.userData.videosPaid ? req.userData.videosPaid.length : 'undefined'
        );
      } catch (purchaseError) {
        console.error('Error in addVideoPurchase:', purchaseError);
        return res.status(500).json({
          success: false,
          message: 'Failed to process video purchase',
          redirect: `/student/chapter/${chapterId}?error=purchase_processing_failed`,
        });
      }
    }

    try {
      await codeData.markAsUsed(req.userData);
      console.log('Code marked as used successfully');
    } catch (codeError) {
      console.error('Error marking code as used:', codeError);
      // Don't fail the purchase if code marking fails
    }

    console.log('Video purchase successful');

    // Return success response with redirect
    return res.status(200).json({
      success: true,
      message: 'Video purchased successfully',
      redirect: `/student/chapter/${chapterId}/video/${videoId}?success=video_purchased`,
    });
  } catch (error) {
    console.error('Buy video error:', error);
    return res.status(500).json({
      success: false,
      message: 'Purchase failed',
      redirect: `/student/chapter/${req.params.chapterId}?error=purchase_failed`,
    });
  }
};

// Legacy video purchase route (for backward compatibility)
const buyVideoLegacy = async (req, res) => {
  res.status(400).json({
    success: false,
    message:
      'Please use the new video purchase format: /chapter/:chapterId/video/:videoId/buy',
  });
};

// ================== End Video Purchase  ====================== //

// ================== LogOut  ====================== //

const logOut = async (req, res) => {
  // Clearing the token cookie
  res.clearCookie('token');
  // Redirecting to the login page or any other desired page
  res.redirect('../login');
};

// ================== END LogOut  ====================== //

// ==================  Chapter Content (Unified View)  ====================== //

const chapter_content_get = async (req, res) => {
  try {
    const chapterId = req.params.chapterId;
    const chapter = await Chapter.findById(chapterId);

    if (!chapter) {
      return res.status(404).send('Chapter not found');
    }

    // Check if user can access this chapter's grade
    if (!req.userData.canPurchaseContent(chapter.chapterGrade)) {
      return res.redirect('/student/chapters?error=grade_mismatch');
    }

    // Get all quizzes for this chapter
    const quizzes = await Quiz.find({
      chapterId: chapterId,
      Grade: req.userData.Grade,
    });

    // Get all PDFs for this chapter
    const chapterPDFs = await PDFs.find({
      chapterId: chapterId,
      pdfGrade: req.userData.Grade,
    });

    // Get all quizzes for the user's grade to help with prerequisite quiz name resolution
    const allGradeQuizzes = await Quiz.find({
      Grade: req.userData.Grade,
      isQuizActive: true,
    }).select('_id quizName videoWillbeOpen');

    // Check user access to chapter and content
    const hasChapterAccess = req.userData.hasChapterAccess(chapterId);

    // Calculate chapter progress statistics
    const allVideos = [
      ...(chapter.chapterLectures || []),
      ...(chapter.chapterSummaries || []),
      ...(chapter.chapterSolvings || []),
    ];

    const totalVideos = allVideos.length;
    const totalQuizzes = quizzes.length;
    const totalContent = totalVideos + totalQuizzes;

    // Calculate completed videos (videos that have been watched at least once)
    const watchedVideos = req.userData.videosInfo
      ? req.userData.videosInfo.filter(
          (videoInfo) =>
            allVideos.some(
              (video) => video._id.toString() === videoInfo._id.toString()
            ) && videoInfo.numberOfWatches > 0
        ).length
      : 0;

    // Calculate completed quizzes
    const completedQuizzes = req.userData.quizesInfo
      ? req.userData.quizesInfo.filter(
          (quizInfo) =>
            quizzes.some(
              (quiz) => quiz._id.toString() === quizInfo._id.toString()
            ) && quizInfo.isEnterd
        ).length
      : 0;

    const completedContent = watchedVideos + completedQuizzes;
    const progressPercentage =
      totalContent > 0
        ? Math.round((completedContent / totalContent) * 100)
        : 0;

    res.render('student/chapter-content', {
      title: chapter.chapterName,
      path: req.path,
      chapter: chapter,
      quizzes: quizzes,
      chapterPDFs: chapterPDFs,
      allGradeQuizzes: allGradeQuizzes, // Add this to help with quiz name resolution
      userData: req.userData,
      hasChapterAccess: hasChapterAccess,
      totalVideos: totalVideos,
      totalQuizzes: totalQuizzes,
      totalContent: totalContent,
      watchedVideos: watchedVideos,
      completedQuizzes: completedQuizzes,
      completedContent: completedContent,
      progressPercentage: progressPercentage,
      error: req.query.error,
      success: req.query.success,
    });
  } catch (error) {
    console.error('Chapter content error:', error);
    res.status(500).send('Internal Server Error');
  }
};

// ==================  Chapter Videos  ====================== //

const chapter_videos_get = async (req, res) => {
  try {
    const chapterId = req.params.chapterId;
    const chapter = await Chapter.findById(chapterId);

    if (!chapter) {
      return res.status(404).send('Chapter not found');
    }

    const hasChapterAccess =
      req.userData.chaptersPaid &&
      req.userData.chaptersPaid.includes(chapterId);

    res.render('student/chapter-videos', {
      title: `${chapter.chapterName} - الفيديوهات`,
      path: req.path,
      userData: req.userData,
      chapter: chapter,
      hasChapterAccess: hasChapterAccess,
      chapterId: chapterId,
    });
  } catch (error) {
    console.error('Error in chapter_videos_get:', error);
    res.status(500).send('Server error');
  }
};

// ==================  Video Watch (Enhanced)  ====================== //

const video_watch_get = async (req, res) => {
  try {
    const { chapterId, videoId } = req.params;
    const chapter = await Chapter.findById(chapterId);

    if (!chapter) {
      return res.status(404).send('Chapter not found');
    }

    let video = null;
    let videoType = '';

    // Find video in chapter lectures, summaries, or solvings (using legacy structure)
    if (chapter.chapterLectures && chapter.chapterLectures.length > 0) {
      video = chapter.chapterLectures.find(
        (lecture) => lecture._id.toString() === videoId
      );
      if (video) videoType = 'lecture';
    }
    if (
      !video &&
      chapter.chapterSummaries &&
      chapter.chapterSummaries.length > 0
    ) {
      video = chapter.chapterSummaries.find(
        (summary) => summary._id.toString() === videoId
      );
      if (video) videoType = 'summary';
    }
    if (
      !video &&
      chapter.chapterSolvings &&
      chapter.chapterSolvings.length > 0
    ) {
      video = chapter.chapterSolvings.find(
        (solving) => solving._id.toString() === videoId
      );
      if (video) videoType = 'solving';
    }

    if (!video) {
      return res.status(404).send('Video not found');
    }

    const hasChapterAccess =
      req.userData.chaptersPaid &&
      req.userData.chaptersPaid.includes(chapterId);
    const hasVideoAccess = req.userData.hasVideoAccess(videoId, video);

    // Get user video info
    const userVideoInfo =
      (req.userData.videosInfo &&
        req.userData.videosInfo.find(
          (v) => v._id.toString() === videoId.toString()
        )) ||
      null;

    console.log('Looking for videoId:', videoId);
    console.log(
      'User videosInfo count:',
      req.userData.videosInfo ? req.userData.videosInfo.length : 0
    );
    console.log('Found userVideoInfo:', userVideoInfo ? 'Yes' : 'No');
    if (userVideoInfo) {
      console.log('UserVideoInfo ID:', userVideoInfo._id);
      console.log('UserVideoInfo attempts:', userVideoInfo.videoAllowedAttemps);
    }

    // Check access permissions (including prerequisites)
    if (video.paymentStatus === 'Pay' && !hasVideoAccess) {
      return res.redirect(`/student/chapter/${chapterId}`);
    }

    // Check if user has remaining attempts
    if (userVideoInfo && userVideoInfo.videoAllowedAttemps <= 0) {
      return res.redirect(`/student/chapter/${chapterId}?error=no_attempts`);
    }

    // Track video watch immediately when user enters the page
    if (userVideoInfo && userVideoInfo.videoAllowedAttemps > 0) {
      // Update user's video watch info immediately
      await User.findOneAndUpdate(
        { _id: req.userData._id, 'videosInfo._id': videoId },
        {
          $set: {
            'videosInfo.$.lastWatch': Date.now(),
            'videosInfo.$.hasWatched10Percent': true,
          },
          $inc: {
            'videosInfo.$.numberOfWatches': 1,
            'videosInfo.$.videoAllowedAttemps': -1,
          },
        }
      );

      // Set first watch if not already set
      if (!userVideoInfo.fristWatch) {
        await User.findOneAndUpdate(
          { _id: req.userData._id, 'videosInfo._id': videoId },
          { $set: { 'videosInfo.$.fristWatch': Date.now() } }
        );
      }
    }

    // Calculate watch progress (always 100% since we count immediately)
    const watchProgress = 100;

    // Get related videos from the same chapter (using legacy structure)
    const relatedVideos = [];
    if (chapter.chapterLectures) relatedVideos.push(...chapter.chapterLectures);
    if (chapter.chapterSummaries)
      relatedVideos.push(...chapter.chapterSummaries);
    if (chapter.chapterSolvings) relatedVideos.push(...chapter.chapterSolvings);

    // Get homework submission for this video (now available for any video)
    let homeworkSubmission = null;
    homeworkSubmission =
      req.userData.homeworkSubmissions &&
      req.userData.homeworkSubmissions.find(
        (submission) => submission.videoId.toString() === videoId.toString()
      );

    res.render('student/video-watch', {
      title: `${
        video.lectureName || video.videoName || video.name
      } - مشاهدة الفيديو`,
      path: req.path,
      userData: req.userData,
      chapter: chapter,
      chapterName: chapter.chapterName,
      video: video,
      videoType: videoType,
      userVideoInfo: userVideoInfo,
      hasChapterAccess: hasChapterAccess,
      hasVideoAccess: hasVideoAccess,
      relatedVideos: relatedVideos.filter((v) => v._id.toString() !== videoId),
      chapterId: chapterId,
      videoId: videoId,
      watchProgress: watchProgress,
      videoViewsCount: video.views || 0,
      homeworkSubmission: homeworkSubmission,
    });
  } catch (error) {
    console.error('Error in video_watch_get:', error);
    res.status(500).send('Server error');
  }
};

// Video tracking endpoint removed - tracking is now immediate on page entry

// ==================  Chapter Quizzes  ====================== //

const chapter_quizzes_get = async (req, res) => {
  try {
    const chapterId = req.params.chapterId;
    const chapter = await Chapter.findById(chapterId);

    if (!chapter) {
      return res.status(404).send('Chapter not found');
    }

    const quizzes = await Quiz.find({
      chapterId: chapterId,
      Grade: req.userData.Grade,
      isQuizActive: true, // Only show active quizzes
      permissionToShow: true, // Only show quizzes that are set to be visible
    });

    const hasChapterAccess =
      req.userData.chaptersPaid &&
      req.userData.chaptersPaid.includes(chapterId);

    res.render('student/chapter-quizzes', {
      title: `${chapter.chapterName} - الاختبارات`,
      path: req.path,
      userData: req.userData,
      chapter: chapter,
      quizzes: quizzes,
      hasChapterAccess: hasChapterAccess,
      chapterId: chapterId,
    });
  } catch (error) {
    console.error('Error in chapter_quizzes_get:', error);
    res.status(500).send('Server error');
  }
};

// ==================  Chapter PDFs  ====================== //

const chapter_pdfs_get = async (req, res) => {
  try {
    const chapterId = req.params.chapterId;
    const chapter = await Chapter.findById(chapterId);

    if (!chapter) {
      return res.status(404).send('Chapter not found');
    }

    // Get PDFs related to this chapter
    const pdfs = await PDFs.find({
      chapterId: chapterId,
      pdfGrade: req.userData.Grade,
    });

    const hasChapterAccess =
      req.userData.chaptersPaid &&
      req.userData.chaptersPaid.includes(chapterId);

    res.render('student/chapter-pdfs', {
      title: `${chapter.chapterName} - المذكرات والملفات`,
      path: req.path,
      userData: req.userData,
      chapter: chapter,
      pdfs: pdfs,
      hasChapterAccess: hasChapterAccess,
      chapterId: chapterId,
    });
  } catch (error) {
    console.error('Error in chapter_pdfs_get:', error);
    res.status(500).send('Server error');
  }
};

module.exports = {
  dash_get,

  chapters_get,
  buyChapter,

  // New chapter-based functions
  chapter_content_get,
  chapter_videos_get,
  chapter_quizzes_get,
  chapter_pdfs_get,
  video_watch_get,

  // Legacy functions (to be phased out)
  lecture_get,
  sum_get,
  solv_get,
  buyVideo,
  buyVideoLegacy,

  // Watch functions
  watch_get,
  getVideoWatch,
  uploadHW,
  submitHomework,

  ranking_get,

  exams_get,
  buyQuiz,

  quiz_get,
  quizWillStart,
  quiz_start,
  quiz_review,
  quizFinish,
  saveQuizAnswer,

  PDFs_get,
  getPDF,
  buyPDF,

  settings_get,
  settings_post,

  logOut,
};
