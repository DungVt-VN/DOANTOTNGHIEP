import React, { useEffect, useState } from "react";
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Button,
  Row,
  Col,
  Upload,
  Radio,
  message,
  Tabs,
  List,
  Progress,
  Tag,
} from "antd";
import {
  BookOpen,
  Save,
  Video,
  Link as LinkIcon,
  UploadCloud,
  FileText,
  Trash2,
  Paperclip,
  CheckCircle,
  XCircle,
  ClipboardList,
} from "lucide-react";
import api from "@/utils/axiosInstance";

// --- HELPER: Parse Youtube ID ---
const getYoutubeId = (url) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

// =========================================================
// --- API SERVICES ---
// =========================================================

// 1. Upload Video
const uploadVideoToServer = async (file, onProgress) => {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await api.post("/users/video", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
    });
    // Trả về URL video
    return response.data.data.url;
  } catch (error) {
    console.error("Upload Video error:", error);
    throw error;
  }
};

// 2. Upload File Tài liệu (Trả về full data để lưu DB)
const uploadFileToServer = async (file, onProgress) => {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await api.post("/users/file", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
    });

    // Response mẫu:
    // { success: true, data: { url: "...", format: "pdf", original_name: "..." } }

    // Trả về toàn bộ object data để lưu trữ info file
    return response.data.data;
  } catch (error) {
    console.error("Upload File error:", error);
    throw error;
  }
};

// =========================================================
// --- COMPONENT ---
// =========================================================

const LessonModal = ({
  open,
  onClose,
  onFinish,
  chapterId,
  initialValues,
  submitting,
}) => {
  const [form] = Form.useForm();
  const watchedVideoUrl = Form.useWatch("VideoUrl", form);
  const [videoSource, setVideoSource] = useState("link");

  const [videoState, setVideoState] = useState({
    file: null,
    status: "idle",
    progress: 0,
    url: null,
  });

  const [docFiles, setDocFiles] = useState([]);
  const [exerciseFiles, setExerciseFiles] = useState([]);

  // --- 1. INITIALIZE DATA ---
  useEffect(() => {
    if (open) {
      if (initialValues) {
        form.setFieldsValue(initialValues);

        // 1.1 Video
        const isCloudinary =
          initialValues.VideoUrl &&
          initialValues.VideoUrl.includes("cloudinary");
        setVideoSource(isCloudinary ? "upload" : "link");

        if (isCloudinary) {
          setVideoState({
            file: { name: "Video hiện tại" },
            status: "success",
            progress: 100,
            url: initialValues.VideoUrl,
          });
        } else {
          setVideoState({ file: null, status: "idle", progress: 0, url: null });
        }

        // 1.2 Documents (Map từ DB về UI State)
        if (initialValues.Documents) {
          setDocFiles(
            initialValues.Documents.map((d) => ({
              uid: d.LessonMaterialId || Math.random(),
              name: d.Title, // Tên hiển thị
              status: "success",
              url: d.FileUrl,
              type: d.FileType, // pdf, docx...
              size: 0,
            }))
          );
        } else {
          setDocFiles([]);
        }

        // 1.3 Exercises
        if (initialValues.Exercises) {
          setExerciseFiles(
            initialValues.Exercises.map((e) => ({
              uid: e.LessonMaterialId || Math.random(),
              name: e.Title,
              status: "success",
              url: e.FileUrl,
              type: e.FileType,
              size: 0,
            }))
          );
        } else {
          setExerciseFiles([]);
        }
      } else {
        form.resetFields();
        setVideoSource("link");
        setVideoState({ file: null, status: "idle", progress: 0, url: null });
        setDocFiles([]);
        setExerciseFiles([]);
      }
    }
  }, [open, initialValues, form]);

  // --- 2. VIDEO HANDLERS ---
  const handleSelectVideo = (file) => {
    const isVideo = file.type.startsWith("video/");
    if (!isVideo) {
      message.error("Chỉ được chọn file video!");
      return Upload.LIST_IGNORE;
    }
    const preview = URL.createObjectURL(file);
    setVideoState({
      file: file,
      status: "selected",
      progress: 0,
      url: preview,
    });
    return false;
  };

  const handleUploadVideo = async () => {
    if (!videoState.file) return;
    setVideoState((prev) => ({ ...prev, status: "uploading" }));

    try {
      const url = await uploadVideoToServer(videoState.file, (percent) => {
        setVideoState((prev) => ({ ...prev, progress: percent }));
      });
      setVideoState((prev) => ({ ...prev, status: "success", url: url }));
      form.setFieldValue("VideoUrl", url);
      message.success("Upload video thành công!");
    } catch (error) {
      setVideoState((prev) => ({ ...prev, status: "error" }));
      message.error("Lỗi upload video");
    }
  };

  const handleRemoveVideo = () => {
    setVideoState({ file: null, status: "idle", progress: 0, url: null });
    form.setFieldValue("VideoUrl", "");
  };

  // --- 3. FILES HANDLERS (Docs & Exercises) ---
  const addFilesToList = (file, setList) => {
    const newFile = {
      uid: file.uid,
      file: file,
      name: file.name,
      size: file.size,
      status: "pending",
      url: null,
      // type: file.name.split('.').pop() // Có thể lấy đuôi file tạm ở đây
    };
    setList((prev) => [...prev, newFile]);
    return false;
  };

  const uploadSingleFile = async (uid, fileList, setList) => {
    const currentFile = fileList.find((f) => f.uid === uid);
    if (!currentFile) return;

    setList((prev) =>
      prev.map((item) =>
        item.uid === uid ? { ...item, status: "uploading", percent: 0 } : item
      )
    );

    try {
      // Gọi API Upload -> Nhận về Object Data đầy đủ { url, format, original_name }
      const uploadedData = await uploadFileToServer(currentFile.file, (p) => {
        setList((prev) =>
          prev.map((item) =>
            item.uid === uid ? { ...item, percent: p } : item
          )
        );
      });

      // Update state với thông tin từ Server trả về
      setList((prev) =>
        prev.map((item) =>
          item.uid === uid
            ? {
                ...item,
                status: "success",
                url: uploadedData.url, // FileUrl
                type: uploadedData.format, // FileType (pdf, docx...)
                name: uploadedData.original_name, // Title (lấy tên gốc hoặc user sửa sau này)
              }
            : item
        )
      );
      message.success(`Đã upload ${currentFile.name}`);
    } catch (err) {
      setList((prev) =>
        prev.map((item) =>
          item.uid === uid ? { ...item, status: "error" } : item
        )
      );
      message.error(`Lỗi upload ${currentFile.name}`);
    }
  };

  const removeFileFromList = (uid, setList) => {
    setList((prev) => prev.filter((item) => item.uid !== uid));
  };

  // --- 4. SUBMIT FORM ---
  const handleSubmit = (values) => {
    // Validate Video
    if (videoSource === "upload") {
      if (videoState.status === "uploading")
        return message.warning("Video đang upload...");
      if (videoState.status === "selected")
        return message.error("Vui lòng bấm Upload Video!");
      if (videoState.status === "error")
        return message.error("Video lỗi, hãy kiểm tra lại.");
    }

    // Validate Files
    const pendingDocs = [...docFiles, ...exerciseFiles].filter(
      (f) => f.status === "pending" || f.status === "uploading"
    );
    if (pendingDocs.length > 0) {
      return message.warning("Vui lòng hoàn tất upload các file đang chờ!");
    }

    // --- PREPARE DATA FOR BACKEND ---
    const submitData = {
      ...values,
      ChapterId: chapterId,
      VideoUrl:
        videoSource === "upload" ? videoState.url || "" : values.VideoUrl,

      // Map Documents: Chuyển dữ liệu UI -> DB Schema
      // Table: LessonMaterials (Title, FileUrl, FileType, Category='Material')
      Documents: docFiles
        .filter((f) => f.status === "success")
        .map((f) => ({
          Title: f.name, // Tên file gốc (hoặc user input)
          FileUrl: f.url, // URL từ Cloudinary
          FileType: f.type, // pdf, docx... (từ response upload)
          // Category sẽ được gán ở Backend là 'Material'
        })),

      // Map Exercises
      // Table: LessonMaterials (Title, FileUrl, FileType, Category='Exercise')
      Exercises: exerciseFiles
        .filter((f) => f.status === "success")
        .map((f) => ({
          Title: f.name,
          FileUrl: f.url,
          FileType: f.type,
          // Category sẽ được gán ở Backend là 'Exercise'
        })),
    };

    onFinish(submitData);
  };

  // --- RENDER HELPERS ---
  const renderFileList = (files, setFiles) => (
    <List
      size="small"
      dataSource={files}
      rowKey="uid"
      renderItem={(item) => (
        <List.Item
          className="bg-slate-50 mb-2 rounded-lg border border-slate-200"
          actions={[
            (item.status === "pending" || item.status === "error") && (
              <Button
                type="primary"
                size="small"
                icon={<UploadCloud size={14} />}
                onClick={() => uploadSingleFile(item.uid, files, setFiles)}
              >
                Upload
              </Button>
            ),
            <Button
              type="text"
              danger
              size="small"
              icon={<Trash2 size={14} />}
              onClick={() => removeFileFromList(item.uid, setFiles)}
            />,
          ]}
        >
          <div className="w-full pr-4">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2 overflow-hidden">
                {item.status === "success" ? (
                  <CheckCircle size={16} className="text-green-500" />
                ) : (
                  <FileText size={16} className="text-blue-500" />
                )}
                <span
                  className="font-medium truncate max-w-[200px]"
                  title={item.name}
                >
                  {item.name}
                </span>
                {/* Hiển thị đuôi file nếu có */}
                {item.type && (
                  <Tag className="ml-1 text-[10px]">
                    {item.type.toUpperCase()}
                  </Tag>
                )}
              </div>

              <div>
                {item.status === "pending" && <Tag>Chờ upload</Tag>}
                {item.status === "uploading" && (
                  <Tag color="processing">Đang tải...</Tag>
                )}
                {item.status === "success" && (
                  <Tag color="success">Đã xong</Tag>
                )}
                {item.status === "error" && <Tag color="error">Lỗi</Tag>}
              </div>
            </div>

            {(item.status === "uploading" || item.status === "success") && (
              <Progress
                percent={item.percent || (item.status === "success" ? 100 : 0)}
                size="small"
                status={item.status === "success" ? "success" : "active"}
                showInfo={false}
              />
            )}
          </div>
        </List.Item>
      )}
    />
  );

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 text-slate-800 text-lg">
          <BookOpen className="text-blue-600" size={22} />
          <span className="font-bold">
            {initialValues ? "Cập Nhật Bài Học" : "Thêm Bài Học Mới"}
          </span>
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      width={800}
      className="rounded-xl overflow-hidden"
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        className="mt-4"
      >
        <Tabs
          defaultActiveKey="1"
          items={[
            {
              key: "1",
              label: (
                <span className="flex items-center gap-2">
                  <Video size={16} /> Nội dung Video
                </span>
              ),
              children: (
                <>
                  <Row gutter={16}>
                    <Col span={6}>
                      <Form.Item name="OrderIndex" label="Thứ tự">
                        <InputNumber
                          min={1}
                          className="w-full"
                          placeholder="1"
                        />
                      </Form.Item>
                    </Col>
                    <Col span={18}>
                      <Form.Item
                        name="Title"
                        label="Tên bài học"
                        rules={[
                          { required: true, message: "Nhập tên bài học" },
                        ]}
                      >
                        <Input placeholder="Ví dụ: Bài 1 - Giới thiệu..." />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Form.Item label="Nguồn Video" className="mb-2">
                    <Radio.Group
                      value={videoSource}
                      onChange={(e) => setVideoSource(e.target.value)}
                      buttonStyle="solid"
                    >
                      <Radio.Button value="link">
                        Link YouTube/Ngoài
                      </Radio.Button>
                      <Radio.Button value="upload">
                        Upload File (MP4)
                      </Radio.Button>
                    </Radio.Group>
                  </Form.Item>
                  <div className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    {videoSource === "link" ? (
                      <div className="space-y-3">
                        <Form.Item
                          name="VideoUrl"
                          rules={[
                            {
                              required: videoSource === "link",
                              message: "Nhập link video",
                            },
                          ]}
                          className="mb-0"
                        >
                          <Input
                            prefix={<LinkIcon size={16} />}
                            placeholder="https://youtube.com/..."
                          />
                        </Form.Item>
                        {watchedVideoUrl && !videoState.file && (
                          <div className="aspect-video bg-black rounded-lg overflow-hidden mt-2">
                            {getYoutubeId(watchedVideoUrl) ? (
                              <iframe
                                width="100%"
                                height="100%"
                                src={`https://www.youtube.com/embed/${getYoutubeId(
                                  watchedVideoUrl
                                )}`}
                                title="Preview"
                                frameBorder="0"
                                allowFullScreen
                              />
                            ) : (
                              <video
                                src={watchedVideoUrl}
                                controls
                                className="w-full h-full"
                              />
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4">
                        {!videoState.file && !videoState.url && (
                          <Upload
                            beforeUpload={handleSelectVideo}
                            showUploadList={false}
                            accept="video/*"
                          >
                            <div className="border-2 border-dashed border-blue-300 bg-blue-50 hover:bg-blue-100 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all">
                              <UploadCloud
                                size={40}
                                className="text-blue-500 mb-2"
                              />
                              <span className="font-medium text-slate-700">
                                Nhấn để chọn video từ máy tính
                              </span>
                              <span className="text-xs text-slate-400 mt-1">
                                Hỗ trợ MP4, MOV (Max 100MB)
                              </span>
                            </div>
                          </Upload>
                        )}
                        {(videoState.file || videoState.url) && (
                          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                            <div className="aspect-video bg-black rounded-lg overflow-hidden relative mb-3 group">
                              <video
                                src={videoState.url}
                                controls
                                className="w-full h-full object-contain"
                              />
                              <button
                                type="button"
                                onClick={handleRemoveVideo}
                                className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <XCircle size={20} />
                              </button>
                            </div>
                            {videoState.file && (
                              <div className="flex flex-col gap-2">
                                <div className="flex justify-between items-center text-sm">
                                  <span className="font-medium truncate">
                                    {videoState.file.name}
                                  </span>
                                </div>
                                {videoState.status === "uploading" && (
                                  <Progress
                                    percent={videoState.progress}
                                    status="active"
                                  />
                                )}
                                {videoState.status === "success" && (
                                  <div className="text-green-600 flex items-center gap-1 text-sm">
                                    <CheckCircle size={14} /> Upload hoàn tất
                                  </div>
                                )}
                                {videoState.status === "error" && (
                                  <div className="text-red-500 text-sm">
                                    Upload thất bại
                                  </div>
                                )}
                                {videoState.status === "selected" && (
                                  <Button
                                    type="primary"
                                    onClick={handleUploadVideo}
                                    icon={<UploadCloud size={16} />}
                                    className="mt-2 w-full"
                                  >
                                    Upload Video Ngay
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                        <Form.Item name="VideoUrl" hidden>
                          <Input />
                        </Form.Item>
                      </div>
                    )}
                  </div>
                  <Form.Item name="Description" label="Mô tả">
                    <Input.TextArea rows={3} placeholder="Mô tả nội dung..." />
                  </Form.Item>
                </>
              ),
            },
            {
              key: "2",
              label: (
                <span className="flex items-center gap-2">
                  <Paperclip size={16} /> Tài liệu
                </span>
              ),
              children: (
                <div className="min-h-[300px]">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm text-gray-500">
                      Chọn file và bấm Upload từng file.
                    </span>
                    <Upload
                      beforeUpload={(file) => addFilesToList(file, setDocFiles)}
                      showUploadList={false}
                      multiple
                    >
                      <Button icon={<FileText size={16} />}>Thêm file</Button>
                    </Upload>
                  </div>
                  {renderFileList(docFiles, setDocFiles)}
                  {docFiles.length === 0 && (
                    <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-lg text-gray-400">
                      Chưa có tài liệu nào
                    </div>
                  )}
                </div>
              ),
            },
            {
              key: "3",
              label: (
                <span className="flex items-center gap-2">
                  <ClipboardList size={16} /> Bài tập
                </span>
              ),
              children: (
                <div className="min-h-[300px]">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm text-gray-500">
                      Upload file bài tập (PDF, DOCX...)
                    </span>
                    <Upload
                      beforeUpload={(file) =>
                        addFilesToList(file, setExerciseFiles)
                      }
                      showUploadList={false}
                      multiple
                    >
                      <Button icon={<UploadCloud size={16} />}>
                        Thêm bài tập
                      </Button>
                    </Upload>
                  </div>
                  {renderFileList(exerciseFiles, setExerciseFiles)}
                  {exerciseFiles.length === 0 && (
                    <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-lg text-gray-400">
                      Chưa có bài tập nào
                    </div>
                  )}
                </div>
              ),
            },
          ]}
        />
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
          <Button onClick={onClose} size="large" disabled={submitting}>
            Hủy bỏ
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            className="bg-blue-600 hover:bg-blue-700 min-w-[140px]"
            icon={!submitting && <Save size={18} />}
            loading={submitting}
          >
            {submitting ? "Đang lưu..." : "Lưu Bài Học"}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default LessonModal;
  