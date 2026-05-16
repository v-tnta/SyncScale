import React from 'react';

const SizeLabelSelector = ({ selectedLabel, onSelect }) => {
  const options = [
    { value: 'S', label: 'S (すぐ)' },
    { value: 'M', label: 'M (半日〜1日)' },
    { value: 'L', label: 'L (数日)' },
  ];

  return (
    <div className="flex gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onSelect(option.value)}
          className={`px-3 py-1 text-sm font-medium rounded-full transition-colors border ${
            selectedLabel === option.value
              ? 'bg-blue-500 text-white border-blue-500'
              : 'bg-gray-100 text-gray-600 border-transparent hover:bg-gray-200'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

export default SizeLabelSelector;
