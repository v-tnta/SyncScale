import React from 'react';
import { getSizeSelectorClass } from '../domain/taskSize';
import { SIZE_LABEL_SELECTOR } from '../content';

const SizeLabelSelector = ({ selectedLabel, onSelect }) => {
  const options = SIZE_LABEL_SELECTOR.options;

  const getColors = getSizeSelectorClass;

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
