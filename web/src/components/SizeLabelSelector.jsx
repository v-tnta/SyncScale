import React from 'react';

const SizeLabelSelector = ({ selectedLabel, onSelect }) => {
  const options = [
    { value: 'S', label: 'S (すぐ)' },
    { value: 'M', label: 'M (半日〜1日)' },
    { value: 'L', label: 'L (数日)' },
  ];

  const getColors = (val) => {
    switch (val) {
      case 'S': return 'bg-cyan-100 text-cyan-700 hover:bg-cyan-200 border-cyan-300 ring-cyan-400';
      case 'M': return 'bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-300 ring-orange-400';
      case 'L': return 'bg-red-100 text-red-700 hover:bg-red-200 border-red-300 ring-red-400';
      default: return 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300';
    }
  };

  return (
    <div className="flex gap-3 justify-center w-full">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onSelect(option.value)}
          className={`flex-1 py-2 px-1 text-sm font-bold rounded-lg transition-all border-2 ${selectedLabel === option.value
            ? `${getColors(option.value)} transform scale-105 shadow-md ring-2 ring-offset-1`
            : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-600'
            }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

export default SizeLabelSelector;
