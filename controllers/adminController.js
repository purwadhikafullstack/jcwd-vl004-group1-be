const db = require("../db");
const Admin = require("../models/Admins");
const { createToken } = require("../helper/createToken");
const bcrypt = require("bcrypt");
const { hash } = require("bcrypt");
const transporter = require("../helper/nodemailer");

module.exports = {
  getAdmins: async (req, res) => {
    try {
      let admins = await Admin.findAll({});
      res.status(200).send(admins);
    } catch (err) {
      res.status(500).send(err);
    }
  },
  getAdminById: async (req, res) => {
    try {
      let id = req.params.id;
      let admin = await Admin.findOne({ where: { id: id } });
      res.status(200).send(admin);
    } catch (err) {
      res.status(500).send(err);
    }
  },
  register: async (req, res) => {
    try {
      const { full_name, username, email, password } = req.body;
      const usernameAlreadyExist = await Admin.findOne({ where: { username } });
      const emailAlreadyExist = await Admin.findOne({ where: { email } });
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
      }
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      let admin = await Admin.create({
        full_name,
        username,
        email,
        password: hashedPassword,
      });
      console.log(admin);
      let idNewAdmin = admin.dataValues.id;
      let newAdmin = await Admin.findOne({ where: { id: idNewAdmin } });

      // making token
      delete newAdmin.dataValues.password;
      let token = createToken(newAdmin.dataValues);

      // make email
      let mail = {
        from: `Super Admin <play.auronempire@gmail.com>`,
        to: `${newAdmin.dataValues.email}`,
        subject: `Admin Account Verification for ${newAdmin.dataValues.full_name}`,
        html: `<a href='http://localhost:3000/adminauthentication/${token}'>Click here to verify your Account.</a>`,
      };

      // // send mail
      transporter.sendMail(mail, (errMail, resMail) => {
        if (errMail) {
          throw { code: 500, message: "Mail Failed!", err: null };
        }
      });
      res.status(200).send(admin);
    } catch (err) {
      res.status(err.code).send("Error Admin Register: " + err.message);
    }
  },
  verification: async (req, res) => {
    try {
      const updateVerification = await Admin.update(
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
    try {
      const { email, password } = req.body;

      const adminWithEmail = await Admin.findOne({ where: { email } }).catch(
        (err) => {
          console.log(err);
        }
      );

      if (!adminWithEmail)
        throw {
          code: 400,
          message: "Email or password does not match!",
          err: null,
        };
      const validAdminPass = await bcrypt.compare(
        password,
        adminWithEmail.dataValues.password
      );
      if (!validAdminPass)
        throw {
          code: 400,
          message: "Email or password does not match!",
          err: null,
        };

      delete adminWithEmail.dataValues.password;
      let token = createToken(adminWithEmail.dataValues);
      console.log(token);
      console.log(adminWithEmail.dataValues);
      res.status(200).send({
        message: "Welcome Admin!",
        token,
        dataAdmin: adminWithEmail.dataValues,
      });
    } catch (err) {
      res.status(err.code).send("Error Admin Login: " + err.message);
    }
  },
  getDataAdmin: async (req, res) => {
    console.log(req.user);
    let user = await Admin.findOne({
      where: {
        id: req.user.id,
      },
    });
    res.status(200).send(user);
  },
  forgotPassword: async (req, res) => {
    try {
      let email = req.body.email;
      const emailExist = await Admin.findOne({ where: { email: email } });
      if (emailExist) {
        // // making token
        delete emailExist.dataValues.password;
        let token = createToken(emailExist.dataValues);

        // // make email
        let recoverpasswordmail = {
          from: `Super Admin <play.auronempire@gmail.com>`,
          to: `${emailExist.dataValues.email}`,
          subject: `Account Password Recovery for ${emailExist.dataValues.full_name}`,
          html: `
                    <p>Dear ${emailExist.dataValues.full_name},</p>
                    <p>You can reset the password for your account by using the information below:</p>
                    <p>Username: ${emailExist.dataValues.username}<br>
                    Email: ${emailExist.dataValues.email}<br>
                    Password reset link: <a href='http://localhost:3000/adminrecoverpassword/${token}'>here</a></p>
                    -- Website Support --
                    `,
        };

        console.log(emailExist.dataValues);

        // // send mail
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
      res.status(err.code).send("Error Register: " + err.message);
    }
  },
  recoverPassword: async (req, res) => {
    Users.sync({ alter: true });
    try {
      console.log(req.user);
      console.log(req.body);

      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);
      console.log(hashedPassword);
      const updatePassword = await Admin.update(
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
};
