import React, { useState } from "react";
import { Tooltip } from "antd";
import { RefreshCw } from "lucide-react";

const RefreshButton = ({
  onClick,
  loading = false,
  text = "Tải lại",
  tooltip = "Cập nhật danh sách",
  className = "",
  minSpinTime = 500,
}) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const handleClick = (e) => {
    if (isSpinning || loading) return;
    setIsSpinning(true);
    if (onClick) {
      onClick(e);
    }
    setTimeout(() => {
      setIsSpinning(false);
    }, minSpinTime);
  };
  const effectiveLoading = loading || isSpinning;

  return (
    <Tooltip title={tooltip}>
      <button
        type="button"
        onClick={handleClick}
        disabled={effectiveLoading}
        className={`flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 shadow-sm transition-all duration-200 text-sm font-medium active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100 h-[40px] whitespace-nowrap ${className}`}
      >
        <RefreshCw
          size={16}
          className={effectiveLoading ? "animate-spin text-blue-600" : ""}
        />
        <span className="hidden sm:inline">{text}</span>
      </button>
    </Tooltip>
  );
};

export default RefreshButton;
