const User = require("../models/userModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

const getAllUsers = catchAsync(async (req, res) => {
  const user = await User.find();

  res.json({ status: "success", results: user.length, data: user });
});

const filterObj = (body, ...allowedFields) => {
  const newBody = {};
  Object.keys(body).forEach((el) => {
    if (allowedFields.includes(el)) newBody[el] = body[el];
  });

  return newBody;
};

// @desc Update Self Data
// @route PATCH /api/v1/users/update-me
// @access private
const updateMe = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm) {
    return next(new AppError("This route is not for password updates", 400));
  }

  // 2) Filtered out unwanted filed names
  const filterBody = filterObj(req.body, "name", "email");

  // 3) Updated user document
  const updatedUser = await User.findOneAndUpdate(req.user.id, filterBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: "success",
    data: {
      user: updatedUser,
    },
  });
});

// @desc Delete Self
// @route DELETE /api/v1/users/delete-me
// @access private
const deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    response: "success",
    data: null,
  });
});

const createUser = (req, res) => {
  res.status(500).send({
    status: "error",
    message: "This route is not yet defined !",
  });
};

const getUser = (req, res) => {
  res.status(500).send({
    status: "error",
    message: "This route is not yet defined !",
  });
};

const updateUser = (req, res) => {
  res.status(500).send({
    status: "error",
    message: "This route is not yet defined !",
  });
};

const deleteUser = (req, res) => {
  res.status(500).send({
    status: "error",
    message: "This route is not yet defined !",
  });
};

module.exports = {
  getAllUsers,
  createUser,
  getUser,
  updateUser,
  deleteUser,
  updateMe,
  deleteMe,
};
