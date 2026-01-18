import React from "react";
import { Video, FileText, HelpCircle, BookOpen } from "lucide-react";

export const getContentTypeInfo = (type) => {
  switch (type) {
    case "video":
      return {
        icon: <Video size={16} />,
        bg: "bg-purple-100",
        text: "text-purple-600",
        label: "VIDEO",
      };
    case "document":
      return {
        icon: <FileText size={16} />,
        bg: "bg-blue-100",
        text: "text-blue-600",
        label: "DOCS",
      };
    case "quiz":
      return {
        icon: <HelpCircle size={16} />,
        bg: "bg-orange-100",
        text: "text-orange-600",
        label: "QUIZ",
      };
    default:
      return {
        icon: <BookOpen size={16} />,
        bg: "bg-slate-100",
        text: "text-slate-600",
        label: "OTHER",
      };
  }
};
