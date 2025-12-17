
import { useState, useEffect } from 'react';
import { Goal } from '../types';

interface GoalStatus {
  weeklyContributionNeeded: number;
  daysRemaining: number;
  percentageComplete: number;
  isOnTrack: boolean;
  statusColor: 'green' | 'amber' | 'red';
}

export const useGoalCalculator = (goal: Goal) => {
  const [status, setStatus] = useState<GoalStatus | null>(null);

  useEffect(() => {
    const calculateMetrics = () => {
      const today = new Date();
      const deadlineDate = new Date(goal.deadline);
      
      // Safety check for invalid dates
      if (isNaN(deadlineDate.getTime())) {
          setStatus({
              weeklyContributionNeeded: 0,
              daysRemaining: 0,
              percentageComplete: 0,
              isOnTrack: false,
              statusColor: 'amber'
          });
          return;
      }

      const timeDiff = deadlineDate.getTime() - today.getTime();
      const daysRemaining = Math.max(0, Math.ceil(timeDiff / (1000 * 3600 * 24)));
      const weeksRemaining = daysRemaining / 7;

      const remainingAmount = goal.targetAmount - goal.currentAmount;
      
      // Prevent division by zero or negative time
      const safeWeeks = weeksRemaining <= 0 ? 1 : weeksRemaining;
      
      const weeklyContributionNeeded = remainingAmount > 0 
        ? remainingAmount / safeWeeks 
        : 0;

      const percentageComplete = goal.targetAmount > 0 
        ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100) 
        : 0;

      // Status Logic
      let statusColor: 'green' | 'amber' | 'red' = 'green';
      
      // If we are close to deadline but not close to target
      if (daysRemaining < 30 && percentageComplete < 80) statusColor = 'red';
      else if (daysRemaining < 90 && percentageComplete < 50) statusColor = 'amber';
      
      // If deadline passed and not complete
      if (daysRemaining === 0 && percentageComplete < 100) statusColor = 'red';

      setStatus({
        weeklyContributionNeeded: Number(weeklyContributionNeeded.toFixed(2)),
        daysRemaining,
        percentageComplete: Math.round(percentageComplete),
        isOnTrack: true, // Placeholder for historical velocity check
        statusColor
      });
    };

    calculateMetrics();
  }, [goal]);

  return status;
};
