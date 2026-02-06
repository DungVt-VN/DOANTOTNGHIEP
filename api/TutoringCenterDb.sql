DROP DATABASE IF EXISTS TutoringCenterDB2;

CREATE DATABASE TutoringCenterDB2 CHARACTER
SET
    utf8mb4 COLLATE utf8mb4_unicode_ci;

USE TutoringCenterDB2;

-- ==================== 1. USERS ====================
CREATE TABLE
    Users (
        UserId INT AUTO_INCREMENT PRIMARY KEY,
        UserName VARCHAR(50) NOT NULL UNIQUE,
        Password VARCHAR(255) NOT NULL,
        Email VARCHAR(100) UNIQUE,
        Avatar VARCHAR(255),
        Role ENUM ('Admin', 'Teacher', 'Student') NOT NULL DEFAULT 'Student',
        CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

CREATE TABLE
    Teachers (
        TeacherId INT AUTO_INCREMENT PRIMARY KEY,
        UserId INT NOT NULL,
        FullName VARCHAR(100) NOT NULL,
        PhoneNo VARCHAR(20) NOT NULL,
        TeacherCode VARCHAR(20) NOT NULL UNIQUE,
        Address VARCHAR(255),
        Bio TEXT,
        SalaryRate DECIMAL(10, 2),
        FOREIGN KEY (UserId) REFERENCES Users (UserId) ON DELETE CASCADE
    );

CREATE TABLE
    Students (
        StudentId INT AUTO_INCREMENT PRIMARY KEY,
        UserId INT NOT NULL,
        FullName VARCHAR(100) NOT NULL,
        StudentCode VARCHAR(20) NOT NULL UNIQUE,
        PhoneNo VARCHAR(20),
        ParentPhoneNo VARCHAR(20),
        SchoolName VARCHAR(100),
        BirthDate DATE,
        FOREIGN KEY (UserId) REFERENCES Users (UserId) ON DELETE CASCADE
    );

-- ==================== 2. MASTER CONTENT ====================
CREATE TABLE
    Courses (
        CourseId INT AUTO_INCREMENT PRIMARY KEY,
        CourseImage VARCHAR(225),
        CourseName VARCHAR(255) NOT NULL,
        Subject VARCHAR(100),
        Description TEXT,
        BaseTuitionFee DECIMAL(12, 2),
        CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

CREATE TABLE
    CourseChapters (
        CourseChapterId INT AUTO_INCREMENT PRIMARY KEY,
        CourseId INT,
        ClassId INT,
        Title VARCHAR(255) NOT NULL,
        Description TEXT,
        OrderIndex INT,
        FOREIGN KEY (CourseId) REFERENCES Courses (CourseId) ON DELETE CASCADE,
        FOREIGN KEY (ClassId) REFERENCES Classes (ClassId) ON DELETE CASCADE
    );

-- Ngân hàng câu hỏi
CREATE TABLE
    QuestionBank (
        QuestionId INT AUTO_INCREMENT PRIMARY KEY,
        CourseChapterId INT,
        QuestionContent TEXT NOT NULL,
        QuestionType ENUM ('SingleChoice', 'MultipleChoice', 'TextInput') NOT NULL DEFAULT 'SingleChoice',
        DifficultyLevel ENUM ('Easy', 'Medium', 'Hard') DEFAULT 'Medium',
        MediaUrl VARCHAR(500),
        MediaType ENUM ('None', 'Image', 'Video') DEFAULT 'None',
        CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (CourseChapterId) REFERENCES CourseChapters (CourseChapterId) ON DELETE SET NULL
    );

CREATE TABLE
    QuestionOptions (
        OptionId INT AUTO_INCREMENT PRIMARY KEY,
        QuestionId INT,
        OptionText TEXT NOT NULL,
        IsCorrect BOOLEAN DEFAULT FALSE,
        FOREIGN KEY (QuestionId) REFERENCES QuestionBank (QuestionId) ON DELETE CASCADE
    );

-- ==================== 3. CLASSES ====================
CREATE TABLE
    Classrooms (
        RoomId INT AUTO_INCREMENT PRIMARY KEY,
        RoomName VARCHAR(50) NOT NULL UNIQUE,
        Location VARCHAR(100),
        Capacity INT DEFAULT 30,
        Status ENUM ('Active', 'Maintenance') DEFAULT 'Active'
    );

CREATE TABLE
    Classes (
        ClassId INT AUTO_INCREMENT PRIMARY KEY,
        CourseId INT,
        TeacherId INT,
        RoomId INT,
        ClassName VARCHAR(100) NOT NULL,
        StartDate DATE,
        EndDate DATE,
        Days VARCHAR(50),
        StartTime TIME,
        EndTime TIME,
        MaxStudents INT DEFAULT 30,
        TuitionFee DECIMAL(12, 2) NOT NULL,
        Status ENUM (
            'Active',
            'Finished',
            'Cancelled',
            'Upcoming',
            'Recruiting'
        ) DEFAULT 'Recruiting',
        CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (CourseId) REFERENCES Courses (CourseId) ON DELETE CASCADE,
        FOREIGN KEY (TeacherId) REFERENCES Teachers (TeacherId) ON DELETE SET NULL,
        FOREIGN KEY (RoomId) REFERENCES Classrooms (RoomId) ON DELETE SET NULL
    );

CREATE TABLE
    Class_Student (
        EnrollmentId INT AUTO_INCREMENT PRIMARY KEY,
        ClassId INT,
        StudentId INT,
        EnrollmentDate DATETIME DEFAULT CURRENT_TIMESTAMP,
        IsLocked BOOLEAN DEFAULT FALSE,
        FOREIGN KEY (ClassId) REFERENCES Classes (ClassId) ON DELETE CASCADE,
        FOREIGN KEY (StudentId) REFERENCES Students (StudentId) ON DELETE CASCADE
    );

-- ==================== 4. LESSONS & PROGRESS ====================
CREATE TABLE
    Lessons (
        LessonId INT AUTO_INCREMENT PRIMARY KEY,
        ChapterId INT, -- Link tới Master Chapter
        ClassId INT, -- Link tới Lớp
        Title VARCHAR(255) NOT NULL,
        Description TEXT,
        VideoUrl VARCHAR(500),
        OrderIndex INT,
        CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ChapterId) REFERENCES CourseChapters (CourseChapterId) ON DELETE CASCADE,
        FOREIGN KEY (ClassId) REFERENCES Classes (ClassId) ON DELETE CASCADE
    );

CREATE TABLE
    Student_Lesson_Progress (
        ProgressId INT AUTO_INCREMENT PRIMARY KEY,
        StudentId INT NOT NULL,
        LessonId INT NOT NULL,
        IsCompleted BOOLEAN DEFAULT FALSE,
        LastAccessed DATETIME DEFAULT CURRENT_TIMESTAMP,
        CompletedAt DATETIME,
        FOREIGN KEY (StudentId) REFERENCES Students (StudentId) ON DELETE CASCADE,
        FOREIGN KEY (LessonId) REFERENCES Lessons (LessonId) ON DELETE CASCADE,
        UNIQUE KEY unique_student_lesson (StudentId, LessonId)
    );

CREATE TABLE
    LessonMaterials (
        LessonMaterialId INT AUTO_INCREMENT PRIMARY KEY,
        LessonId INT,
        UploadedBy INT,
        Title VARCHAR(255) NOT NULL,
        FileUrl VARCHAR(500),
        FileType VARCHAR(50), -- pdf, docx, zip...
        Category VARCHAR(50) DEFAULT 'Material', -- 'Material' hoặc 'Exercise'
        CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (LessonId) REFERENCES Lessons (LessonId) ON DELETE CASCADE,
        FOREIGN KEY (UploadedBy) REFERENCES Teachers (TeacherId)
    );

CREATE TABLE
    Quizzes (
        QuizId INT AUTO_INCREMENT PRIMARY KEY,
        ParentQuizId INT NULL,
        CourseId INT NULL,
        ClassId INT NULL,
        Title VARCHAR(255) NOT NULL,
        DurationMinutes INT NOT NULL DEFAULT 45,
        PassScore FLOAT DEFAULT 5.0,
        StartTime DATETIME,
        EndTime DATETIME,
        AccessCode VARCHAR(20),
        IsRandomize BOOLEAN DEFAULT FALSE,
        Status ENUM ('upcoming', 'ongoing', 'finished') DEFAULT 'upcoming',
        CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        -- Khóa ngoại
        FOREIGN KEY (CourseId) REFERENCES Courses (CourseId) ON DELETE SET NULL,
        FOREIGN KEY (ClassId) REFERENCES Classes (ClassId) ON DELETE CASCADE,
        FOREIGN KEY (ParentQuizId) REFERENCES Quizzes (QuizId) ON DELETE SET NULL
    );

CREATE TABLE
    Quiz_Question_Mapping (
        QuizId INT,
        QuestionId INT,
        OrderIndex INT,
        ScoreWeight FLOAT DEFAULT 1.0,
        PRIMARY KEY (QuizId, QuestionId),
        FOREIGN KEY (QuizId) REFERENCES Quizzes (QuizId) ON DELETE CASCADE,
        FOREIGN KEY (QuestionId) REFERENCES QuestionBank (QuestionId) ON DELETE CASCADE
    );

CREATE TABLE
    QuizResults (
        ResultId INT AUTO_INCREMENT PRIMARY KEY,
        QuizId INT,
        StudentId INT,
        Score FLOAT,
        CorrectCount INT,
        TotalQuestions INT,
        CompletedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (QuizId) REFERENCES Quizzes (QuizId) ON DELETE CASCADE,
        FOREIGN KEY (StudentId) REFERENCES Students (StudentId) ON DELETE CASCADE
    );

-- ==================== 5. ASSIGNMENTS (BÀI TẬP VỀ NHÀ) ====================
CREATE TABLE
    Assignments (
        AssignmentId INT AUTO_INCREMENT PRIMARY KEY,
        ClassId INT,
        Title VARCHAR(255) NOT NULL,
        Description TEXT,
        DueDate DATETIME,
        QuizId INT NULL,
        CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        Type ENUM ('quiz', 'essay', 'exam', 'homework') DEFAULT 'homework',
        Status ENUM (
            'active',
            'grading',
            'upcoming',
            'draft',
            'closed'
        ) DEFAULT 'draft',
        FOREIGN KEY (ClassId) REFERENCES Classes (ClassId) ON DELETE CASCADE,
        FOREIGN KEY (QuizId) REFERENCES Quizzes (QuizId) ON DELETE SET NULL
    );

CREATE
OR REPLACE VIEW View_Assignment_Progress AS
SELECT
    a.AssignmentId,
    a.ClassId,
    (
        SELECT
            COUNT(*)
        FROM
            Submissions s
        WHERE
            s.AssignmentId = a.AssignmentId
    ) AS SubmittedCount,
    (
        SELECT
            COUNT(*)
        FROM
            Class_Student cs
        WHERE
            cs.ClassId = a.ClassId
    ) AS TotalStudents
FROM
    Assignments a;

CREATE TABLE
    Submissions (
        SubmissionId INT AUTO_INCREMENT PRIMARY KEY,
        AssignmentId INT,
        Anser StudentId INT,
        ResultId INT NULL,
        SubmissionDate DATETIME DEFAULT CURRENT_TIMESTAMP,
        Score FLOAT,
        TeacherComment TEXT,
        Status ENUM ('Submitted', 'Late', 'Graded') DEFAULT 'Submitted',
        FileUrl VARCHAR(500), -- Link file bài làm
        FOREIGN KEY (AssignmentId) REFERENCES Assignments (AssignmentId) ON DELETE CASCADE,
        FOREIGN KEY (StudentId) REFERENCES Students (StudentId) ON DELETE CASCADE,
        FOREIGN KEY (ResultId) REFERENCES QuizResults (ResultId) ON DELETE SET NULL
    );

-- BẢNG QUAN TRỌNG: Lưu chi tiết bài làm
CREATE TABLE
    StudentAnswers (
        AnswerId INT AUTO_INCREMENT PRIMARY KEY,
        ResultId INT,
        QuestionId INT,
        SelectedOptionId INT,
        TextAnswer TEXT,
        IsCorrect BOOLEAN,
        FOREIGN KEY (ResultId) REFERENCES QuizResults (ResultId) ON DELETE CASCADE,
        FOREIGN KEY (QuestionId) REFERENCES QuestionBank (QuestionId) ON DELETE CASCADE,
        FOREIGN KEY (SelectedOptionId) REFERENCES QuestionOptions (OptionId) ON DELETE SET NULL
    );

-- ==================== 7. FINANCE & NOTIFICATIONS ====================
CREATE TABLE
    TuitionPayments (
        PaymentId INT AUTO_INCREMENT PRIMARY KEY,
        StudentId INT,
        ClassId INT,
        Amount DECIMAL(12, 2) NOT NULL,
        PaymentDate DATETIME DEFAULT CURRENT_TIMESTAMP,
        Status ENUM ('Completed', 'Pending', 'Failed') DEFAULT 'Completed',
        Note TEXT,
        FOREIGN KEY (StudentId) REFERENCES Students (StudentId),
        FOREIGN KEY (ClassId) REFERENCES Classes (ClassId)
    );

CREATE TABLE
    Attendance (
        AttendanceId INT AUTO_INCREMENT PRIMARY KEY,
        ClassId INT,
        StudentId INT,
        Date DATE NOT NULL,
        Status ENUM ('Present', 'Absent', 'Late') DEFAULT 'Absent',
        Note TEXT,
        FOREIGN KEY (ClassId) REFERENCES Classes (ClassId),
        FOREIGN KEY (StudentId) REFERENCES Students (StudentId)
    );

CREATE TABLE
    Notifications (
        NotiId INT AUTO_INCREMENT PRIMARY KEY,
        UserId INT,
        Title VARCHAR(100),
        Message TEXT,
        Type ENUM ('System', 'Payment', 'Assignment', 'Quiz'),
        IsRead BOOLEAN DEFAULT FALSE,
        CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (UserId) REFERENCES Users (UserId) ON DELETE CASCADE
    );

ALTER TABLE Assignments
ADD COLUMN FileUrl VARCHAR(500) NULL