import fs from "fs";
import path from "path";
import Trip from "../../models/office/trip.js";
import Location from "../../models/office/location.js";
import Diesel from "../../models/office/diesel.js";
import { validationResult } from "express-validator";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const createApkTrip = (req, res, next) => {
  let newImageUrl;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const error = new Error("Validation failed");
    error.statusCode = 422;
    error.data = errors.array();
    throw error;
  }

  if (req.file) {
    newImageUrl = req.file.path.replace("\\", "/");
  }

  let trip_id;

  const {
    vehicle_id,
    charging,
    odometer,
    odometer_done,
    companion,
    others,
    points,
    trip_date,
  } = req.body;

  const tripObj = {
    user_id: req.userId,
    vehicle_id,
    charging: charging || null,
    odometer: odometer || null,
    odometer_done: odometer_done || null,
    odometer_image_path: newImageUrl || null,
    companion: JSON.parse(companion) || null,
    others: others || "",
    points: JSON.parse(points) || [],
    trip_date: trip_date || new Date(),
  };

  Trip.create(tripObj)
    .then((result) => {
      trip_id = result._id;

      const locationsPromises = (JSON.parse(req.body.locations) || []).map(
        (location) => {
          return Location.create({ trip_id: trip_id, ...location }).then(
            async (result) => {
              if (result?._id) {
                await Trip.updateOne(
                  { _id: trip_id },
                  { $push: { locations: result._id } }
                );
              }
            }
          );
        }
      );

      const dieselsPromises = (JSON.parse(req.body.diesels) || []).map(
        (diesel) => {
          return Diesel.create({ trip_id: trip_id, ...diesel }).then(
            async (result) => {
              if (result?._id) {
                await Trip.updateOne(
                  { _id: trip_id },
                  { $push: { diesels: result._id } }
                );
              }
            }
          );
        }
      );

      return Promise.all([...locationsPromises, ...dieselsPromises]);
    })
    .then(() => {
      Trip.findById({ _id: trip_id })
        .populate("locations")
        .populate("diesels")
        .populate("user_id", {
          employee_id: 1,
          first_name: 2,
          last_name: 3,
          department: 4,
        })
        .populate("vehicle_id", { plate_no: 1, name: 2 })
        .then((trip) => {
          res
            .status(201)
            .json({ message: "Done creating apk trip", data: trip });
        });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

export const getApkTrips = (req, res, next) => {
  const currentPage = req.query.page || 1;
  const perPage = req.query.limit || 25;
  let searchItem = req.query.search || "";
  const dateItem = req.query.date;

  const filter =
    dateItem !== "null"
      ? {
          user_id: searchItem,
          ["trip_date"]: {
            $gte: `${dateItem}T00:00:00`,
            $lte: `${dateItem}T23:59:59`,
          },
        }
      : { user_id: searchItem };

  Trip.find(filter)
    .populate("locations")
    .populate("diesels")
    .populate("user_id", {
      employee_id: 1,
      first_name: 2,
      last_name: 3,
      department: 4,
      trip_template: 5,
    })
    .populate("vehicle_id", { plate_no: 1, name: 2 })
    .sort({ createdAt: "desc" })
    .skip((currentPage - 1) * perPage)
    .limit(perPage)
    .then((result) => {
      res.status(200).json({
        data: result,
        pagination: {
          totalItems: result.length,
          currentPage: parseInt(currentPage),
        },
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

export const getTrips = (req, res, next) => {
  // office/trips?page=
  const currentPage = req.query.page || 1;
  const perPage = req.query.limit || 25;
  let searchItem = req.query.search || "";
  const searchBy = req.query.searchBy || "_id";
  const dateItem = req.query.date;
  const userDepartment = req?.department;
  const employeeId = req?.employee_id;

  const filter =
    searchBy === "trip_date" || searchBy === "createdAt"
      ? {
          [searchBy]: {
            $gte: `${dateItem}T00:00:00`,
            $lte: `${dateItem}T23:59:59`,
          },
        }
      : {};

  let totalItems;

  Trip.find(filter)
    .countDocuments()
    .then((count) => {
      totalItems = count;
      return Trip.find(filter)
        .populate("locations")
        .populate("diesels")
        .populate("user_id", {
          employee_id: 1,
          first_name: 2,
          last_name: 3,
          department: 4,
        })
        .populate("vehicle_id", { plate_no: 1 })
        .skip(searchItem !== "" ? null : (currentPage - 1) * perPage)
        .limit(searchItem !== "" ? 0 : perPage)
        .sort({ createdAt: "desc" })
        .then((trips) => {
          const newTrip = trips.filter((trip) => {
            // valdiation to not filter by department if user is audit or developer and support
            if (
              userDepartment === "INTERNAL AUDIT" ||
              employeeId === "RDFFLFI-10861" ||
              employeeId === "RDFFLFI-10693"
            ) {
              return trip;
            } else {
              return trip?.user_id?.department
                .toString()
                .includes(userDepartment);
            }
          });

          if (searchBy === "trip_date" || searchBy === "createdAt") {
            return newTrip;
          } else {
            return newTrip.filter((trip) => {
              searchItem = searchItem.toLowerCase();
              const searchProps = searchBy.split(".");
              let obj = trip;
              for (const prop of searchProps) {
                obj = obj[prop];
                if (Array.isArray(obj)) {
                  if (prop === "companion") {
                    return obj.find((el) =>
                      el.first_name
                        .toString()
                        .toLowerCase()
                        .includes(searchItem)
                    );
                  }
                  return obj.find(
                    (el) =>
                      el && el.toString().toLowerCase().includes(searchItem)
                  );
                }
                if (!obj) return false;
              }
              return obj.toString().toLowerCase().includes(searchItem);
            });
          }
        });
    })
    .then((result) => {
      res.status(200).json({
        data: result,
        pagination: {
          totalItems: searchItem === "" ? totalItems : result.length,
          limit: parseInt(perPage),
          currentPage: parseInt(currentPage),
        },
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

export const updateTrip = (req, res, next) => {
  const tripId = req.params.tripId;
  let newImageURL;

  if (req.file) {
    newImageURL = req.file.path.replace("\\", "/");
  }

  const {
    user_id,
    vehicle_id,
    odometer,
    odometer_done,
    odometer_image_path,
    others,
    points,
    charging,
    companion,
  } = req.body;

  Trip.findById(tripId)
    .then((trip) => {
      if (!trip) {
        const error = new Error("Could not find trip");
        res.status(404).json({ message: "Couldn not find user" });
        error.statusCode = 404;
        throw error;
      }

      if (req.file && odometer_image_path !== trip.odometer_image_path) {
        clearImage(trip.odometer_image_path);
      }

      return Trip.findOneAndUpdate(
        { _id: trip._id },
        {
          user_id: user_id || trip.user_id,
          vehicle_id: vehicle_id || trip.vehicle_id,
          odometer: odometer || trip.odometer,
          odometer_done: odometer_done || trip.odometer_done,
          odometer_image_path: odometer_image_path || trip.odometer_image_path,
          companion: companion || trip.companion,
          others: others || trip.others,
          points: points || trip.points,
          charging: charging || trip.charging,
        }
      )
        .populate("locations")
        .populate("diesels")
        .populate("user_id", { trip_template: 1 })
        .populate("vehicle_id", { name: 1 });
    })
    .then((result) => {
      res.status(200).json({
        messsage: "Trip update successfully",
        data: result,
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

export const deleteTrip = (req, res, next) => {
  if (req.role !== "admin") {
    const error = new Error("Please make sure you're an admin");
    error.statusCode = 403;
    throw error;
  }

  const tripId = req.params.tripId;

  Trip.findById(tripId)
    .then((trip) => {
      if (!trip) {
        const error = new Error("Could not found trip");
        res.status(404).json({ message: "Could not find user" });
        error.statusCode = 404;
        throw error;
      }

      if (trip?.odometer_image_path) {
        clearImage(trip.odometer_image_path);
      }

      // Delete all location related to trip id
      Location.find({ trip_id: tripId }).then((location) => {
        if (!location) {
          return null;
        }
        location.map(async (item) => {
          await Location.findByIdAndRemove(item._id);
        });
      });

      // Delete all diesel related to trip id
      Diesel.find({ trip_id: tripId }).then((diesel) => {
        if (!diesel) {
          return null;
        }
        diesel.map(async (item) => {
          await Diesel.findByIdAndRemove(item._id);
        });
      });

      return Trip.findByIdAndRemove(tripId);
    })
    .then((result) => {
      res.status(200).json({
        message: "Success delete trip",
        data: result,
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

export const deleteAllTrips = (req, res, next) => {
  if (req.role !== "admin") {
    const error = new Error("Please make sure you're an admin");
    error.statusCode = 403;
    throw error;
  }
  const userId = req.params.userId;

  Trip.find({ user_id: userId })
    .then((trips) => {
      if (!trips) {
        const error = new Error("Could not find trip");
        error.statusCode = 404;
        throw error;
      }

      trips.map(async (item) => {
        await Location.find({ trip_id: item._id }).then((locations) => {
          locations.map(async (locItem) => {
            await Location.findByIdAndRemove(locItem._id);
          });
        });

        await Diesel.find({ trip_id: item._id }).then((diesels) => {
          diesels.map(async (diesel) => {
            await Diesel.findByIdAndRemove(diesel._id);
          });
        });

        await Trip.findByIdAndRemove(item._id);

        if (item?.odometer_image_path) {
          clearImage(item.odometer_image_path);
        }
      });

      res.status(201).json({ message: "delete all trips successfully" });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

const clearImage = (filePath) => {
  filePath = path.join(__dirname, "../..", filePath);
  fs.unlink(filePath, (err) => console.log(err));
};
