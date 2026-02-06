import React, { useState, useEffect } from "react";
import { Modal, Table, Button, Tag, message } from "antd";
import api from "@/utils/axiosInstance";

const QuizSelector = ({ open, onCancel, onSelectQuiz, courseId }) => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setLoading(true);
      api
        .get(`/quizzes`, { params: { courseId, type: "master" } })
        .then((res) => setQuizzes(res.data))
        .catch(() => message.error("Lỗi tải danh sách đề"))
        .finally(() => setLoading(false));
    }
  }, [open, courseId]);

  const columns = [
    { title: "Tên đề", dataIndex: "Title", key: "Title" },
    {
      title: "Số câu",
      dataIndex: "QuestionCount",
      align: "center",
      render: (v) => <Tag color="blue">{v}</Tag>,
    },
    {
      title: "Thời gian",
      dataIndex: "DurationMinutes",
      render: (v) => `${v} phút`,
    },
    {
      title: "",
      render: (_, r) => (
        <Button
          size="small"
          type="link"
          onClick={() => {
            onSelectQuiz(r);
            onCancel();
          }}
        >
          Chọn
        </Button>
      ),
    },
  ];

  return (
    <Modal
      title="Chọn đề thi từ Ngân hàng"
      open={open}
      onCancel={onCancel}
      footer={null}
      width={700}
      centered
      destroyOnClose
    >
      <Table
        dataSource={quizzes}
        columns={columns}
        rowKey="QuizId"
        loading={loading}
        pagination={{ pageSize: 5 }}
        size="small"
      />
    </Modal>
  );
};

export default QuizSelector;
