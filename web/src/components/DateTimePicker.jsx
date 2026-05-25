import React, { useState, useEffect } from 'react';
import Picker from 'react-mobile-picker';

const DateTimePicker = ({ id, value, onChange, disabled, isTutorialActive }) => {
    // 選択可能な値の生成
    const generateOptions = () => {
        const now = new Date();
        const currentYear = now.getFullYear();

        if (isTutorialActive) {
            // チュートリアル中は当日（今日の23:59）付近のみに制限する
            const yearStr = `${currentYear}年`;
            const monthStr = `${now.getMonth() + 1}月`;
            const dayStr = `${now.getDate()}日`;
            return { 
                year: [yearStr], 
                month: [monthStr], 
                day: [dayStr], 
                hour: ["23時"], 
                minute: ["59分"] 
            };
        }

        const years = Array.from({ length: 11 }, (_, i) => `${currentYear + i}年`);
        const months = Array.from({ length: 12 }, (_, i) => `${i + 1}月`);
        const days = Array.from({ length: 31 }, (_, i) => `${i + 1}日`);
        const hours = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}時`);
        const minutes = Array.from({ length: 60 }, (_, i) => `${i.toString().padStart(2, '0')}分`);
        return { year: years, month: months, day: days, hour: hours, minute: minutes };
    };

    const options = generateOptions();

    // 初期化と状態の同期
    const parseDateToPickerValue = (date) => {
        if (!date) {
            const now = new Date();
            return { year: `${now.getFullYear()}年`, month: '1月', day: '1日', hour: '23時', minute: '59分' };
        }
        return {
            year: `${date.getFullYear()}年`,
            month: `${date.getMonth() + 1}月`,
            day: `${date.getDate()}日`,
            hour: `${date.getHours().toString().padStart(2, '0')}時`,
            minute: `${date.getMinutes().toString().padStart(2, '0')}分`,
        };
    };

    const [pickerValue, setPickerValue] = useState(parseDateToPickerValue(value));
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (value) {
            setPickerValue(parseDateToPickerValue(value));
        }
    }, [value]);

    const handlePickerChange = (newValue) => {
        setPickerValue(newValue);
        
        // Pickerの値からDateオブジェクトを生成
        const newYear = parseInt(newValue.year.replace('年', ''), 10);
        const newMonth = parseInt(newValue.month.replace('月', ''), 10) - 1;
        const newDay = parseInt(newValue.day.replace('日', ''), 10);
        const newHour = parseInt(newValue.hour.replace('時', ''), 10);
        const newMinute = parseInt(newValue.minute.replace('分', ''), 10);
        
        const newDate = new Date(newYear, newMonth, newDay, newHour, newMinute);
        if (onChange) {
            onChange(newDate);
        }
    };

    const formatDisplay = () => {
        if (!value) return "日時を選択";
        const y = value.getFullYear();
        const m = value.getMonth() + 1;
        const d = value.getDate();
        const h = value.getHours().toString().padStart(2, '0');
        const min = value.getMinutes().toString().padStart(2, '0');
        return `${y}年${m}月${d}日 ${h}:${min}`;
    };

    return (
        <div className="relative">
            {/* 表示用のボタン */}
            <button
                id={id}
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`w-full text-left p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white flex justify-between items-center ${
                    disabled ? "cursor-default" : ""
                }`}
            >
                <span>{formatDisplay()}</span>
                <span className="text-gray-400">▼</span>
            </button>

            {/* ピッカーモーダル/ドロップダウン */}
            {isOpen && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-xl p-2">
                    <div className="flex justify-end mb-2 border-b pb-2">
                        <button 
                            type="button" 
                            onClick={() => setIsOpen(false)}
                            className="text-blue-600 font-bold text-sm px-2"
                        >
                            完了
                        </button>
                    </div>
                    <div className="h-48">
                        <Picker
                            value={pickerValue}
                            onChange={handlePickerChange}
                            wheelMode="normal"
                        >
                            {Object.keys(options).map(name => (
                                <Picker.Column key={name} name={name}>
                                    {options[name].map(option => (
                                        <Picker.Item key={option} value={option}>
                                            {option}
                                        </Picker.Item>
                                    ))}
                                </Picker.Column>
                            ))}
                        </Picker>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DateTimePicker;
