import React from 'react';
import { Label } from './label';

interface TimePickerProps {
  value: string;
  onChange: (time: string) => void;
  label?: string;
  required?: boolean;
  className?: string;
}

export const TimePicker: React.FC<TimePickerProps> = ({
  value,
  onChange,
  label,
  required = false,
  className = '',
}) => {
  // Parse the time value (HH:MM format)
  const [hours, minutes] = value ? value.split(':') : ['', ''];

  const handleHourChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newHours = e.target.value;
    const newMinutes = minutes || '00';
    onChange(`${newHours}:${newMinutes}`);
  };

  const handleMinuteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMinutes = e.target.value;
    const newHours = hours || '00';
    onChange(`${newHours}:${newMinutes}`);
  };

  // Generate hours (00-23)
  const hourOptions = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0');
    return (
      <option key={hour} value={hour}>
        {hour}
      </option>
    );
  });

  // Generate minutes (00, 15, 30, 45)
  const minuteOptions = ['00', '15', '30', '45'].map((minute) => (
    <option key={minute} value={minute}>
      {minute}
    </option>
  ));

  return (
    <div className={className}>
      {label && (
        <Label className="mb-2 block">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <select
            value={hours}
            onChange={handleHourChange}
            required={required}
            className="w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">HH</option>
            {hourOptions}
          </select>
        </div>
        <span className="text-2xl font-bold text-gray-400">:</span>
        <div className="flex-1">
          <select
            value={minutes}
            onChange={handleMinuteChange}
            required={required}
            className="w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">MM</option>
            {minuteOptions}
          </select>
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-1">Select hour and minute</p>
    </div>
  );
};
