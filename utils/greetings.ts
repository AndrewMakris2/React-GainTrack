export function getGreeting(name: string): string {
  const hour = new Date().getHours();
  if (hour < 5) return `Up late, ${name}`;
  if (hour < 12) return `Good morning, ${name}`;
  if (hour < 17) return `Good afternoon, ${name}`;
  return `Good evening, ${name}`;
}

export function getMotivationalText(
  totals: { protein: number; calories: number },
  targets: { protein: number; calories: number }
): string {
  if (totals.calories === 0) {
    return "Let's get that first meal in. Start strong!";
  }
  const proteinRemaining = targets.protein - totals.protein;
  const calRemaining = targets.calories - totals.calories;

  if (proteinRemaining > 5) {
    return `You're ${Math.round(proteinRemaining)}g of protein away from your goal. Push it!`;
  }
  if (calRemaining > 100) {
    return `${Math.round(calRemaining)} calories remaining. Keep fueling!`;
  }
  if (calRemaining < -150) {
    return "Over your calorie target today. Adjust tomorrow and keep grinding!";
  }
  return "You've crushed your targets today. Phenomenal work!";
}
