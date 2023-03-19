const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");

const getAllUsers = catchAsync(async (req, res) => {
  const user = await User.find();

  res.json({ status: "success", results: user.length, data: user });
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

module.exports = { getAllUsers, createUser, getUser, updateUser, deleteUser };
