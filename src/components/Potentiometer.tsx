import React from 'react';
import { Donut } from 'react-dial-knob';

interface PotentiometerProps {
  /** 0,1,2 preset positions */
  value: 0 | 1 | 2;
  onChange: (v: 0 | 1 | 2) => void;
  labels: [string, string, string];
}

/**
 * Simple animated potentiometer (rotary knob) with three detents.
 * Uses an underlying range input (0-2). Rotation -135deg .. 135deg.
 */
const Potentiometer: React.FC<PotentiometerProps> = ({ value, onChange, labels }) => {
  return (
    <div className="potentiometer-wrapper">
      <Donut
        diameter={90}
        min={0}
        step={1}
        max={2}
        value={value}
        onValueChange={(v: number) => onChange(v as 0 | 1 | 2)}
        theme={{ donutColor: '#1e90ff', bgrColor: '#444', centerColor: '#222', maxedBgrColor: '#666' }}
        
      />
      <div className="pot-labels">
        {labels.map((l, i) => (
          <span key={i} className={`pot-label ${i === value ? 'active' : ''}`}>{l}</span>
        ))}
      </div>
    </div>
  );
};

export default Potentiometer;
