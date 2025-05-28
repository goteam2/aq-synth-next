import React from "react";
import { KnobHeadless } from "react-knob-headless";

interface KnobControlProps {
  label: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  dragSensitivity?: number;
}

const KnobControl: React.FC<KnobControlProps> = ({
  label,
  min,
  max,
  step = 1,
  value,
  onChange,
  dragSensitivity = 0.006,
}) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        margin: 16,
      }}
    >
      <KnobHeadless
        aria-label={label}
        valueRaw={value}
        valueMin={min}
        valueMax={max}
        dragSensitivity={dragSensitivity}
        valueRawRoundFn={(v) => Math.round(v / step) * step}
        valueRawDisplayFn={(v) => v.toFixed(2)}
        onValueRawChange={onChange}
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: "#eee",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      />
      <span style={{ marginTop: 8 }}>
        {label}: {value}
      </span>
    </div>
  );
};

export default KnobControl;
