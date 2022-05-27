const db = require("../db");
const bcrypt = require("bcrypt");
const Users = require("../models/Users");
const { createToken } = require("../helper/createToken");
const transporter = require("../helper/nodemailer");
const { hash } = require("bcrypt");
const Carts = require("../models/Carts");
const Products = require("../models/Products");
const Warehouse_Products = require("../models/Warehouse_Products");
const User_Addresses = require("../models/User_Addresses");
const Cities = require("../models/Cities");
const Provinces = require("../models/Provinces");
const Districts = require("../models/Districts");
const { Op } = require("sequelize");

module.exports = {
  getUsers: async (req, res) => {
    // Users.sync({ alter: true });
    try {
      let users = await Users.findAll({});
      res.status(200).send(users);
    } catch (err) {
      res.status(500).send(err);
    }
  },
  getUserById: async (req, res) => {
    Users.sync({ alter: true });
    try {
      let id = req.params.id;
      let user = await Users.findOne({
        where: {
          id: id,
        },
      });
      res.status(200).send(user);
    } catch (err) {
      res.status(500).send(err);
    }
  },
  register: async (req, res) => {
    // Users.sync({ alter: true });
    try {
      const { full_name, username, email, phone, password } = req.body;
      const usernameAlreadyExist = await Users.findOne({ where: { username } });
      const emailAlreadyExist = await Users.findOne({ where: { email } });
      const phoneAlreadyExist = await Users.findOne({ where: { phone } });
      if (usernameAlreadyExist) {
        throw {
          code: 500,
          message: "This Username is already being used!",
          err: null,
        };
      } else if (emailAlreadyExist) {
        throw {
          code: 500,
          message: "This Email is already being used!",
          err: null,
        };
      } else if (phoneAlreadyExist) {
        throw {
          code: 500,
          message: "This Phone Number is already being used!",
          err: null,
        };
      }

      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      let user = await Users.create({
        full_name,
        username,
        email,
        phone,
        password: hashedPassword,
      });
      let idNewUser = user.dataValues.id;
      let newUser = await Users.findOne({ where: { id: idNewUser } });

      // making token
      delete newUser.dataValues.password;
      let token = createToken(newUser.dataValues);

      // make email
      let mail = {
        from: `Admin <play.auronempire@gmail.com>`,
        to: `${newUser.dataValues.email}`,
        subject: `Account Verification for ${newUser.dataValues.full_name}`,
        html: `<a href='http://localhost:3000/authentication/${token}'>Click here to verify your Account.</a>`,
      };

      // send mail
      transporter.sendMail(mail, (errMail, resMail) => {
        if (errMail) {
          throw { code: 500, message: "Mail Failed!", err: null };
        }
      });
      res.status(200).send(user);
    } catch (err) {
      res.status(err.code).send("Error Register: " + err.message);
    }
  },
  verification: async (req, res) => {
    // Users.sync({ alter: true });
    try {
      const updateVerification = await Users.update(
        {
          is_verified: true,
          is_active: true,
        },
        {
          where: { id: req.user.id },
        }
      );
      if (updateVerification[0] == 0) {
        throw { code: 400, message: "Verification Failed!", err: null };
      }
      res
        .status(200)
        .send({ message: "Account Verification Success!", success: true });
    } catch (err) {
      res.status(err.code).send("Error Verification: " + err.message);
    }
  },
  login: async (req, res) => {
    // Users.sync({ alter: true });
    try {
      const { email, password } = req.body;

      const userWithEmail = await Users.findOne({
        where: { email },
        include: [
          {
            model: User_Addresses,
          },
          {
            model: Carts,
            include: [{ model: Products, include: Warehouse_Products }],
          },
        ],
      }).catch((err) => {
        console.log(err);
      });
      if (!userWithEmail)
        throw {
          code: 400,
          message: "Email or password does not match!",
          err: null,
        };
      const validPass = await bcrypt.compare(
        password,
        userWithEmail.dataValues.password
      );
      if (!validPass)
        // return res.json({ message: "Email or password does not match!" })
        throw {
          code: 400,
          message: "Email or password does not match!",
          err: null,
        };

      delete userWithEmail.dataValues.password;
      let token = createToken(userWithEmail.dataValues);
      res.status(200).send({
        message: "Welcome back!",
        token,
        dataUser: userWithEmail.dataValues,
      });
    } catch (err) {
      res.status(err.code).send("Error Login: " + err.message);
    }
  },
  getDataUser: async (req, res) => {
    // Users.sync({ alter: true });
    try {
      let user = await Users.findOne({
        where: {
          id: req.user.id,
        },
        include: [
          {
            model: User_Addresses,
          },
          {
            model: Carts,
            include: [{ model: Products, include: Warehouse_Products }],
          },
        ],
      });
      res.status(200).send(user);
    } catch (err) {
      console.log(err);
      res.status(err.code).send("Error Keep Login: " + err.message);
    }
  },
  forgotPassword: async (req, res) => {
    // Users.sync({ alter: true });
    try {
      let email = req.body.email;
      const emailExist = await Users.findOne({ where: { email: email } });
      if (emailExist) {
        // // making token
        delete emailExist.dataValues.password;
        let token = createToken(emailExist.dataValues);

        // // make email
        let recoverpasswordmail = {
          from: `Admin <play.auronempire@gmail.com>`,
          to: `${emailExist.dataValues.email}`,
          subject: `Account Password Recovery for ${emailExist.dataValues.full_name}`,
          html: `
          <p>Dear ${emailExist.dataValues.full_name},</p>
          <p>You can reset the password for your account by using the information below:</p>
          <p>Username: ${emailExist.dataValues.username}<br>
          Email: ${emailExist.dataValues.email}<br>
          Password reset link: <a href='http://localhost:3000/recoverpassword/${token}'>here</a></p>
          -- Website Support --
          `,
        };

        console.log(emailExist.dataValues);

        // send mail
        transporter.sendMail(recoverpasswordmail, (errMail, resMail) => {
          if (errMail) {
            throw { code: 500, message: "Mail Failed!", err: null };
          }
        });
        res.status(200).send({
          message: "We have sent you a password recovery email.",
          success: true,
        });
      } else {
        throw {
          code: 500,
          message: "Email not Found!",
          err: null,
        };
      }
    } catch (err) {
      res.send(err);
    }
  },
  recoverPassword: async (req, res) => {
    // Users.sync({ alter: true });
    try {
      console.log(req.user);
      console.log(req.body);

      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);
      console.log(hashedPassword);
      const updatePassword = await Users.update(
        {
          password: hashedPassword,
        },
        {
          where: { id: req.user.id },
        }
      );
      if (updatePassword[0] == 0) {
        throw { code: 400, message: "Update Password Failed!", err: null };
      }
      res
        .status(200)
        .send({ message: "Password is Successfully Changed!", success: true });
    } catch (err) {
      res.status(err.code).send("Error Password Recovery: " + err.message);
    }
  },
  getAddressesByUserId: async (req, res) => {
    // User_Addresses.sync({ alter: true });
    try {
      let id = req.params.id;
      let addresses = await User_Addresses.findAll({
        where: {
          userId: id,
        },
      });
      res.status(200).send(addresses);
    } catch (err) {
      res.status(500).send(err);
    }
  },
  addUserAddress: async (req, res) => {
    try {
      const { userId } = req.body;
      let data = {
        address_line: req.body.address_line,
        address_type: req.body.address_type,
        province: req.body.province,
        city: req.body.city,
        district: req.body.district,
        postal_code: req.body.postal_code,
        phone: req.body.phone,
        mobile: req.body.mobile,
        userId: req.body.userId,
        isDefault: req.body.isDefault,
        latitude: req.body.latitude,
        longitude: req.body.longitude,
      };
      const address = await User_Addresses.create(data);
      const getAddresses = await User_Addresses.findAll({
        where: { userId },
      });
      res.status(200).send({ address, getAddresses });
    } catch (err) {
      console.log(err);
      res.status(500).send(err);
    }
  },
  getProvinces: async (req, res) => {
    // Provinces.sync({ alter: true });
    try {
      console.log("hi");
      let provinces = await Provinces.findAll({
        include: [
          {
            model: Cities,
            include: Districts,
          },
        ],
      });
      res.status(200).send(provinces);
    } catch (err) {
      console.log(err);
      res.status(500).send(err);
    }
  },
  getProvince: async (req, res) => {
    try {
      let id = req.params.id;
      let province = await Provinces.findOne({
        where: { id: id },
      });
      res.status(200).send(province);
    } catch (err) {
      console.log();
      res.status(500).send(err);
    }
  },
  getCity: async (req, res) => {
    // Cities.sync({ alter: true });
    try {
      let id = req.params.id;

      let city = await Cities.findOne({
        where: { id: id },
      });
      res.status(200).send(city);
    } catch (err) {
      console.log(err);
      res.status(500).send(err);
    }
  },
  getDistrict: async (req, res) => {
    // Districts.sync({ alter: true });
    try {
      let id = req.params.id;

      let district = await Districts.findOne({
        where: { id: id },
      });
      res.status(200).send(district);
    } catch (err) {
      console.log(err);
      res.status(500).send(err);
    }
  },
  getCitiesByProvinceId: async (req, res) => {
    // Cities.sync({ alter: true });
    try {
      let id = req.params.id;

      let cities = await Provinces.findOne({
        where: { id: id },
        include: [
          {
            model: Cities,
          },
        ],
      });
      res.status(200).send(cities);
    } catch (err) {
      console.log(err);
      res.status(500).send(err);
    }
  },
  getDistrictsByCityId: async (req, res) => {
    // Cities.sync({ alter: true });
    try {
      let id = req.params.id;

      let districts = await Cities.findOne({
        where: { id: id },
        include: [
          {
            model: Districts,
          },
        ],
      });
      res.status(200).send(districts);
    } catch (err) {
      console.log(err);
      res.status(500).send(err);
    }
  },
  getDefaultAddress: async (req, res) => {
    // User_Addresses.sync({ alter: true });
    try {
      const defaultAddress = await User_Addresses.findOne({
        where: {
          isDefault: true,
        },
      });
      res.status(200).send(defaultAddress);
    } catch (err) {
      res.status(500).send(err);
      console.log(err);
    }
  },
  updateDefaultAddress: async (req, res) => {
    // User_Addresses.sync({ alter: true });
    try {
      const { id } = req.body;
      const { userId } = req.body;
      await User_Addresses.update(
        { isDefault: false },
        {
          where: {
            isDefault: true,
          },
        }
      );
      await User_Addresses.update(
        { isDefault: true },
        {
          where: {
            id,
          },
        }
      );
      const getUserAddresses = await User_Addresses.findAll({
        where: { userId },
      });
      res.status(200).send(getUserAddresses);
    } catch (err) {
      res.status(500).send(err);
      console.log(err);
    }
  },
  getAddressById: async (req, res) => {
    // User_Addresses.sync({ alter: true });
    try {
      let id = req.params.id;
      let user = await User_Addresses.findOne({
        where: {
          id: id,
        },
      });
      res.status(200).send(user);
    } catch (err) {
      res.status(500).send(err);
    }
  },
  deleteUserAddress: async (req, res) => {
    try {
      let id = req.params.id;
      const { userId } = req.body;
      await User_Addresses.destroy({ where: { id: id } });

      const getUserAddresses = await User_Addresses.findAll({
        where: { userId },
      });
      console.log(userId);
      console.log(getUserAddresses);
      res.status(200).send(getUserAddresses);
    } catch (err) {
      console.log(err);
      res.status(500).send(err);
    }
  },
  updateStatus: async (req, res) => {
    // Products.sync({ alter: true });
    try {
      let id = req.params.id;
      const users = await Users.update(req.body, {
        where: { id: id },
      });
      res.status(200).send(users);
    } catch (err) {
      res.status(500).send(err);
    }
  },
  searchUser: async (req, res) => {
    // Users.sync({ alter: true });
    try {
      let users = await Users.findAll({
        where: {
          username: {
            [Op.substring]: req.body.username,
          },
        },
      });
      res.status(200).send(users);
    } catch (err) {
      res.status(500).send(err);
      console.log(err);
    }
  },
  getDefaultAddress: async (req, res) => {
    // User_Addresses.sync({ alter: true });
    try {
      const { userId } = req.body;
      const defaultAddress = await User_Addresses.findOne({
        where: { isDefault: true, userId },
      });
      res.status(200).send(defaultAddress);
    } catch (err) {
      res.status(500).send(err);
      console.log(err);
    }
  },
  getAddressById: async (req, res) => {
    // User_Addresses.sync({ alter: true });
    try {
      let id = req.params.id;
      let user = await User_Addresses.findOne({
        where: {
          id: id,
        },
      });
      res.status(200).send(user);
    } catch (err) {
      res.status(500).send(err);
    }
  },
};
