
export const format12h = (time24: string): string => {
  if (!time24) return '--:--';
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'pm' : 'am';
  let h12 = hours % 12;
  if (h12 === 0) h12 = 12;
  return `${h12}:${minutes.toString().padStart(2, '0')} ${period}`;
};
