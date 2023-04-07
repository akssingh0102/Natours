const User = require("../models/userModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const sendEmail = require("../utils/email");
const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const crypto = require("crypto");

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user
    },
  });
}

// @desc Signup a user
// @route POST /api/v1/users/signup
// @access public
const signup = catchAsync(async (req, res, next) => {
  const { name, email, password, passwordConfirm } = req.body;
  const newUser = await User.create({ name, email, password, passwordConfirm });

  createSendToken(newUser, 201, res);
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

  createSendToken(user, 200, res);
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

// Restrict middleware to only allow certain user roles
const restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles = ['admin', 'lead-guide']
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You don't have permission to perform this action", 403)
      );
    }
    next();
  };
};

// @desc Generate reset token
// @route POST /api/v1/users/forgot-password
// @access public
const forgotPassword = catchAsync(async (req, res, next) => {
  // 1) get user based on email
  const { email } = req.body;
  if (!email) {
    return next(new AppError("Please enter your email address"), 403);
  }
  const user = await User.findOne({ email });
  if (!user) {
    return next(new AppError(`There is no user with email : ${email}`));
  }

  // 2)Generate random reset token
  const resetToken = user.createPasswordRestToken();
  await user.save({ validateBeforeSave: false });

  // 3)Send it to users email
  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/users/reset-password/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL} 
                    \n If you didn't forget your password then please ignore this email.`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Your password reset token (valid for 10 mins)",
      message,
    });

    res.status(200).json({
      status: "success",
      message: "Token sent to the mail",
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        `There was an error sending the email. Try again later.`,
        500
      )
    );
  }
});

// @desc Reset Password
// @route POST /api/v1/users/reset-password
// @access public
const resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get User Based on token
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2) If token has not expired, and there is user, set the new password
  if (!user) {
    return next(new AppError("Token is invalid or has expired", 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 3) Update changedPasswordAt property for the user

  // 4) Log the user in, send JWT back
  createSendToken(user, 200, res);
});

// @desc Reset Password
// @route POST /api/v1/users/update-my-password
// @access private
const updateMyPassword = catchAsync(async (req, res, next) => {
  // 1) Get User from the collection
  const user = await User.findById(req.user.id).select("+password");

  // 2) Check if POSTed password is correct
  if (!(await user.isCorrectPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError("Your current password is wrong", 401));
  }

  // 3) Update the password if correct
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save()
  // User.findByIdAndUpdate will not work as intended

  // 4) Log the user in, send JWT 
  createSendToken(user, 200, res);
});

module.exports = {
  signup,
  login,
  protect,
  restrictTo,
  forgotPassword,
  resetPassword,
  updateMyPassword,
};
