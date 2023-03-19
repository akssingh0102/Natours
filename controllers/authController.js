const User = require("../models/userModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const jwt = require("jsonwebtoken");
const { promisify } = require("util");

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// @desc Signup a user
// @route POST /api/v1/users/signup
// @access public
const signup = catchAsync(async (req, res, next) => {
  const { name, email, password, passwordConfirm } = req.body;
  const newUser = await User.create({ name, email, password, passwordConfirm });

  const token = signToken(newUser._id);

  res.status(201).json({
    status: "success",
    token,
    data: {
      tour: newUser,
    },
  });
});

// @desc Login a user
// @route POST /api/v1/users/login
// @access public
const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError("Please provide email and password", 400));
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.isCorrectPassword(password, user.password))) {
    return next(new AppError("Incorrect email or password"), 401);
  }

  const token = signToken(user._id);

  res.status(200).json({
    status: "success",
    token,
  });
});

// Middle for protected routes
const protect = catchAsync(async (req, res, next) => {
  // 1) get token and check if it's there
  let token;
  let authHeader = req.headers.Authorization || req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(
      new AppError("You are not logged in. Please login to et access."),
      401
    );
  }

  // 2) Verification Token
  const decode = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) check if user still exists
  const user = await User.findById(decode.id);
  if (!user) {
    return next(
      new AppError("The user belonging to this token no longer exist", 401)
    );
  }

  // 4)Check if user changed the password after token was issued
  if (user.changedPasswordAfter(decode.iat)) {
    return next(
      new AppError("User recently changed password! Please login again.", 401)
    );
  }

  // GRANT ACCESS TO PROTECTED ROUTES
  req.user = user;
  next();
});

module.exports = {
  signup,
  login,
  protect,
};
