import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import path from "path";
import { validationResult } from "express-validator";
import User from "../models/user.js";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

export const deleteAllUsers = async (req, res, next) => {
  if (req.role !== "admin") {
    const error = new Error("Please make sure you're an admin");
    error.statusCode = 403;
    throw error;
  }

  await User.deleteMany({})
    .then(() => {
      res.status(201).json({
        message: "Success delete all users",
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

export const importUsers = async (req, res, next) => {
  if (req.role !== "admin") {
    const error = new Error("Please make sure you're an admin");
    error.statusCode = 403;
    throw error;
  }

  const users = req.body;

  users.length > 0
    ? await users.forEach(async (user, index) => {
        const newDate = new Date(1900, 0, user.license_exp - 1).toDateString();

        await User.findOne({ username: user.username })
          .then((isUser) => {
            if (!isUser) {
              bcrypt.hash(user.password, 12).then((hashedPw) => {
                User.create({
                  employee_id: user.employee_id,
                  first_name: user.first_name,
                  last_name: user.last_name,
                  username: user.username,
                  password: hashedPw,
                  trip_template: user.trip_template,
                  role: user.role,
                  status: user.status,
                  license_exp: newDate,
                  profile: user.profile,
                  department: users.department,
                });
              });
            }
          })
          .then(() => {
            if (index === users.length - 1) {
              res.status(200).json({
                message: "Success import users",
                totalItem: users.length,
              });
            }
          })
          .catch((err) => {
            if (!err.statusCode) {
              err.statusCode = 500;
            }
            next(err);
          });
      })
    : res.status(404).json({ message: "no item found" });
};

export const updateUser = (req, res, next) => {
  if (req.role !== "admin") {
    const error = new Error("Please make sure you're an admin");
    error.statusCode = 403;
    throw error;
  }

  const userId = req.params.userId;
  let newImageURl;

  const error = validationResult(req);
  if (!error.isEmpty()) {
    const errorMsg = [];
    error.errors.map((item) => errorMsg.push(item.msg));
    const err = new Error(errorMsg);
    throw err;
  }

  if (req.file) {
    newImageURl = req.file.path.replace("\\", "/");
  }

  const {
    employee_id,
    first_name,
    last_name,
    username,
    password,
    trip_template,
    role,
    license_exp,
    status,
    department,
    sub_unit,
    location,
    division,
    division_category,
    company,
    permission,
  } = req.body;

  User.findById(userId)
    .then((user) => {
      if (!user) {
        const error = new Error("Could not find user");
        res.status(404).json({ message: "Could not find user" });
        error.statusCode = 404;
        throw error;
      }

      if (
        newImageURl !== user.profile &&
        user.profile &&
        newImageURl != undefined
      ) {
        clearImage(user.profile);
      }

      req.body.password &&
        bcrypt
          .hash(password, 12)
          .then(async (hashedPw) => {
            user.employee_id = employee_id || user.employee_id;
            user.first_name = first_name || user.first_name;
            user.last_name = last_name || user.last_name;
            user.username = username || user.username;
            user.password = password == "null" ? user.password : hashedPw;
            user.trip_template = trip_template || user.trip_template;
            user.license_exp =
              license_exp === user.license_exp ? user.license_exp : license_exp;
            user.status = status || user.status;
            user.role = role || user.role;
            user.profile = newImageURl || user.profile;
            user.department = department || user.department;
            user.sub_unit = sub_unit || user.sub_unit;
            user.location = location || user.location;
            user.division = division || user.division;
            user.division_category =
              division_category || user.division_category;
            user.company = company || user.company;
            user.permission = JSON.parse(permission || null) || user.permission;
            return user.save();
          })
          .then((result) => {
            res.status(200).json({ message: "User udpated", user: result });
          })
          .catch((err) => {
            if (!err.statusCode) {
              err.statusCode = 500;
            }
            next(err);
          });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

export const deleteUser = (req, res, next) => {
  if (req.role !== "admin") {
    const error = new Error("Please make sure you're an admin");
    error.statusCode = 403;
    throw error;
  }

  const userId = req.params.userId;
  User.findById(userId)
    .then((post) => {
      if (!post) {
        const error = new Error("Could not find user");
        res.status(404).json({ message: "Could not find user" });
        error.statusCode = 404;
        throw error;
      }
      post?.profile && clearImage(post.profile);
      return User.findByIdAndRemove(userId);
    })
    .then((result) => {
      res.status(200).json({ message: "Success delete user" });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

export const getUsers = (req, res, next) => {
  if (req.role !== "admin") {
    const error = new Error("Please make sure you're an admin");
    error.statusCode = 403;
    throw error;
  }

  const currentPage = req.query.page || 1;
  const perPage = req.query.limit || 0;
  const searchItem = req.query.search || "";
  const searchBy =
    req.query.searchBy === "_id"
      ? "employee_id"
      : req.query.searchBy || "employee_id";
  const dateItem = req.query.date;

  let totalItems;

  if (searchBy === "license_exp") {
    let date = new Date(dateItem);

    // Add 1 month to the date
    date.setMonth(date.getMonth() + 1);
    const newDate = date.toISOString().slice(0, 10);

    User.find({
      [searchBy]: {
        $gte: `${dateItem}T00:00:00`,
        $lte: `${newDate}T23:59:59`,
      },
    })
      .countDocuments()
      .then((count) => {
        totalItems = count;
        return User.find({
          [searchBy]: {
            $gte: `${dateItem}T00:00:00`,
            $lte: `${newDate}T23:59:59`,
          },
        })
          .skip((currentPage - 1) * perPage)
          .limit(perPage)
          .sort({ createdAt: "desc" });
      })
      .then((result) => {
        res.status(200).json({
          message: "Fetch user successfully",
          data: result,
          pagination: {
            totalItems: totalItems,
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
  } else {
    User.find({
      [searchBy]: { $regex: `.*${searchItem}.*`, $options: "i" },
    })
      .countDocuments()
      .then((count) => {
        totalItems = count;
        return User.find({
          [searchBy]: { $regex: `.*${searchItem}.*`, $options: "i" },
        })
          .skip((currentPage - 1) * perPage)
          .limit(perPage)
          .sort({ createdAt: "desc" });
      })
      .then((result) => {
        res.status(200).json({
          message: "Fetch user successfully",
          data: result,
          pagination: {
            totalItems: totalItems,
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
  }
};

export const createUser = (req, res, next) => {
  const error = validationResult(req);
  let newImageURl;
  if (!error.isEmpty()) {
    const errorMsg = [];
    error.errors.map((item) => errorMsg.push(item.msg));
    const err = new Error(errorMsg);
    err.statusCode = 422;
    throw err;
  }
  if (req.file) {
    newImageURl = req.file.path.replace("\\", "/");
  }

  const {
    employee_id,
    first_name,
    last_name,
    username,
    password,
    trip_template,
    role,
    status,
    license_exp,
    department,
    sub_unit,
    location,
    division,
    division_category,
    company,
    permission,
  } = req.body;

  bcrypt
    .hash(password, 12)
    .then((hashedPw) => {
      const user = new User({
        employee_id: employee_id,
        first_name: first_name,
        last_name: last_name,
        username: username,
        password: hashedPw,
        trip_template: trip_template,
        role: role,
        status: status,
        license_exp: license_exp,
        profile: newImageURl,
        department: department,
        sub_unit: sub_unit,
        location: location,
        division: division,
        division_category: division_category,
        company: company,
        permission: JSON.parse(permission || null),
      });
      return user.save();
    })
    .then((result) => {
      res.status(201).json({
        message: "User created",
        user_id: result.id,
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

export const login = (req, res, next) => {
  const { username, password } = req.body;
  let loadedUser;

  User.findOne({ username: username })
    .then(async (user) => {
      if (!user || user?.status !== "active") {
        const error = new Error("Could not find user");
        error.statusCode = 401;

        res.status(401).json({ message: "Could not find user", user: user });
        throw error;
      }
      loadedUser = user;
      if (password === user.password) {
        return true;
      }

      return bcrypt.compare(password, user.password);
    })
    .then((isEqual) => {
      if (!isEqual) {
        const error = new Error("Wrong Password");
        error.statusCode = 401;

        res.status(401).json({ message: "Wrong Password", user: [] });
        throw error;
      }
      const token = jwt.sign(
        {
          userId: loadedUser._id.toString(),
          role: loadedUser?.role,
          profile: loadedUser.profile,
          first_name: loadedUser.first_name,
          last_name: loadedUser.last_name,
          trip_template: loadedUser.trip_template,
          permission: loadedUser.permission,
          department: loadedUser?.department,
          employee_id: loadedUser?.employee_id,
        },
        process.env.SECRET_KEY
        // { expiresIn: "12h" }
      );
      res.status(201).json({ token: token });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

const clearImage = (filePath) => {
  filePath = path.join(__dirname, "..", filePath);
  fs.unlink(filePath, (err) => console.log(err));
};
