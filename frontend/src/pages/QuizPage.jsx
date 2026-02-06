import React, { useState, useEffect, useMemo, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "@/context/authContext";
import {
  Button,
  Card,
  Input,
  message,
  Modal,
  Progress,
  Spin,
  Statistic,
  Typography,
  Tooltip,
  Tag,
  Result,
  List, // Import thêm List cho phần hướng dẫn
} from "antd";
import {
  ChevronLeft,
  ChevronRight,
  Flag,
  Save,
  CheckCircle2,
  LayoutDashboard,
  Timer,
  CheckSquare,
  Circle,
  Trophy,
  Clock, // Thêm icon cho intro
  HelpCircle, // Thêm icon cho intro
  FileText, // Thêm icon cho intro
} from "lucide-react";
import api from "@/utils/axiosInstance";

const { Title, Text } = Typography;
const { Countdown } = Statistic;

// GIẢM CHIỀU CAO HEADER XUỐNG CHÚT
const SUB_HEADER_HEIGHT = 56; // Cũ là 64

const QuizPage = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext);
  const userId = currentUser?.UserId;

  // --- STATE ---
  const [loading, setLoading] = useState(true);
  const [quizData, setQuizData] = useState(null);
  const [status, setStatus] = useState("intro");
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [savedQuestionIds, setSavedQuestionIds] = useState(new Set());
  const [flaggedQuestions, setFlaggedQuestions] = useState(new Set());
  const [deadline, setDeadline] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  // --- NEW STATE FOR RESULT MODAL ---
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [resultData, setResultData] = useState(null);

  // --- PROGRESS CALCULATION ---
  const progressPercent = useMemo(() => {
    if (!quizData?.questions?.length) return 0;
    return Math.round(
      (savedQuestionIds.size / quizData.questions.length) * 100,
    );
  }, [savedQuestionIds, quizData]);

  // --- FETCH DATA & PERSISTENCE ---
  useEffect(() => {
    if (!userId) return;

    const fetchQuiz = async () => {
      try {
        const res = await api.get(`/quizzes/detail/${quizId}/${userId}`);
        const data = res.data;
        setQuizData(data);

        // Khôi phục đáp án
        if (data.savedAnswers) {
          const savedMap = {};
          const savedIds = new Set();
          data.savedAnswers.forEach((ans) => {
            let val = ans.SelectedOptionId || ans.TextAnswer;
            if (typeof val === "string" && val.includes(",")) {
              val = val.split(",").map(Number);
            }
            savedMap[ans.QuestionId] = val;
            savedIds.add(ans.QuestionId);
          });
          setAnswers(savedMap);
          setSavedQuestionIds(savedIds);
        }

        // Khôi phục thời gian
        const storedDeadline = localStorage.getItem(`quiz_deadline_${quizId}`);
        if (storedDeadline) {
          const deadlineNum = parseInt(storedDeadline, 10);
          if (deadlineNum > Date.now()) {
            setDeadline(deadlineNum);
            setStatus("doing");
          } else {
            localStorage.removeItem(`quiz_deadline_${quizId}`);
          }
        }
      } catch (error) {
        console.error(error);
        message.error("Không thể tải đề thi hoặc thông tin học sinh.");
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [quizId, userId]);

  // --- LOGIC ---
  const handleStartQuiz = () => {
    const durationMs = quizData.DurationMinutes * 60 * 1000;
    const newDeadline = Date.now() + durationMs;
    setDeadline(newDeadline);
    localStorage.setItem(`quiz_deadline_${quizId}`, newDeadline.toString());
    setStatus("doing");
  };

  const handleAnswerChange = (qId, value) => {
    setAnswers((prev) => ({ ...prev, [qId]: value }));
    setSavedQuestionIds((prev) => {
      const newSet = new Set(prev);
      newSet.delete(qId);
      return newSet;
    });
  };

  const handleSaveSingleAnswer = async () => {
    const currentQuestion = quizData.questions[currentQIndex];
    const answerValue = answers[currentQuestion.QuestionId];

    if (answerValue === undefined || answerValue === "") {
      message.warning("Vui lòng chọn đáp án trước khi lưu.");
      return;
    }

    setIsSaving(true);
    try {
      await api.post("/quizzes/save-answer", {
        quizId: quizData.QuizId,
        questionId: currentQuestion.QuestionId,
        answer: answerValue,
        userId: userId,
      });

      setSavedQuestionIds((prev) =>
        new Set(prev).add(currentQuestion.QuestionId),
      );
      message.success("Hệ thống đã ghi nhận đáp án!");
    } catch (error) {
      message.error("Lỗi khi lưu đáp án.");
    } finally {
      setIsSaving(false);
    }
  };

  // --- MODIFIED SUBMIT LOGIC ---
  const processFinalSubmit = async () => {
    const hide = message.loading("Đang nộp bài...", 0);
    try {
      const formattedAnswers = quizData.questions.map((q) => ({
        questionId: q.QuestionId,
        answer: answers[q.QuestionId],
      }));

      const res = await api.post(`/quizzes/submit2`, {
        quizId: quizData.QuizId,
        answers: formattedAnswers,
        userId: userId,
      });

      localStorage.removeItem(`quiz_deadline_${quizId}`);
      hide();
      message.success("Nộp bài thành công!");
      setResultModalOpen(true);
    } catch (error) {
      hide();
      message.error("Lỗi nộp bài.");
    }
  };

  const handleCloseResult = () => {
    setResultModalOpen(false);
    navigate("/student/classes");
  };

  const toggleFlag = (index) => {
    const newFlags = new Set(flaggedQuestions);
    if (newFlags.has(index)) newFlags.delete(index);
    else newFlags.add(index);
    setFlaggedQuestions(newFlags);
  };

  const handleSubmit = (autoSubmit = false) => {
    if (!autoSubmit) {
      Modal.confirm({
        title: "Xác nhận nộp bài?",
        icon: <CheckCircle2 className="text-emerald-600" size={24} />, // Giảm size icon
        content: `Bạn đã lưu thành công ${savedQuestionIds.size}/${quizData?.questions?.length} câu hỏi.`,
        okText: "Nộp ngay",
        onOk: processFinalSubmit,
        centered: true,
      });
    } else {
      processFinalSubmit();
    }
  };

  // --- RENDER HELPERS (RESIZED) ---
  const renderOptionContent = (isSelected, text, type) => (
    <div
      // GIẢM PADDING: p-4 -> p-3
      className={`group relative w-full p-3 rounded-xl border cursor-pointer transition-all duration-200 flex items-start gap-3 select-none 
      ${isSelected ? "border-blue-600 bg-blue-50/60 shadow-sm" : "border-slate-200 bg-white hover:border-blue-400"}`}
    >
      <div
        // GIẢM SIZE ICON CHECK: w-6 h-6 -> w-5 h-5, mt-0.5 -> mt-1
        className={`w-5 h-5 mt-1 border flex items-center justify-center flex-shrink-0 transition-all duration-200 
        ${type === "MultipleChoice" ? "rounded-md" : "rounded-full"} 
        ${isSelected ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 bg-white"}`}
      >
        {isSelected &&
          (type === "MultipleChoice" ? (
            <CheckSquare size={12} strokeWidth={3} />
          ) : (
            <Circle size={8} fill="white" strokeWidth={0} />
          ))}
      </div>
      {/* GIẢM FONT SIZE: text-base -> text-sm */}
      <span
        className={`text-sm font-medium ${isSelected ? "text-blue-900" : "text-slate-700"}`}
      >
        {text}
      </span>
    </div>
  );

  if (loading || !quizData)
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <Spin size="large" tip="Đang tải dữ liệu bài thi..." />
      </div>
    );

  // ==============================================================================
  // PHẦN MỞ ĐẦU (INTRO) - ĐÃ CHỈNH SỬA LẠI GỌN GÀNG VÀ THÊM HƯỚNG DẪN
  // ==============================================================================
  if (status === "intro") {
    const instructions = [
      {
        icon: <Save size={16} className="text-emerald-500" />,
        text: "Hãy ấn nút 'Lưu câu trả lời' sau khi hoàn thành mỗi câu để đảm bảo không mất dữ liệu.",
      },
      {
        icon: <Flag size={16} className="text-amber-500" fill="#F59E0B" />,
        text: "Sử dụng nút 'Cờ vàng' (Gắn cờ) để đánh dấu các câu hỏi bạn chưa chắc chắn. Bạn có thể quay lại các câu này dễ dàng qua danh sách bên phải.",
      },
      {
        icon: <CheckCircle2 size={16} className="text-red-500" />,
        text: "Khi hoàn thành, nhấn nút 'Nộp bài' ở góc trên bên phải. Hệ thống sẽ tự động nộp khi hết giờ.",
      },
    ];

    return (
      <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center p-4 font-sans">
        {/* GIẢM MAX-WIDTH: max-w-lg -> max-w-2xl */}
        <Card className="w-full max-w-2xl shadow-lg rounded-2xl overflow-hidden border-0">
          {/* Header Clean hơn */}
          <div className="bg-white p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <Title level={4} style={{ margin: 0, color: "#1e293b" }}>
                {quizData.Title}
              </Title>
              <div className="flex items-center gap-2 mt-2 text-slate-500 text-sm">
                <FileText size={14} />
                <span>Lớp: {quizData.ClassName || "Chưa xác định"}</span>
              </div>
            </div>
            {/* Stats nhỏ gọn */}
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                <Clock size={16} className="text-blue-600" />
                <span className="font-bold text-slate-700">
                  {quizData.DurationMinutes} phút
                </span>
              </div>
              <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                <HelpCircle size={16} className="text-blue-600" />
                <span className="font-bold text-slate-700">
                  {quizData?.questions?.length} câu
                </span>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6 bg-slate-50/50">
            {/* Hướng dẫn làm bài (MỚI THÊM) */}
            <div>
              <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
                <HelpCircle size={16} /> Hướng dẫn làm bài
              </h4>
              <List
                size="small"
                dataSource={instructions}
                renderItem={(item) => (
                  <List.Item className="!border-0 !py-2 !px-0 flex gap-3 text-sm text-slate-600">
                    <div className="mt-0.5 shrink-0">{item.icon}</div>
                    <div>{item.text}</div>
                  </List.Item>
                )}
              />
            </div>

            {/* Nút bắt đầu nhỏ gọn hơn */}
            <Button
              type="primary"
              size="large"
              block
              onClick={handleStartQuiz}
              // GIẢM CHIỀU CAO: h-16 -> h-11, giảm shadow
              className="h-11 text-base font-bold bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md"
            >
              BẮT ĐẦU LÀM BÀI
            </Button>
          </div>
        </Card>
      </div>
    );
  }
  // ==============================================================================

  const currentQuestion = quizData.questions[currentQIndex];
  const optionsList = currentQuestion?.options || [];
  const isSaved = savedQuestionIds.has(currentQuestion.QuestionId);
  const isFlagged = flaggedQuestions.has(currentQIndex);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans pb-6">
      {/* 1. HEADER (RESIZED) */}
      <div
        className="bg-white sticky z-50 border-b border-slate-200 px-4 md:px-6 flex items-center justify-between shadow-sm"
        style={{ top: 0, height: SUB_HEADER_HEIGHT }}
      >
        <div className="w-1/4 min-w-[140px]">
          <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase mb-1">
            <span>Đã lưu</span>
            <span className="text-emerald-600">
              {savedQuestionIds.size}/{quizData.questions.length}
            </span>
          </div>
          {/* Giảm strokeWidth: 6 -> 4 */}
          <Progress
            percent={progressPercent}
            showInfo={false}
            strokeColor="#10B981"
            strokeWidth={4}
            className="m-0"
          />
        </div>

        <div className="absolute left-1/2 -translate-x-1/2">
          {/* Giảm padding và size: px-6 py-2 -> px-4 py-1.5 */}
          <div className="bg-slate-800 text-white px-4 py-1.5 rounded-full flex items-center gap-2 shadow-sm border border-slate-700">
            <Timer size={16} className="text-emerald-400 animate-pulse" />
            {/* Giảm fontSize: 1.2rem -> 1rem */}
            <Countdown
              value={deadline}
              onFinish={() => handleSubmit(true)}
              format="mm:ss"
              valueStyle={{
                color: "white",
                fontSize: "1rem",
                fontWeight: "700",
                fontFamily: "monospace",
              }}
            />
          </div>
        </div>

        <Button
          type="primary"
          danger
          size="small"
          onClick={() => handleSubmit(false)}
          // Giảm chiều cao và padding: h-10 px-6 -> h-9 px-4
          className="font-bold rounded-lg h-9 px-4 shadow-sm border-0 bg-red-500 hover:bg-red-600 uppercase text-[10px] tracking-widest"
        >
          Nộp bài
        </Button>
      </div>
      <div className="w-full max-w-6xl mx-auto min-h-screen p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
        <div className="lg:col-span-9 space-y-4 flex flex-col h-[calc(100vh-200px)]">
          <Card
            className="shadow-sm rounded-2xl border-slate-200 overflow-hidden flex-1 flex flex-col"
            bodyStyle={{
              padding: 0,
              display: "flex",
              flexDirection: "column",
              flex: 1,
            }}
          >
            {/* Question Header */}
            <div className="px-6 py-3 border-b bg-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                {/* Giảm size số thứ tự: w-12 h-12 -> w-9 h-9, text-lg -> text-base */}
                <div className="bg-blue-600 text-white w-9 h-9 rounded-xl flex items-center justify-center font-bold text-base shadow-sm shadow-blue-100">
                  {currentQIndex + 1}
                </div>
                <div>
                  <Text className="block font-bold text-slate-700 uppercase text-[10px]">
                    Câu hỏi
                  </Text>
                  <Tag
                    color="blue"
                    className="border-0 bg-blue-50 text-blue-600 font-bold rounded-md px-1.5 py-0 text-[10px] m-0"
                  >
                    {currentQuestion.QuestionType === "MultipleChoice"
                      ? "Nhiều lựa chọn"
                      : currentQuestion.QuestionType === "SingleChoice"
                        ? "Một lựa chọn"
                        : "Tự luận"}
                  </Tag>
                </div>
              </div>
              <Tooltip title={isFlagged ? "Bỏ cờ" : "Gắn cờ xem lại"}>
                <Button
                  type="text"
                  onClick={() => toggleFlag(currentQIndex)}
                  // Giảm size nút cờ: w-12 h-12 -> w-9 h-9
                  className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${isFlagged ? "bg-amber-50 text-amber-500 hover:bg-amber-100" : "bg-slate-50 text-slate-400 hover:bg-slate-100"}`}
                  icon={
                    <Flag size={18} fill={isFlagged ? "#F59E0B" : "none"} />
                  }
                />
              </Tooltip>
            </div>

            {/* Question Body (RESIZED PADDING & FONT) */}
            {/* GIẢM PADDING: p-8 md:p-12 -> p-6 md:p-8 */}
            <div className="p-6 md:p-8 bg-white flex-1 overflow-y-auto">
              {/* GIẢM FONT SIZE: text-xl md:text-2xl -> text-lg md:text-xl, mb-10 -> mb-6 */}
              <div className="text-lg md:text-xl text-slate-800 font-semibold leading-relaxed mb-6">
                {currentQuestion.QuestionContent}
              </div>

              {currentQuestion.QuestionType === "TextInput" ? (
                <Input.TextArea
                  rows={6}
                  placeholder="Nhập câu trả lời..."
                  // Giảm padding và font size input
                  className="text-base rounded-xl p-4 border-slate-200 focus:border-blue-500 shadow-sm"
                  value={answers[currentQuestion.QuestionId] || ""}
                  onChange={(e) =>
                    handleAnswerChange(
                      currentQuestion.QuestionId,
                      e.target.value,
                    )
                  }
                />
              ) : (
                <div className="grid grid-cols-1 gap-3 max-w-3xl">
                  {optionsList.map((opt) => {
                    const optId = opt.OptionId;
                    const isSelected = Array.isArray(
                      answers[currentQuestion.QuestionId],
                    )
                      ? answers[currentQuestion.QuestionId].includes(optId)
                      : answers[currentQuestion.QuestionId] === optId;

                    return (
                      <div
                        key={optId}
                        onClick={() => {
                          let val = optId;
                          if (
                            currentQuestion.QuestionType === "MultipleChoice"
                          ) {
                            const current =
                              answers[currentQuestion.QuestionId] || [];
                            val = current.includes(optId)
                              ? current.filter((id) => id !== optId)
                              : [...current, optId];
                          }
                          handleAnswerChange(currentQuestion.QuestionId, val);
                        }}
                      >
                        {renderOptionContent(
                          isSelected,
                          opt.OptionText,
                          currentQuestion.QuestionType,
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer Navigation (RESIZED BUTTONS) */}
            {/* Giảm padding: py-6 -> py-4 */}
            <div className="px-6 py-4 border-t bg-slate-50/80 flex justify-between items-center gap-3">
              <Button
                // size="large" -> mặc định (medium)
                disabled={currentQIndex === 0}
                onClick={() => setCurrentQIndex((prev) => prev - 1)}
                icon={<ChevronLeft size={18} />}
                // Giảm chiều cao: h-12 -> h-10, rounded-2xl -> rounded-xl
                className="rounded-xl border-slate-200 font-bold h-10 text-sm text-slate-600"
              >
                Quay lại
              </Button>
              <Button
                // size="large" -> mặc định
                loading={isSaving}
                onClick={handleSaveSingleAnswer}
                // Giảm chiều cao và padding: h-12 px-8 -> h-10 px-4, rounded-2xl -> rounded-xl, text size
                className={`rounded-xl font-bold h-10 px-4 shadow-sm transition-all text-sm ${isSaved ? "bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600" : "bg-white text-blue-600 border-blue-200 hover:border-blue-400 hover:bg-blue-50"}`}
                icon={isSaved ? <CheckCircle2 size={16} /> : <Save size={16} />}
              >
                {isSaving ? "Đang lưu..." : isSaved ? "Đã lưu" : "Lưu đáp án"}
              </Button>
              <Button
                type="primary"
                // size="large" -> mặc định
                onClick={() =>
                  currentQIndex < quizData.questions.length - 1
                    ? setCurrentQIndex((prev) => prev + 1)
                    : handleSubmit(false)
                }
                // Giảm chiều cao: h-12 -> h-10, rounded-2xl -> rounded-xl, text size
                className="rounded-xl font-bold h-10 bg-blue-600 text-sm shadow-sm"
              >
                {currentQIndex === quizData.questions.length - 1
                  ? "Hoàn thành"
                  : "Tiếp theo"}{" "}
                <ChevronRight size={18} />
              </Button>
            </div>
          </Card>
        </div>

        {/* SIDEBAR (RESIZED) */}
        <div className="lg:col-span-3">
          <Card
            // rounded-3xl -> rounded-2xl
            className="shadow-sm rounded-2xl sticky border-slate-200"
            style={{ top: SUB_HEADER_HEIGHT + 16 }} // +24 -> +16
            bodyStyle={{ padding: "16px" }} // p-24 -> p-16
          >
            <div className="font-bold text-[10px] uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
              <LayoutDashboard size={14} /> Danh sách câu hỏi
            </div>
            {/* Giảm gap: gap-3 -> gap-2 */}
            <div className="grid grid-cols-5 gap-2">
              {quizData.questions.map((q, idx) => {
                const isCurrent = currentQIndex === idx;
                const isSavedItem = savedQuestionIds.has(q.QuestionId);
                const isFlaggedItem = flaggedQuestions.has(idx);
                const hasSelected =
                  answers[q.QuestionId] &&
                  (Array.isArray(answers[q.QuestionId])
                    ? answers[q.QuestionId].length > 0
                    : answers[q.QuestionId] !== "");

                let colorClass =
                  "bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50";
                if (isCurrent)
                  colorClass =
                    "bg-slate-800 text-white border-slate-800 shadow-md font-black";
                else if (isSavedItem)
                  colorClass =
                    "bg-emerald-50 text-emerald-600 border-emerald-200 font-bold";
                else if (hasSelected)
                  colorClass =
                    "bg-blue-50 text-blue-600 border-blue-200 font-bold";

                return (
                  <div
                    key={q.QuestionId}
                    onClick={() => setCurrentQIndex(idx)}
                    // Giảm size ô số: h-10 w-10 -> h-8 w-8, rounded-xl -> rounded-lg, text-xs -> text-[11px]
                    className={`relative h-9 w-full rounded-lg flex items-center justify-center cursor-pointer text-[11px] border transition-all duration-150 ${colorClass}`}
                  >
                    {idx + 1}
                    {isFlaggedItem && (
                      <div className="absolute -top-1 -right-1 bg-amber-500 text-white rounded-full w-4 h-4 flex items-center justify-center border border-white shadow-sm z-10">
                        <Flag size={8} fill="currentColor" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {/* Thu nhỏ phần chú thích */}
            <div className="mt-6 pt-4 border-t border-slate-100 space-y-2 text-[10px] font-medium text-slate-500">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-50 border border-emerald-200 rounded"></div>{" "}
                Đã lưu
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-50 border border-blue-200 rounded"></div>{" "}
                Đã chọn (Chưa lưu)
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-white border border-slate-200 rounded"></div>{" "}
                Chưa làm
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Flag
                  size={10}
                  className="text-amber-500"
                  fill="currentColor"
                />{" "}
                <span className="text-amber-600">Đang gắn cờ</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
      {/* --- 3. RESULT MODAL --- */}
      <Modal
        open={resultModalOpen}
        footer={null}
        closable={false}
        maskClosable={false}
        centered
        width={400} // Giảm width modal kết quả
        className="text-center"
      >
        <div className="p-4 flex flex-col items-center">
          <Result
            icon={<Trophy size={48} className="text-yellow-500 mx-auto mb-2" />} // Giảm size icon
            status="success"
            title={<div className="text-xl font-bold">Hoàn thành bài thi!</div>}
            subTitle={
              resultData ? (
                <div className="space-y-1 mt-2">
                  <div className="text-3xl font-black text-blue-600">
                    {resultData.score || 0} Điểm
                  </div>
                  <div className="text-sm text-slate-500 font-medium">
                    Đúng {resultData.correctCount || 0} /{" "}
                    {resultData.TotalQuestions ||
                      quizData?.questions?.length ||
                      0}{" "}
                    câu
                  </div>
                </div>
              ) : (
                "Đang cập nhật kết quả..."
              )
            }
            extra={[
              <Button
                type="primary"
                key="console"
                // size="large" -> default
                onClick={handleCloseResult}
                // Giảm size nút: h-12 -> h-10, text-sm
                className="bg-blue-600 rounded-xl font-bold h-10 px-6 text-sm min-w-[160px] shadow-sm mt-4"
              >
                QUAY VỀ LỚP HỌC
              </Button>,
            ]}
          />
        </div>
      </Modal>
    </div>
  );
};

export default QuizPage;
