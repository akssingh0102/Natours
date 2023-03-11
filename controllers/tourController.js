const Tour = require("./../models/tourModel");

// @desc Get all tours
// @route GET /api/v1/tours
// @access public
const getAllTours = async (req, res) => {
  try {
    // creating a deep copy of query parameter
    // 1A. Filtering
    const queryObj = { ...req.query };
    const excludeFields = ["page", "sort", "limit", "fields"];
    excludeFields.forEach((el) => delete queryObj[el]);

    // BUILD QUERY
    // 1B. Advance filtering
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    console.log(JSON.parse(queryStr));

    let query = Tour.find(JSON.parse(queryStr));

    // 2. Sorting
    if (req.query.sort) {
      const sortBy = req.query.sort.split(",").join(" ");
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }

    // EXECUTE QUERY
    const tours = await query;

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

module.exports = {
  getAllTours,
  getTour,
  createTour,
  updateTour,
  deleteTour,
};
