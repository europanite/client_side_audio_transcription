import React from "react";

const SettingsBar: React.FC = () => {
  return (
    <div className="settings-bar">
      <div className="settings-main">
        <div className="settings-label">Model</div>
        <div className="settings-value">Xenova/whisper-tiny.en</div>
      </div>
    </div>
  );
};

export default SettingsBar;
