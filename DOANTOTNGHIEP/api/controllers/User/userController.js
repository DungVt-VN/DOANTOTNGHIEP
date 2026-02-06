import { db } from "../../db.js";
import util from "util";
import bcrypt from "bcryptjs";
import * as XLSX from "xlsx";

export const updateUserName = (req, res) => {
  const userId = req.body.userId;
  const { UserName } = req.body;
  console.log(userId + UserName);
  if (!UserName) {
    return res.status(400).json("Tên tài khoản không được để trống.");
  }

  const qCheck = "SELECT UserId FROM Users WHERE UserName = ? AND UserId != ?";

  db.query(qCheck, [UserName, userId], (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).json("Lỗi Server khi kiểm tra tên tài khoản.");
    }

    if (data.length > 0) {
      return res.status(409).json("Tên tài khoản đã tồn tại.");
    }

    const qUpdate = "UPDATE Users SET UserName  = ? WHERE UserId = ?";

    db.query(qUpdate, [UserName, userId], (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json("Lỗi khi cập nhật tên tài khoản.");
      }
      console.log("asfjlksfdj");
      return res.status(200).json("Cập nhật tên tài khoản thành công!");
    });
  });
};
export const changePassword = (req, res) => {
  const { userId, newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json("Mật khẩu phải có ít nhất 6 ký tự.");
  }

  const hash = bcrypt.hashSync(newPassword, 10);
  const q = "UPDATE Users SET Password = ? WHERE UserId = ?";

  db.query(q, [hash, userId], (err, data) => {
    if (err) return res.status(500).json("Lỗi server khi đổi mật khẩu.");
    return res.status(200).json("Đổi mật khẩu thành công!");
  });
};
export const updateEmail = (req, res) => {
  const userId = req.body.UserId;
  const { Email } = req.body;
  if (!Email) {
    return res.status(400).json("Email không được để trống.");
  }

  const qCheck = "SELECT UserId FROM Users WHERE Email = ? AND UserId != ?";

  db.query(qCheck, [Email, userId], (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).json("Lỗi Server khi kiểm tra Email.");
    }

    if (data.length > 0) {
      return res.status(409).json("Email này đã được đăng ký.");
    }

    const qUpdate = "UPDATE Users SET Email = ? WHERE UserId = ?";

    db.query(qUpdate, [Email, userId], (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json("Lỗi khi cập nhật Email.");
      }

      return res.status(200).json("Cập nhật Email thành công!");
    });
  });
};
export const updateInfoStudent = (req, res) => {
  const userId = req.params.userId;

  const {
    FullName,
    PhoneNo,
    ParentPhoneNo,
    SchoolName,
    StudentCode,
    BirthDate,
  } = req.body;

  if (!userId) return res.status(400).json("Thiếu User ID.");
  if (!FullName) return res.status(400).json("Tên đầy đủ là bắt buộc.");

  const qUpdateStudent = `
    UPDATE Students 
    SET FullName = ?, PhoneNo = ?, ParentPhoneNo = ?, SchoolName = ?, StudentCode = ?, BirthDate = ?
    WHERE UserId = ?
  `;

  const studentValues = [
    FullName,
    PhoneNo,
    ParentPhoneNo,
    SchoolName,
    StudentCode,
    BirthDate,
    userId,
  ];

  db.query(qUpdateStudent, studentValues, (err, result) => {
    if (err) {
      if (err.code === "ER_DUP_ENTRY")
        return res.status(409).json("Mã sinh viên đã tồn tại.");
      return res.status(500).json("Lỗi Server khi cập nhật hồ sơ.");
    }

    // Trường hợp 1: Update thành công
    if (result.affectedRows > 0) {
      return res.status(200).json("Cập nhật hồ sơ học viên thành công!");
    }

    // Trường hợp 2: Chưa có hồ sơ hoặc dữ liệu không đổi
    db.query(
      "SELECT UserId FROM Students WHERE UserId = ?",
      [userId],
      (checkErr, checkRes) => {
        if (checkErr) return res.status(500).json("Lỗi kiểm tra hồ sơ.");

        // Nếu đã có hồ sơ -> Không đổi gì
        if (checkRes.length > 0) {
          return res
            .status(200)
            .json("Thông tin đã được lưu (Không có thay đổi mới).");
        }

        // Nếu chưa có hồ sơ -> Tạo mới
        const qInsertStudent = `
        INSERT INTO Students (UserId, FullName, PhoneNo, ParentPhoneNo, SchoolName, StudentCode, BirthDate)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
        const insertValues = [
          userId,
          FullName,
          PhoneNo,
          ParentPhoneNo,
          SchoolName,
          StudentCode,
          BirthDate,
        ];

        db.query(qInsertStudent, insertValues, (insertErr) => {
          if (insertErr) {
            if (insertErr.code === "ER_DUP_ENTRY") {
              if (insertErr.sqlMessage?.includes("StudentCode"))
                return res.status(409).json("Mã sinh viên đã tồn tại.");
            }
            return res.status(500).json("Lỗi Server khi tạo mới hồ sơ.");
          }
          return res.status(201).json("Đã tạo mới hồ sơ học viên thành công!");
        });
      }
    );
  });
};

export const updateInfoTeacher = (req, res) => {
  const userId = req.params.userId;
  const { FullName, PhoneNo, TeacherCode, Address, Bio, SalaryRate } = req.body;

  if (!userId) return res.status(400).json("Thiếu User ID.");
  if (!FullName) return res.status(400).json("Họ tên là bắt buộc.");
  if (!TeacherCode) return res.status(400).json("Mã giáo viên là bắt buộc.");

  const qUpdate = `
    UPDATE Teachers
    SET FullName = ?, PhoneNo = ?, TeacherCode = ?, Address = ?, Bio = ?, SalaryRate = ?
    WHERE UserId = ?
  `;

  const values = [
    FullName,
    PhoneNo,
    TeacherCode,
    Address || null,
    Bio || null,
    SalaryRate || 0,
    userId,
  ];

  db.query(qUpdate, values, (err, result) => {
    if (err) {
      if (err.code === "ER_DUP_ENTRY") {
        if (err.sqlMessage?.includes("TeacherCode"))
          return res.status(409).json("Mã giáo viên đã tồn tại.");
        if (err.sqlMessage?.includes("PhoneNo"))
          return res.status(409).json("Số điện thoại giáo viên đã tồn tại.");
        return res.status(409).json("Dữ liệu giáo viên bị trùng lặp.");
      }
      return res.status(500).json("Lỗi Server khi cập nhật.");
    }

    if (result.affectedRows > 0) {
      return res.status(200).json("Cập nhật hồ sơ giáo viên thành công!");
    }

    db.query(
      "SELECT UserId FROM Teachers WHERE UserId = ?",
      [userId],
      (checkErr, checkRes) => {
        if (checkErr) return res.status(500).json("Lỗi kiểm tra hồ sơ.");

        if (checkRes.length > 0) {
          return res
            .status(200)
            .json("Thông tin đã được lưu (Không có thay đổi mới).");
        }

        const qInsert = `
        INSERT INTO Teachers (UserId, FullName, PhoneNo, TeacherCode, Address, Bio, SalaryRate)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
        const insertValues = [
          userId,
          FullName,
          PhoneNo,
          TeacherCode,
          Address || null,
          Bio || null,
          SalaryRate || 0,
        ];

        db.query(qInsert, insertValues, (insertErr) => {
          if (insertErr) {
            if (insertErr.code === "ER_DUP_ENTRY") {
              if (insertErr.sqlMessage?.includes("TeacherCode"))
                return res.status(409).json("Mã giáo viên đã tồn tại.");
            }
            return res
              .status(500)
              .json("Lỗi Server khi tạo mới hồ sơ giáo viên.");
          }
          return res.status(201).json("Đã tạo mới hồ sơ giáo viên thành công!");
        });
      }
    );
  });
};

export const importTeachersFromExcel = async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ error: "Vui lòng upload file!" });

    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    if (rawData.length === 0)
      return res.status(400).json({ error: "File rỗng!" });

    const teachersData = rawData.map((item) => ({
      UserName: item["Tên tài khoản"] || item.UserName,
      Password:
        item["Mật khẩu"]?.toString() || item.Password?.toString() || "123456",
      Email: item["Email"] || item.Email,
      FullName: item["Họ và tên"] || item.FullName,
      TeacherCode: item["Mã giáo viên"]?.toString() || item.TeacherCode,
      PhoneNo: (() => {
        const val = item["SĐT"] || item.PhoneNo;
        if (!val) return null;
        const str = val.toString();
        return str.startsWith("0") ? str : "0" + str;
      })(),
      Address: item["Địa chỉ"] || item.Address,
      Bio: item["Giới thiệu"] || item.Bio,
      SalaryRate: item["Lương"] || item.SalaryRate,
    }));

    const errors = [];
    const successes = [];

    const hashPassword = async (pwd) => {
      const salt = await bcrypt.genSalt(10);
      return await bcrypt.hash(pwd, salt);
    };

    const checkUnique = async (UserName, Email) => {
      const q =
        "SELECT COUNT(*) as count FROM Users WHERE UserName = ? OR Email = ?";
      const res = await queryAsync(q, [UserName, Email]);
      return res[0].count > 0;
    };

    for (const item of teachersData) {
      const {
        UserName,
        Email,
        Password,
        FullName,
        TeacherCode,
        PhoneNo,
        Address,
        Bio,
        SalaryRate,
      } = item;
      let createdUserId = null;

      try {
        if (!UserName || !Email || !Password || !FullName || !TeacherCode)
          throw new Error("Thiếu thông tin bắt buộc");

        if (await checkUnique(UserName, Email))
          throw new Error("Tài khoản hoặc Email tồn tại");

        const hashed = await hashPassword(Password);

        // Insert User (Role = Teacher)
        const userRes = await queryAsync(
          "INSERT INTO Users (UserName, Email, Password, Role) VALUES (?, ?, ?, 'Teacher')",
          [UserName, Email, hashed]
        );
        createdUserId = userRes.insertId;

        // Insert Teacher
        await queryAsync(
          "INSERT INTO Teachers (UserId, FullName, TeacherCode, PhoneNo, Address, Bio, SalaryRate) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [
            createdUserId,
            FullName,
            TeacherCode,
            PhoneNo,
            Address || null,
            Bio || null,
            SalaryRate || 0,
          ]
        );

        successes.push({ UserName });
      } catch (err) {
        if (createdUserId)
          await queryAsync("DELETE FROM Users WHERE UserId = ?", [
            createdUserId,
          ]);
        errors.push({
          UserName: UserName || "Unknown",
          error: err.message || err.sqlMessage,
        });
      }
    }

    if (errors.length > 0) {
      return res.status(200).json({
        message: "Hoàn tất có lỗi",
        successCount: successes.length,
        errorCount: errors.length,
        errors,
      });
    }
    return res
      .status(201)
      .json({ message: "Import thành công!", successCount: successes.length });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Lỗi Server" });
  }
};

export const getInfo = (req, res) => {
  const q = "SELECT * FROM students ";

  db.query(q, [], (err, data) => {
    if (err) return res.status(500).json(err);

    return res.status(200).json(data);
  });
};
export const getAccountStudents = (req, res) => {
  const q = `
    SELECT 
      u.UserId,
      u.UserName,
      u.Email,
      u.Role,

      s.StudentId,
      s.BirthDate,
      s.StudentCode,
      s.FullName,
      s.PhoneNo,
      s.ParentPhoneNo,
      s.SchoolName
    FROM Users u
    LEFT JOIN Students s ON u.UserId = s.UserId 
    WHERE u.Role = 'Student'
    ORDER BY UserName ASC
  `;

  db.query(q, (err, data) => {
    if (err) {
      console.error("Lỗi lấy danh sách sinh viên:", err);
      return res.status(500).json("Lỗi server");
    }

    return res.status(200).json(data);
  });
};
export const getTeacherDetail = (req, res) => {
  const teacherId = req.params.id;
  const q = `
    SELECT 
      t.*, 
      u.UserName, 
      u.Email, 
      u.Avatar
    FROM Teachers t
    JOIN Users u ON t.UserId = u.UserId
    WHERE t.TeacherId = ?
  `;

  db.query(q, [teacherId], (err, data) => {
    if (err) return res.status(500).json(err);
    if (data.length === 0)
      return res.status(404).json("Không tìm thấy giáo viên");

    return res.status(200).json(data[0]);
  });
};
export const getAccountTeachers = (req, res) => {
  const q = `
    SELECT u.UserId, u.UserName, u.Email, 
           t.TeacherId, t.FullName, t.PhoneNo, t.TeacherCode, t.Address, t.Bio, t.SalaryRate
    FROM Users u
    LEFT JOIN Teachers t ON u.UserId = t.UserId
    WHERE u.Role = 'Teacher'
    ORDER BY UserName ASC
  `;

  db.query(q, (err, data) => {
    if (err) {
      console.error("Lỗi lấy danh sách giảng viên:", err);
      return res.status(500).json("Lỗi server");
    }
    return res.status(200).json(data);
  });
};

export const deleteAccount = async (req, res) => {
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ message: "Danh sách ID không hợp lệ" });
  }

  const placeholders = ids.map(() => "?").join(", ");

  const deleteUsersQuery = `
    DELETE FROM Users 
    WHERE UserId IN (${placeholders})
  `;

  try {
    const result = await queryAsync(deleteUsersQuery, ids);

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy tài khoản để xóa" });
    }

    return res.status(200).json({
      message: "Xóa tài khoản thành công",
      deletedCount: result.affectedRows,
    });
  } catch (error) {
    console.error("Error deleting accounts:", error);

    return res.status(500).json({
      message: "Lỗi server khi xóa tài khoản",
    });
  }
};

const queryAsync = util.promisify(db.query).bind(db);

export const addStudentAccount = async (req, res) => {
  try {
    const studentAccount = req.body;
    if (!Array.isArray(studentAccount) || studentAccount.length === 0) {
      return res
        .status(400)
        .json({ error: "Không có dữ liệu nào được gửi lên!" });
    }

    const errors = [];
    const successes = [];

    const hashPassword = async (password) => {
      const salt = await bcrypt.genSalt(10);
      return await bcrypt.hash(password, salt);
    };

    const checkUniqueFields = async (UserName, Email) => {
      const checkQuery = `
        SELECT COUNT(*) AS count FROM Users WHERE UserName = ? OR Email = ?
      `;
      const result = await queryAsync(checkQuery, [UserName, Email]);
      return result[0].count > 0;
    };

    for (const item of studentAccount) {
      const {
        UserName,
        Email,
        Password,
        FullName,
        StudentCode,
        SchoolName,
        PhoneNo,
        BirthDate,
      } = item;

      let createdUserId = null;

      try {
        if (!UserName || !Email || !Password || !FullName) {
          throw new Error(
            "Thiếu thông tin bắt buộc (UserName, Email, Password, FullName)"
          );
        }

        const isExist = await checkUniqueFields(UserName, Email);
        if (isExist) {
          throw new Error(
            `UserName '${UserName}' hoặc Email '${Email}' đã tồn tại.`
          );
        }

        const hashedPassword = await hashPassword(Password);
        const insertUserQuery = `
          INSERT INTO Users (UserName, Email, Password, Role)
          VALUES (?, ?, ?, 'Student')
        `;
        const userResult = await queryAsync(insertUserQuery, [
          UserName,
          Email,
          hashedPassword,
        ]);

        createdUserId = userResult.insertId;

        const insertStudentQuery = `
          INSERT INTO Students (UserId, FullName, StudentCode, SchoolName, PhoneNo, BirthDate)
          VALUES (?, ?, ?, ?, ?, ?)
        `;

        await queryAsync(insertStudentQuery, [
          createdUserId,
          FullName,
          StudentCode,
          SchoolName || null,
          PhoneNo || null,
          BirthDate || null,
        ]);

        successes.push({ UserName, status: "Success" });
      } catch (error) {
        // Thì thực hiện XÓA User đó đi
        if (createdUserId) {
          try {
            await queryAsync("DELETE FROM Users WHERE UserId = ?", [
              createdUserId,
            ]);
            console.log(
              `[ROLLBACK] Đã xóa User ID ${createdUserId} do lỗi tạo Student Profile.`
            );
          } catch (deleteErr) {
            console.error(
              `[FATAL] Không thể rollback User ID ${createdUserId}:`,
              deleteErr
            );
          }
        }

        errors.push({
          UserName: UserName || "Unknown",
          error: error.message || error.sqlMessage || "Lỗi không xác định",
        });
      }
    }

    if (errors.length > 0) {
      return res.status(200).json({
        message: "Hoàn tất xử lý với một số lỗi.",
        totalProcessed: studentAccount.length,
        successCount: successes.length,
        errorCount: errors.length,
        errors: errors,
      });
    }

    return res.status(201).json({
      message: "Thêm tất cả học viên thành công!",
      count: successes.length,
    });
  } catch (err) {
    console.error("System Error:", err);
    return res.status(500).json({ error: "Lỗi Server nội bộ" });
  }
};

export const importStudentsFromExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Vui lòng upload file Excel!" });
    }

    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(sheet);

    if (rawData.length === 0) {
      return res.status(400).json({ error: "File Excel rỗng!" });
    }

    const formatExcelDate = (dateVal) => {
      if (!dateVal) return null;

      if (typeof dateVal === "number") {
        const date = new Date(Math.round((dateVal - 25569) * 86400 * 1000));
        return date.toISOString().split("T")[0];
      }
      if (typeof dateVal === "string") {
        if (dateVal.includes("/")) {
          const parts = dateVal.split("/");
          if (parts.length === 3) {
            return `${parts[2]}-${parts[1]}-${parts[0]}`;
          }
        }
        return dateVal;
      }
      return null;
    };

    const usersAndStudents = rawData.map((item) => ({
      UserName: item["Tên tài khoản"] || item.UserName,
      Password:
        item["Mật khẩu"]?.toString() || item.Password?.toString() || "123456",
      Email: item["Email"] || item.Email,
      FullName: item["Họ và tên"] || item.FullName,
      StudentCode: item["Mã sinh viên"]?.toString() || item.StudentCode,
      SchoolName: item["Trường học"] || item.SchoolName,
      PhoneNo: item["SĐT"]?.toString() || item.PhoneNo,

      BirthDate: formatExcelDate(item["Ngày sinh"] || item.BirthDate),
    }));

    const errors = [];
    const successes = [];

    const hashPassword = async (password) => {
      const salt = await bcrypt.genSalt(10);
      return await bcrypt.hash(password, salt);
    };

    const checkUniqueFields = async (UserName, Email) => {
      const checkQuery =
        "SELECT COUNT(*) AS count FROM Users WHERE UserName = ? OR Email = ?";
      const result = await queryAsync(checkQuery, [UserName, Email]);
      return result[0].count > 0;
    };

    for (const item of usersAndStudents) {
      const {
        UserName,
        Email,
        Password,
        FullName,
        StudentCode,
        SchoolName,
        PhoneNo,
        BirthDate,
      } = item;
      let createdUserId = null;

      try {
        if (!UserName || !Email || !Password || !FullName)
          throw new Error("Thiếu thông tin");
        if (await checkUniqueFields(UserName, Email))
          throw new Error("Tài khoản hoặc Email tồn tại");

        const hashed = await hashPassword(Password);

        const userRes = await queryAsync(
          "INSERT INTO Users (UserName, Email, Password, Role) VALUES (?,?,?, 'Student')",
          [UserName, Email, hashed]
        );
        createdUserId = userRes.insertId;

        await queryAsync(
          "INSERT INTO Students (UserId, FullName, StudentCode, SchoolName, PhoneNo, BirthDate) VALUES (?,?,?,?,?,?)",
          [
            createdUserId,
            FullName,
            StudentCode,
            SchoolName || null,
            PhoneNo || null,
            BirthDate || null,
          ]
        );

        successes.push({ UserName });
      } catch (err) {
        if (createdUserId)
          await queryAsync("DELETE FROM Users WHERE UserId = ?", [
            createdUserId,
          ]);
        errors.push({ UserName: UserName || "Unknown", error: err.message });
      }
    }

    if (errors.length > 0) {
      return res.status(200).json({
        message: "Hoàn tất với một số lỗi.",
        successCount: successes.length,
        errorCount: errors.length,
        errors: errors,
      });
    }

    return res
      .status(201)
      .json({ message: "Import thành công!", successCount: successes.length });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Lỗi Server nội bộ" });
  }
};

export const createStudent = async (req, res) => {
  const {
    UserName,
    Email,
    Password,
    FullName,
    StudentCode,
    PhoneNo,
    BirthDate,
    SchoolName,
  } = req.body;

  // Validate cơ bản
  if (!UserName || !Email || !Password || !FullName) {
    return res
      .status(400)
      .json(
        "Vui lòng điền đủ các trường bắt buộc (Tài khoản, Email, Mật khẩu, Họ tên)."
      );
  }

  let createdUserId = null;

  try {
    // 1. Kiểm tra trùng lặp User
    const checkUser =
      "SELECT COUNT(*) as count FROM Users WHERE UserName = ? OR Email = ?";
    const exist = await queryAsync(checkUser, [UserName, Email]);
    if (exist[0].count > 0)
      return res.status(409).json("Tên tài khoản hoặc Email đã tồn tại.");

    // 2. Kiểm tra trùng Mã SV (nếu có nhập)
    if (StudentCode) {
      const checkCode =
        "SELECT COUNT(*) as count FROM Students WHERE StudentCode = ?";
      const existCode = await queryAsync(checkCode, [StudentCode]);
      if (existCode[0].count > 0)
        return res.status(409).json("Mã sinh viên đã tồn tại.");
    }

    // 3. Hash pass & Insert User
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(Password, salt);

    const insertUser =
      "INSERT INTO Users (UserName, Email, Password, Role) VALUES (?, ?, ?, 'Student')";
    const userRes = await queryAsync(insertUser, [UserName, Email, hashed]);
    createdUserId = userRes.insertId;

    // 4. Insert Student
    const insertStudent = `
      INSERT INTO Students (UserId, FullName, StudentCode, PhoneNo, BirthDate, SchoolName)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    await queryAsync(insertStudent, [
      createdUserId,
      FullName,
      StudentCode || null,
      PhoneNo || null,
      BirthDate || null,
      SchoolName || null,
    ]);

    return res.status(201).json("Tạo học viên thành công!");
  } catch (error) {
    console.error(error);
    if (createdUserId)
      await queryAsync("DELETE FROM Users WHERE UserId = ?", [createdUserId]);
    return res.status(500).json("Lỗi server khi tạo tài khoản.");
  }
};

export const createTeacher = async (req, res) => {
  const {
    UserName,
    Email,
    Password,
    FullName,
    TeacherCode,
    PhoneNo,
    Address,
    SalaryRate,
    Bio,
  } = req.body;

  if (!UserName || !Email || !Password || !FullName || !TeacherCode) {
    return res
      .status(400)
      .json(
        "Thiếu thông tin bắt buộc (Tài khoản, Email, Pass, Họ tên, Mã GV)."
      );
  }

  let createdUserId = null;

  try {
    // 1. Check User exist
    const checkUser =
      "SELECT COUNT(*) as count FROM Users WHERE UserName = ? OR Email = ?";
    const exist = await queryAsync(checkUser, [UserName, Email]);
    if (exist[0].count > 0)
      return res.status(409).json("Tên tài khoản hoặc Email đã tồn tại.");

    // 2. Check TeacherCode exist
    const checkCode =
      "SELECT COUNT(*) as count FROM Teachers WHERE TeacherCode = ?";
    const existCode = await queryAsync(checkCode, [TeacherCode]);
    if (existCode[0].count > 0)
      return res.status(409).json("Mã giáo viên đã tồn tại.");

    // 3. Create User
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(Password, salt);

    const insertUser =
      "INSERT INTO Users (UserName, Email, Password, Role) VALUES (?, ?, ?, 'Teacher')";
    const userRes = await queryAsync(insertUser, [UserName, Email, hashed]);
    createdUserId = userRes.insertId;

    // 4. Create Teacher
    const insertTeacher = `
      INSERT INTO Teachers (UserId, FullName, TeacherCode, PhoneNo, Address, SalaryRate, Bio)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    await queryAsync(insertTeacher, [
      createdUserId,
      FullName,
      TeacherCode,
      PhoneNo || null,
      Address || null,
      SalaryRate || 0,
      Bio || null,
    ]);

    return res.status(201).json("Tạo giáo viên thành công!");
  } catch (error) {
    console.error(error);
    if (createdUserId)
      await queryAsync("DELETE FROM Users WHERE UserId = ?", [createdUserId]);
    return res.status(500).json("Lỗi server khi tạo tài khoản.");
  }
};

export const getAvailableTeachers = async (req, res) => {
  try {
    const { startDate, endDate, startTime, endTime, days, excludeClassId } =
      req.body;
    // days: mảng ['2', '4', '6'] hoặc chuỗi "2,4,6"

    // 1. Lấy tất cả giáo viên
    const allTeachers = await queryAsync(
      "SELECT TeacherId, FullName, TeacherCode FROM Teachers"
    );

    // 2. Tìm các lớp học CÓ THỂ gây xung đột (trùng ngày tháng và giờ)
    // Logic Overlap: (StartA < EndB) and (EndA > StartB)
    let checkQuery = `
      SELECT TeacherId, Days 
      FROM Classes 
      WHERE Status IN ('Active', 'Upcoming', 'Recruiting')
      AND (StartDate <= ? AND EndDate >= ?) 
      AND (StartTime < ? AND EndTime > ?)
    `;

    const params = [endDate, startDate, endTime, startTime];

    // Nếu đang sửa lớp, loại trừ chính lớp đó ra khỏi check
    if (excludeClassId) {
      checkQuery += " AND ClassId != ?";
      params.push(excludeClassId);
    }

    const conflictingClasses = await queryAsync(checkQuery, params);

    // 3. Lọc chi tiết theo THỨ (Days)
    // Vì DB lưu "2,4,6" dạng string, ta phải xử lý ở code JS để chính xác nhất
    const busyTeacherIds = new Set();
    const reqDays = Array.isArray(days) ? days : days.split(",");

    conflictingClasses.forEach((cls) => {
      if (!cls.Days) return;
      const classDays = cls.Days.split(","); // VD: ['2', '4']

      // Kiểm tra xem có ngày nào trùng nhau không (Intersection)
      const hasOverlapDay = reqDays.some((day) =>
        classDays.includes(day.toString())
      );

      if (hasOverlapDay) {
        busyTeacherIds.add(cls.TeacherId);
      }
    });

    // 4. Trả về danh sách giáo viên KHÔNG nằm trong busyTeacherIds
    const availableTeachers = allTeachers.filter(
      (t) => !busyTeacherIds.has(t.TeacherId)
    );

    return res.status(200).json(availableTeachers);
  } catch (err) {
    console.error("Check availability error:", err);
    return res.status(500).json("Lỗi kiểm tra lịch giáo viên.");
  }
};
