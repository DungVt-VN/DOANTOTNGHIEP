import React, { useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  Button,
  Radio,
  Checkbox,
  Divider,
  message,
} from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";

const { Option } = Select;
const { TextArea } = Input;

const QuestionModal = ({ open, onCancel, onFinish, initialValues }) => {
  const [form] = Form.useForm();

  // Watch Type để render giao diện tương ứng
  // Lưu ý: Tên field trong form vẫn là 'Type' (để khớp với API body),
  // nhưng giá trị sẽ là 'SingleChoice', 'MultipleChoice', 'TextInput'
  const questionType = Form.useWatch("Type", form);

  useEffect(() => {
    if (open) {
      if (initialValues) {
        // --- LOGIC MAP DỮ LIỆU CŨ VÀO FORM ---
        let formData = { ...initialValues };

        if (initialValues.Type === "SingleChoice") {
          // Tìm index của đáp án đúng để set vào RadioGroup
          formData.CorrectIndex = initialValues.Answers?.findIndex(
            (a) => a.IsCorrect
          );
        } else if (initialValues.Type === "TextInput") {
          // Lấy nội dung đáp án mẫu ra field riêng
          formData.EssayAnswer = initialValues.Answers?.[0]?.Content || "";
        }

        form.setFieldsValue(formData);
      } else {
        // --- LOGIC FORM MỚI ---
        form.resetFields();
        form.setFieldsValue({
          Type: "SingleChoice", // Mặc định
          Level: "Medium",
          Answers: [{}, {}, {}, {}], // 4 dòng trống mặc định
          CorrectIndex: 0,
        });
      }
    }
  }, [open, initialValues, form]);

  const handleSubmit = (values) => {
    const { Type, CorrectIndex, EssayAnswer, Answers, ...rest } = values;
    let finalAnswers = [];

    // --- CHUẨN HÓA DỮ LIỆU THEO ENUM CỦA BẠN ---

    if (Type === "TextInput") {
      // TextInput (Tự luận): Chỉ có 1 đáp án là đáp án mẫu
      finalAnswers = [{ Content: EssayAnswer, IsCorrect: true }];
    } else if (Type === "SingleChoice") {
      // SingleChoice: Map CorrectIndex thành IsCorrect
      finalAnswers = Answers.map((ans, index) => ({
        ...ans,
        IsCorrect: index === CorrectIndex,
      }));
    } else if (Type === "MultipleChoice") {
      // MultipleChoice: Lấy trực tiếp IsCorrect từ Checkbox
      finalAnswers = Answers.map((ans) => ({
        ...ans,
        IsCorrect: !!ans.IsCorrect, // Đảm bảo boolean
      }));

      // Validate: Phải chọn ít nhất 1 đáp án đúng
      if (!finalAnswers.some((a) => a.IsCorrect)) {
        message.error(
          "Vui lòng chọn ít nhất 1 đáp án đúng cho câu hỏi nhiều lựa chọn!"
        );
        return;
      }
    }

    onFinish({ ...rest, Type, Answers: finalAnswers });
  };

  return (
    <Modal
      title={initialValues ? "Cập nhật câu hỏi" : "Thêm câu hỏi mới"}
      open={open}
      onCancel={onCancel}
      width={800}
      onOk={() => form.submit()}
      okText="Lưu câu hỏi"
      centered
      maskClosable={false}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        {/* Hàng 1: Loại & Độ khó */}
        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            name="Type"
            label="Loại câu hỏi"
            rules={[{ required: true }]}
          >
            <Select>
              {/* Value phải khớp chính xác với ENUM trong Database */}
              <Option value="SingleChoice">Trắc nghiệm (1 đáp án)</Option>
              <Option value="MultipleChoice">Trắc nghiệm (Nhiều đáp án)</Option>
              <Option value="TextInput">Tự luận (Điền đáp án)</Option>
            </Select>
          </Form.Item>
          <Form.Item name="Level" label="Độ khó">
            <Select>
              <Option value="Easy">Dễ</Option>
              <Option value="Medium">Trung bình</Option>
              <Option value="Hard">Khó</Option>
            </Select>
          </Form.Item>
        </div>

        {/* Nội dung câu hỏi */}
        <Form.Item
          name="Content"
          label="Nội dung câu hỏi"
          rules={[
            { required: true, message: "Vui lòng nhập nội dung câu hỏi" },
          ]}
        >
          <TextArea rows={3} placeholder="Nhập câu hỏi..." />
        </Form.Item>

        {/* --- KHU VỰC RENDER THEO LOẠI --- */}

        {/* CASE 1: TỰ LUẬN (TextInput) */}
        {questionType === "TextInput" && (
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <Form.Item
              name="EssayAnswer"
              label="Đáp án mẫu / Từ khóa (Dành cho hệ thống check hoặc giáo viên chấm)"
              rules={[{ required: true, message: "Hãy nhập đáp án mẫu" }]}
            >
              <TextArea rows={4} placeholder="Nhập đáp án chính xác..." />
            </Form.Item>
          </div>
        )}

        {/* CASE 2 & 3: TRẮC NGHIỆM (SingleChoice & MultipleChoice) */}
        {(questionType === "SingleChoice" ||
          questionType === "MultipleChoice") && (
          <>
            <Divider orientation="left" className="text-xs text-gray-500">
              {questionType === "SingleChoice"
                ? "Chọn 1 đáp án đúng"
                : "Check vào các đáp án đúng"}
            </Divider>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              {/* Nếu là SingleChoice thì bọc Radio.Group ra ngoài */}
              {questionType === "SingleChoice" ? (
                <Form.Item name="CorrectIndex" noStyle>
                  <Radio.Group className="w-full">
                    <AnswerListFields isMulti={false} />
                  </Radio.Group>
                </Form.Item>
              ) : (
                // MultipleChoice dùng Checkbox độc lập
                <AnswerListFields isMulti={true} />
              )}
            </div>
          </>
        )}
      </Form>
    </Modal>
  );
};

// Component con giữ nguyên logic cũ
const AnswerListFields = ({ isMulti }) => (
  <Form.List name="Answers">
    {(fields, { add, remove }) => (
      <>
        {fields.map((field, index) => (
          <div key={field.key} className="flex items-center gap-3 mb-3">
            {isMulti ? (
              <Form.Item
                {...field}
                name={[field.name, "IsCorrect"]}
                valuePropName="checked"
                noStyle
              >
                <Checkbox className="mr-0 scale-125" />
              </Form.Item>
            ) : (
              <Radio value={index} className="mr-0" />
            )}

            <span className="font-bold text-slate-500 w-6">
              {String.fromCharCode(65 + index)}.
            </span>

            <Form.Item
              {...field}
              name={[field.name, "Content"]}
              noStyle
              rules={[{ required: true, message: "Nhập nội dung" }]}
            >
              <Input placeholder={`Phương án ${index + 1}`} />
            </Form.Item>

            {fields.length > 2 && (
              <DeleteOutlined
                className="text-red-400 hover:text-red-600 cursor-pointer"
                onClick={() => remove(field.name)}
              />
            )}
          </div>
        ))}
        <Form.Item>
          <Button
            type="dashed"
            onClick={() => add()}
            block
            icon={<PlusOutlined />}
          >
            Thêm phương án
          </Button>
        </Form.Item>
      </>
    )}
  </Form.List>
);

export default QuestionModal;
