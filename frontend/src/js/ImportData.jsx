import React from "react";

function ImportData({ setFile }) {
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFile(file);
    }
    e.target.value = null;
  };

  return (
    <input
      type="file"
      accept=".xlsx, .xls"
      onChange={handleFileSelect}
      style={{ display: "none" }}
    />
  );
}

export default ImportData;
