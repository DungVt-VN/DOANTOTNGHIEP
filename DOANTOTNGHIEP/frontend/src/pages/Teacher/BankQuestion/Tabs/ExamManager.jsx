import React, { useState, useEffect, useCallback, forwardRef } from "react"; // 1. Thêm forwardRef
import { message, Modal, Select, DatePicker, Form } from "antd";
import { removeVietnameseTones } from "@/js/Helper";

// Import công cụ bổ trợ
import { AppAlert } from "@/components/AppAlert";
import api from "@/utils/axiosInstance";
import QuestionSelectorModal from "@/components/ExamManager/QuestionSelectorModal";
import ExamFormModal from "@/components/ExamManager/ExamFormModal";
import ExamTable from "@/components/ExamManager/ExamTable";
import ExamToolbar from "@/components/ExamManager/ExamToolbar";

// --- API Endpoints ---
const API_ENDPOINTS = {
  QUIZZES: "/quizzes",
  CLASSES: "/classes",
  QUESTIONS: "/questions",
};

// --- Component Modal Phân Phối ---
const DistributeModal = ({ open, onCancel, onDistribute, loading }) => {
  const [form] = Form.useForm();
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    if (open) {
      api
        .get(API_ENDPOINTS.CLASSES)
        .then((res) => setClasses(res.data))
        .catch((err) => console.error("Lỗi lấy danh sách lớp:", err));
    }
  }, [open]);

  const handleOk = () => {
    form.validateFields().then((values) => {
      onDistribute(values);
      form.resetFields();
    });
  };

  return (
    <Modal
      title="Phân phối đề thi xuống lớp"
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      confirmLoading={loading}
      destroyOnHidden={true} // Giữ nguyên để tránh warning deprecated
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="targetClassId"
          label="Chọn lớp áp dụng"
          rules={[{ required: true, message: "Vui lòng chọn lớp!" }]}
        >
          <Select placeholder="Chọn lớp học..." loading={classes.length === 0}>
            {classes.map((cls) => (
              <Select.Option key={cls.ClassId} value={cls.ClassId}>
                {cls.ClassName}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item
          name="timeRange"
          label="Thời gian mở đề (Bắt đầu - Kết thúc)"
          rules={[{ required: true, message: "Vui lòng chọn thời gian!" }]}
        >
          <DatePicker.RangePicker
            showTime
            format="YYYY-MM-DD HH:mm"
            style={{ width: "100%" }}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

// --- Component Chính ---
// 2. Bọc component trong forwardRef để Ant Design có thể gắn ref
const ExamManager = forwardRef(({ courseId }, ref) => {
  const isMasterMode = true;

  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [isDistributeModalOpen, setIsDistributeModalOpen] = useState(false);
  const [currentExam, setCurrentExam] = useState(null);

  const [allQuestions, setAllQuestions] = useState([]);
  const [targetKeys, setTargetKeys] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // 1. Lấy danh sách đề Master của Course
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(API_ENDPOINTS.QUIZZES, {
        params: { courseId, type: "master" },
      });
      const formattedData = res.data.map((item) => ({
        Id: item.QuizId,
        Title: item.Title,
        Duration: item.DurationMinutes,
        QuestionCount: item.QuestionCount || 0,
        PassScore: item.PassScore,
        CreatedAt: item.CreatedAt,
        Status: item.Status,
        CourseName: item.CourseName,
      }));
      setExams(formattedData);
    } catch (error) {
      if (error.response?.status !== 404) message.error("Lỗi tải đề thi mẫu");
      setExams([]);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    if (courseId) fetchData();
  }, [courseId, fetchData]);

  // -----------------------------------------------------------------------
  // 2. Lấy ngân hàng câu hỏi và câu hỏi đã chọn
  // -----------------------------------------------------------------------
  const fetchQuestionsData = async (quizId) => {
    setModalLoading(true);
    try {
      const [groupedRes, selectedRes] = await Promise.all([
        api.get(`/questions/course/${courseId}/full-grouped`),
        api.get(`/questions/quiz/${quizId}/questions`),
      ]);

      const flattenedQuestions = [];

      // Xử lý dữ liệu trả về từ API Grouped
      if (groupedRes.data && Array.isArray(groupedRes.data)) {
        groupedRes.data.forEach((chapter) => {
          if (chapter.Questions && chapter.Questions.length > 0) {
            chapter.Questions.forEach((q) => {
              flattenedQuestions.push({
                key: q.QuestionId.toString(),
                title: q.QuestionContent || "Câu hỏi không có nội dung",
                description: q.Description || "",
                chapter: chapter.ChapterName,
                level: q.DifficultyLevel || "Trung bình",
                type: q.QuestionType || "Trắc nghiệm",
              });
            });
          }
        });
      }
      setAllQuestions(flattenedQuestions);
      if (selectedRes.data && Array.isArray(selectedRes.data)) {
        setTargetKeys(selectedRes.data.map((q) => q.QuestionId.toString()));
      }
    } catch (error) {
      console.error("Fetch error:", error);
      message.error("Lỗi tải dữ liệu ngân hàng câu hỏi");
    } finally {
      setModalLoading(false);
    }
  };

  // --- HANDLERS ---
  const handleOpenCreate = () => {
    setCurrentExam(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (exam) => {
    setCurrentExam(exam);
    setIsFormModalOpen(true);
  };

  const handleOpenQuestions = async (exam) => {
    setCurrentExam(exam);
    setIsQuestionModalOpen(true);
    await fetchQuestionsData(exam.Id);
  };
  console.log(allQuestions);

  const handleOpenDistribute = (exam) => {
    setCurrentExam(exam);
    setIsDistributeModalOpen(true);
  };

  // --- ACTIONS ---
  const handleSaveExam = async (values) => {
    setLoading(true);
    try {
      const payload = {
        title: values.title,
        durationMinutes: values.durationMinutes,
        passScore: values.passScore,
        courseId: courseId,
        classId: null,
      };

      if (currentExam?.Id) {
        await api.put(`${API_ENDPOINTS.QUIZZES}/${currentExam.Id}`, payload);
        message.success("Cập nhật thông tin đề thi thành công");
        setIsFormModalOpen(false);
        fetchData();
      } else {
        const res = await api.post(API_ENDPOINTS.QUIZZES, payload);
        const newQuizId = res.data.quizId;
        if (newQuizId) {
          message.success("Đã tạo đề mẫu, vui lòng chọn câu hỏi");
          setCurrentExam({ Id: newQuizId, Title: values.title });
          setIsFormModalOpen(false);
          setIsQuestionModalOpen(true);
          await fetchQuestionsData(newQuizId);
        }
      }
    } catch (error) {
      message.error(error.response?.data?.message || "Lỗi lưu đề thi");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveQuestions = async (newTargetKeys) => {
    const quizId = currentExam?.QuizId || currentExam?.Id;

    if (!quizId) {
      message.error("Không tìm thấy ID đề thi.");
      return;
    }

    setModalLoading(true);
    try {
      await api.post(`${API_ENDPOINTS.QUIZZES}/${quizId}/questions`, {
        questionIds: newTargetKeys,
      });

      message.success("Đã cập nhật danh sách câu hỏi thành công!");
      setIsQuestionModalOpen(false);
      fetchData(); // Reload để update số lượng câu
    } catch (error) {
      console.error("Failed to save questions:", error);
      message.error("Lỗi khi lưu danh sách câu hỏi.");
    } finally {
      setModalLoading(false);
    }
  };

  const handleDistributeExam = async (values) => {
    setLoading(true);
    try {
      const payload = {
        targetClassId: values.targetClassId,
        startTime: values.timeRange[0].toISOString(),
        endTime: values.timeRange[1].toISOString(),
      };
      await api.post(
        `${API_ENDPOINTS.QUIZZES}/${currentExam.Id}/distribute`,
        payload
      );
      message.success("Phân phối đề xuống lớp thành công!");
      setIsDistributeModalOpen(false);
    } catch (error) {
      message.error("Lỗi phân phối đề thi");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExam = (id) => {
    AppAlert.confirmDelete({
      title: "Xác nhận xóa đề thi gốc?",
      content:
        "Hành động này không thể hoàn tác và có thể ảnh hưởng đến dữ liệu thống kê.",
      onOk: async () => {
        try {
          await api.delete(`${API_ENDPOINTS.QUIZZES}/${id}`);
          message.success("Đã xóa đề thi");
          setExams((prev) => prev.filter((ex) => ex.Id !== id));
        } catch (error) {
          message.error("Lỗi khi xóa đề thi");
        }
      },
    });
  };

  return (
    // 3. Gán ref vào div bao ngoài cùng
    <div
      ref={ref}
      className="h-full flex flex-col bg-white rounded-lg shadow-sm"
    >
      <ExamToolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onRefresh={fetchData}
        loading={loading}
        onAdd={handleOpenCreate}
      />

      <div className="flex-1 overflow-auto">
        <ExamTable
          dataSource={exams.filter((e) =>
            removeVietnameseTones(e.Title || "")
              .toLowerCase()
              .includes(removeVietnameseTones(searchTerm).toLowerCase())
          )}
          loading={loading}
          onEdit={handleOpenEdit}
          onSelectQuestions={handleOpenQuestions}
          onDelete={handleDeleteExam}
          isMasterMode={isMasterMode}
          onDistribute={handleOpenDistribute}
        />
      </div>

      <ExamFormModal
        open={isFormModalOpen}
        onCancel={() => setIsFormModalOpen(false)}
        onSubmit={handleSaveExam}
        initialValues={currentExam}
        loading={loading}
      />

      <QuestionSelectorModal
        open={isQuestionModalOpen}
        onCancel={() => setIsQuestionModalOpen(false)}
        onSave={handleSaveQuestions}
        examTitle={currentExam?.Title}
        allQuestions={allQuestions}
        initialTargetKeys={targetKeys}
        loading={modalLoading}
      />

      <DistributeModal
        open={isDistributeModalOpen}
        onCancel={() => setIsDistributeModalOpen(false)}
        onDistribute={handleDistributeExam}
        loading={loading}
      />
    </div>
  );
});

export default ExamManager;
