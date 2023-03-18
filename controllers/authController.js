const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
var jwt = require("jsonwebtoken");

// @desc Signup a user
// @route POST /api/v1/users/signup
// @access public
const signup = catchAsync(async (req, res, next) => {
  const { name, email, password, passwordConfirm } = req.body;
  const newUser = await User.create({ name, email, password, passwordConfirm });

  const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

  res.status(201).json({
    status: "success",
    token,
    data: {
      tour: newUser,
    },
  });
});

module.exports = {
  signup,
};
