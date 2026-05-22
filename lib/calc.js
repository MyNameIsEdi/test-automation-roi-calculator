export const calcManualHoursPerMonth = (s) =>
  (s.manual_mins * s.frequency) / 60;

export const calcNetSavings = (s) => {
  const monthlyManual = calcManualHoursPerMonth(s);
  return parseFloat((monthlyManual - (s.maint_hours || 0)).toFixed(2));
};

export const calcBreakEven = (s) => {
  const savings = calcNetSavings(s);
  if (savings <= 0) return Infinity;
  return parseFloat((s.dev_hours / savings).toFixed(1));
};

export const getRecommendation = (s) => {
  if (s.is_flaky || s.is_visual)
    return { text: 'High Risk', class: 'bg-rose-50 text-rose-700 border-rose-200' };
  const savings = calcNetSavings(s);
  if (savings <= 0)
    return { text: 'Keep Manual', class: 'bg-slate-50 text-slate-600 border-slate-200' };
  const roi = s.dev_hours / savings;
  if (roi <= 3) return { text: 'Automate', class: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  if (roi <= 6) return { text: 'Viable', class: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
  return { text: 'Low Priority', class: 'bg-amber-50 text-amber-700 border-amber-200' };
};

export const calcStats = (scenarios) => {
  const valid = scenarios.filter((s) => calcBreakEven(s) !== Infinity);
  return {
    netSavings: scenarios
      .reduce((acc, s) => acc + Math.max(0, calcNetSavings(s)), 0)
      .toFixed(1),
    totalInvestment: scenarios
      .reduce((acc, s) => acc + (parseFloat(s.dev_hours) || 0), 0)
      .toFixed(1),
    viableCount: scenarios.filter((s) =>
      ['Automate', 'Viable'].includes(getRecommendation(s).text)
    ).length,
    avgBreakEven: valid.length
      ? (valid.reduce((acc, s) => acc + calcBreakEven(s), 0) / valid.length).toFixed(1)
      : '0',
    highRiskCount: scenarios.filter(
      (s) => getRecommendation(s).text === 'High Risk'
    ).length,
    automateCount: scenarios.filter(
      (s) => getRecommendation(s).text === 'Automate'
    ).length,
    totalManualHours: scenarios
      .reduce((acc, s) => acc + calcManualHoursPerMonth(s), 0)
      .toFixed(1),
  };
};
