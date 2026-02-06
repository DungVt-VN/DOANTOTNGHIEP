import cron from "node-cron";
import { db } from "../db.js"; // Đảm bảo đường dẫn đúng

const query = (sql, params) => {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, res) => (err ? reject(err) : resolve(res)));
  });
};

const startCronJobs = () => {
  // Chạy mỗi phút một lần (* * * * *)
  cron.schedule("* * * * *", async () => {
    const now = new Date();
    // console.log(`[CronJob] Quét trạng thái hệ thống... ${now.toLocaleTimeString()}`);

    try {
      // =========================================================
      // PHẦN 1: CẬP NHẬT TRẠNG THÁI BÀI KIỂM TRA (QUIZZES)
      // =========================================================

      // 1.1. Upcoming -> Ongoing
      const sqlQuizStart = `
        UPDATE Quizzes 
        SET Status = 'ongoing' 
        WHERE Status = 'upcoming' 
        AND StartTime <= NOW() 
        AND EndTime > NOW()
      `;
      await query(sqlQuizStart);

      // 1.2. Ongoing/Upcoming -> Finished
      const sqlQuizEnd = `
        UPDATE Quizzes 
        SET Status = 'finished' 
        WHERE Status IN ('upcoming', 'ongoing') 
        AND EndTime <= NOW()
      `;
      await query(sqlQuizEnd);

      // =========================================================
      // PHẦN 2: CẬP NHẬT TRẠNG THÁI LỚP HỌC (CLASSES)
      // =========================================================

      // 2.1. Recruiting -> Upcoming
      // Logic: Nếu còn 7 ngày nữa là đến StartDate thì chuyển từ "Tuyển sinh" sang "Sắp diễn ra"
      // DATE_SUB(StartDate, INTERVAL 7 DAY) <= NOW(): Nghĩa là Hiện tại đã vượt qua mốc (Ngày bắt đầu - 7 ngày)
      const sqlClassUpcoming = `
        UPDATE Classes
        SET Status = 'Upcoming'
        WHERE Status = 'Recruiting'
        AND StartDate > NOW()
        AND NOW() >= DATE_SUB(StartDate, INTERVAL 7 DAY)
      `;
      const resClassUpcoming = await query(sqlClassUpcoming);
      if (resClassUpcoming.affectedRows > 0) {
        console.log(
          `🏫 [Classes] Đã chuyển ${resClassUpcoming.affectedRows} lớp sang 'Upcoming'`
        );
      }

      // 2.2. Recruiting/Upcoming -> Active
      // Logic: Đã đến ngày bắt đầu (StartDate <= NOW) và chưa kết thúc (EndDate >= NOW)
      const sqlClassActive = `
        UPDATE Classes
        SET Status = 'Active'
        WHERE Status IN ('Recruiting', 'Upcoming')
        AND StartDate <= NOW()
        AND EndDate >= NOW()
      `;
      const resClassActive = await query(sqlClassActive);
      if (resClassActive.affectedRows > 0) {
        console.log(
          `🏫 [Classes] Đã chuyển ${resClassActive.affectedRows} lớp sang 'Active'`
        );
      }

      // 2.3. Active/Upcoming/Recruiting -> Finished
      // Logic: Đã qua ngày kết thúc (EndDate < NOW)
      const sqlClassFinished = `
        UPDATE Classes
        SET Status = 'Finished'
        WHERE Status IN ('Active', 'Upcoming', 'Recruiting')
        AND EndDate < NOW()
      `;
      const resClassFinished = await query(sqlClassFinished);
      if (resClassFinished.affectedRows > 0) {
        console.log(
          `🏫 [Classes] Đã chuyển ${resClassFinished.affectedRows} lớp sang 'Finished'`
        );
      }
    } catch (error) {
      console.error("❌ Lỗi CronJob System:", error);
    }
  });
};

export default startCronJobs;
