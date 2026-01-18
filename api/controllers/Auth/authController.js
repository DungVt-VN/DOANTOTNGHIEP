import { db } from "../../db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const cookieOptions = {
  httpOnly: true,
  secure: false,
  sameSite: "lax",
  maxAge: 24 * 60 * 60 * 1000,
};

// --- REGISTER ---
export const register = (req, res) => {
  const { username, email, password, fullname, phone, role, userCode } =
    req.body;

  if (!username || !email || !password || !fullname || !phone) {
    return res.status(400).json("Vui lòng điền đầy đủ thông tin!");
  }

  const userRole = role === "Teacher" ? "Teacher" : "Student";

  const qCheck = "SELECT * FROM Users WHERE Email = ? OR UserName = ?";
  db.query(qCheck, [email, username], (err, data) => {
    if (err) return res.status(500).json("Lỗi Server khi kiểm tra tài khoản");
    if (data.length)
      return res.status(409).json("Tài khoản hoặc Email đã tồn tại!");

    const hash = bcrypt.hashSync(password, 10);

    const qInsertUser =
      "INSERT INTO Users (`UserName`,`Password`,`Email`,`Role`) VALUES (?, ?, ?, ?)";
    const userValues = [username, hash, email, userRole];

    db.query(qInsertUser, userValues, (err, userData) => {
      if (err) {
        console.error(err);
        return res.status(500).json("Lỗi khi tạo User");
      }

      const userId = userData.insertId;

      let finalCode = userCode;

      if (!finalCode) {
        const prefix = userRole === "Teacher" ? "GV" : "HV";
        finalCode = prefix + String(userId).padStart(6, "0");
      }

      let qInsertProfile = "";
      let profileValues = [];

      if (userRole === "Student") {
        qInsertProfile =
          "INSERT INTO Students (`UserId`,`FullName`,`PhoneNo`, `StudentCode`) VALUES (?, ?, ?, ?)";
        profileValues = [userId, fullname, phone, finalCode];
      } else {
        qInsertProfile =
          "INSERT INTO Teachers (`UserId`,`FullName`,`PhoneNo`, `TeacherCode`) VALUES (?, ?, ?, ?)";
        profileValues = [userId, fullname, phone, finalCode];
      }

      db.query(qInsertProfile, profileValues, (err) => {
        if (err) {
          db.query("DELETE FROM Users WHERE UserId = ?", [userId]);
          console.error(err);
          return res.status(500).json("Lỗi khi tạo thông tin chi tiết");
        }

        const token = jwt.sign(
          { id: userId, role: userRole },
          process.env.JWT_SECRET,
          { expiresIn: "1d" }
        );

        res
          .cookie("access_token", token, cookieOptions)
          .status(201)
          .json({
            message: "Đăng ký thành công",
            user: {
              UserId: userId,
              UserName: username,
              Email: email,
              Role: userRole,
              FullName: fullname,
              PhoneNo: phone,
              UserCode: finalCode,
            },
          });
      });
    });
  });
};

// --- LOGIN ---
export const login = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json("Vui lòng nhập Email và Mật khẩu");

  const qUser = "SELECT * FROM Users WHERE Email = ? OR UserName = ?";
  db.query(qUser, [email, email], (err, data) => {
    if (err) return res.status(500).json("Lỗi Server");
    if (data.length === 0)
      return res.status(404).json("Tài khoản không tồn tại");

    const user = data[0];

    const isPasswordCorrect = bcrypt.compareSync(password, user.Password);
    if (!isPasswordCorrect)
      return res.status(400).json("Mật khẩu không chính xác");

    const token = jwt.sign(
      { id: user.UserId, role: user.Role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    const { Password, ...safeUser } = user;

    let qProfile = null;
    if (user.Role === "Student") {
      qProfile = "SELECT * FROM Students WHERE UserId = ?";
    } else if (user.Role === "Teacher") {
      qProfile = "SELECT * FROM Teachers WHERE UserId = ?";
    }

    if (!qProfile) {
      return res.cookie("access_token", token, cookieOptions).status(200).json({
        message: "Đăng nhập thành công",
        user: safeUser,
      });
    }

    db.query(qProfile, [user.UserId], (err, profileData) => {
      if (err) return res.status(500).json("Lỗi lấy thông tin cá nhân");

      const profile = profileData.length ? profileData[0] : {};

      res
        .cookie("access_token", token, cookieOptions)
        .status(200)
        .json({
          message: "Đăng nhập thành công",
          user: {
            ...safeUser,
            ...profile,
          },
        });
    });
  });
};

// --- LOGOUT ---
export const logout = (req, res) => {
  const { maxAge, ...logoutOptions } = cookieOptions;

  res
    .clearCookie("access_token", logoutOptions)
    .status(200)
    .json("Đăng xuất thành công");
};

export const changePassword = (req, res) => {
  const { userId, currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json("Vui lòng nhập đầy đủ thông tin.");
  }

  if (newPassword.length < 6) {
    return res.status(400).json("Mật khẩu mới phải có ít nhất 6 ký tự.");
  }

  const q = "SELECT * FROM Users WHERE UserId = ?";

  db.query(q, [userId], (err, data) => {
    if (err) return res.status(500).json(err);
    if (data.length === 0)
      return res.status(404).json("Người dùng không tồn tại!");

    const user = data[0];

    const isPasswordCorrect = bcrypt.compareSync(
      currentPassword,
      user.Password
    );

    if (!isPasswordCorrect) {
      return res.status(400).json("Mật khẩu hiện tại không đúng!");
    }

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(newPassword, salt);

    const updateQ = "UPDATE Users SET Password = ? WHERE UserId = ?";
    db.query(updateQ, [hash, userId], (err, data) => {
      if (err) return res.status(500).json(err);
      return res.status(200).json("Đổi mật khẩu thành công!");
    });
  });
};
