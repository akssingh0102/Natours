const Tour = require("./../models/tourModel");
const APIFeatures = require("../utils/apiFeatures");

const aliasTopTours = (req, res, next) => {
  req.query.limit = "5";
  req.query.sort = "-ratingsAverage,price";
  req.query.fields = "name,price,ratingsAverage,summary,difficulty";
  next();
};

// @desc Get all tours
// @route GET /api/v1/tours
// @access public
const getAllTours = async (req, res) => {
  try {
    // EXECUTE QUERY
    const feature = new APIFeatures(Tour.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const tours = await feature.query;

    res.json({ status: "success", results: tours.length, data: tours });
  } catch (err) {
    res.status(404).json({ status: "fail", message: err });
  }
};

// @desc Create a tour
// @route POST /api/v1/tours
// @access public
const createTour = async (req, res) => {
  try {
    const newTour = await Tour.create(req.body);
    res.json({ status: "success", data: newTour });
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: err,
    });
  }
};

// @desc Get a tour by ID
// @route GET /api/v1/tours/:id
// @access public
const getTour = async (req, res) => {
  try {
    const tours = await Tour.findById(req.params.id);
    // This is just a replacement for Tour.findOne({_id:req.params.id})
    res.json({ status: "success", data: tours });
  } catch (err) {
    res.status(404).json({ status: "fail", message: err });
  }
};

// @desc Update a tour
// @route PATCH /api/v1/tours/:id
// @access public
const updateTour = async (req, res) => {
  try {
    const tours = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    res.json({ status: "success", data: tours });
  } catch (err) {
    res.status(404).json({ status: "fail", message: err });
  }
};

// @desc Delete a tour
// @route DELETE /api/v1/tours/:id
// @access public
const deleteTour = async (req, res) => {
  try {
    await Tour.findByIdAndDelete(req.params.id);
    res.status(204).json({ status: "success" });
  } catch (err) {
    res.status(404).json({ status: "fail", message: err });
  }
};

// @desc Get tour status using mongoDB aggregation pipeline (Matching, Grouping and Sort)
// @route GET /api/v1/tours/tour-stats
// @access public
const getTourStats = async (req, res) => {
  try {
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
  } catch (err) {
    res.status(404).json({ status: "fail", message: err });
  }
};

const getMonthlyPlan = async (req, res) => {
  try {
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
  } catch (err) {
    res.status(404).json({ status: "fail", message: err });
  }
};

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
