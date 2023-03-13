const Tour = require("./../models/tourModel");
const APIFeatures = require("../utils/apiFeatures");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

const aliasTopTours = (req, res, next) => {
  req.query.limit = "5";
  req.query.sort = "-ratingsAverage,price";
  req.query.fields = "name,price,ratingsAverage,summary,difficulty";
  next();
};

// @desc Get all tours
// @route GET /api/v1/tours
// @access public
const getAllTours = catchAsync(async (req, res, next) => {
  // EXECUTE QUERY
  const feature = new APIFeatures(Tour.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const tours = await feature.query;

  res.json({ status: "success", results: tours.length, data: tours });
});

// @desc Create a tour
// @route POST /api/v1/tours
// @access public
const createTour = catchAsync(async (req, res, next) => {
  const newTour = await Tour.create(req.body);
  res.json({ status: "success", data: newTour });
});

// @desc Get a tour by ID
// @route GET /api/v1/tours/:id
// @access public
const getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.id);
  // This is just a replacement for Tour.findOne({_id:req.params.id})

  if (!tour) {
    return next(new AppError(`No tour found with ID ${req.params.id}`, 404));
  }

  res.json({ status: "success", data: tour });
});

// @desc Update a tour
// @route PATCH /api/v1/tours/:id
// @access public
const updateTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!tour) {
    return next(new AppError(`No tour found with ID ${req.params.id}`, 404));
  }

  res.json({ status: "success", data: tour });
});

// @desc Delete a tour
// @route DELETE /api/v1/tours/:id
// @access public
const deleteTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndDelete(req.params.id);

  if (!tour) {
    return next(new AppError(`No tour found with ID ${req.params.id}`, 404));
  }

  res.status(204).json({ status: "success" });
});

// @desc Get tour status using mongoDB aggregation pipeline (Matching, Grouping and Sort)
// @route GET /api/v1/tours/tour-stats
// @access public
const getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: { $toUpper: "$difficulty" },
        numTours: { $sum: 1 },
        numRating: { $sum: "$ratingsQuantity" },
        avgRating: { $avg: "$ratingsAverage" },
        avgPrice: { $avg: "$price" },
        minPrice: { $min: "$price" },
        maxPrice: { $max: "$price" },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
  ]);

  res.json({ status: "success", data: stats });
});

const getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;

  const plan = await Tour.aggregate([
    { $unwind: "$startDates" },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: "$startDates" },
        numTourStarts: { $sum: 1 },
        tours: { $push: "$name" },
      },
    },
    {
      $addFields: { month: "$_id" },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: { numTourStarts: -1 },
    },
    {
      $limit: 12,
    },
  ]);

  res.json({ status: "success", data: plan });
});

module.exports = {
  getAllTours,
  getTour,
  createTour,
  updateTour,
  deleteTour,
  aliasTopTours,
  getTourStats,
  getMonthlyPlan,
};
