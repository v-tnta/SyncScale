import React from 'react';
import { getSizeSelectorClass } from '../domain/taskSize';
import { SIZE_LABEL_SELECTOR } from '../content';

const SizeLabelSelector = ({ selectedLabel, onSelect }) => {
  const options = SIZE_LABEL_SELECTOR.options;
  const getColors = getSizeSelectorClass;

  return (
    <div className="flex gap-2.5 justify-center w-full">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onSelect(option.value)}
          aria-pressed={selectedLabel === option.value}
          className={`flex-1 py-2 px-1 text-xs sm:text-sm font-bold rounded-xl transition-all border-2 ${selectedLabel === option.value
            ? `${getColors(option.value)} transform scale-105 shadow-md ring-2 ring-offset-1 dark:ring-offset-slate-900`
            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-750 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

export default SizeLabelSelector;
