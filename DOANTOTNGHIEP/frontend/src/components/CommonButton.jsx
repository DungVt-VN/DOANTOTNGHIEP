import React from "react";
import { Tooltip } from "antd";
import { Loader2 } from "lucide-react"; // Dùng icon này làm spinner mặc định

const CommonButton = ({
  text, // Nội dung chữ
  icon, // Icon component (VD: <Plus />)
  iconPosition = "left", // Vị trí icon: 'left' | 'right'
  variant = "default", // Kiểu style: 'primary' | 'default' | 'ghost' | 'danger'
  loading = false, // Trạng thái loading
  disabled = false, // Trạng thái disabled
  tooltip = "", // Nội dung tooltip (nếu có)
  onClick, // Hàm xử lý click
  className = "", // Class tùy chỉnh thêm (nếu cần đè style)
  type = "button", // Type của button html
  ...props
}) => {
  const variants = {
    primary:
      "bg-blue-600 text-white border-transparent hover:bg-blue-700 shadow-md shadow-blue-100",
    default:
      "bg-white text-slate-600 border-gray-200 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 shadow-sm",
    ghost:
      "bg-transparent text-slate-600 border-transparent hover:bg-slate-100 shadow-none",
    danger:
      "bg-white text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 shadow-sm",
    dangerPrimary:
      "bg-red-600 text-white border-transparent hover:bg-red-700 shadow-md shadow-red-100",
  };

  const baseStyles = `
    flex items-center justify-center gap-2 
    px-4 py-2 h-[40px]
    rounded-lg border 
    text-sm font-bold 
    transition-all duration-200 
    active:scale-95 
    disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100 disabled:shadow-none
  `;

  const renderIcon = () => {
    if (loading) {
      return <Loader2 size={16} className="animate-spin" />;
    }
    return icon ? icon : null;
  };

  const ButtonContent = (
    <>
      {iconPosition === "left" && renderIcon()}

      <span>{text}</span>

      {iconPosition === "right" && renderIcon()}
    </>
  );

  const ButtonElement = (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${
        variants[variant] || variants.default
      } ${className}`}
      {...props}
    >
      {ButtonContent}
    </button>
  );

  if (tooltip) {
    return <Tooltip title={tooltip}>{ButtonElement}</Tooltip>;
  }

  return ButtonElement;
};

export default CommonButton;
