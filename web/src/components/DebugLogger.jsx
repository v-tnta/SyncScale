import React, { useEffect } from 'react';
export const DebugLogger = ({ tasks, taskToEstimate }) => {
  useEffect(() => {
    console.log("=== DebugLogger ===");
    console.log("All tasks:", tasks);
    console.log("taskToEstimate:", taskToEstimate);
    console.log("Tasks with isNew===true:", tasks.filter(t => t.isNew === true));
  }, [tasks, taskToEstimate]);
  return null;
};
