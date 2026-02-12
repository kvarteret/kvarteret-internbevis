export const colors = {
  background: "#F3E2CC",
  primaryText: "#000000",
  secondary: "#1B3A0A",
  tertiary: "#3A4AB5",
  white: "#FFFFFF",
  danger: "#AA0000",
  gray100: "#F3F4F6",
  gray200: "#E5E7EB",
  gray300: "#D1D5DB",
  gray600: "#4B5563",
  gray700: "#374151",
};

export function getTierBackgroundColor(tier: number, isValid: boolean): string {
  if (!isValid) {
    return colors.danger;
  }

  switch (tier) {
    case 1:
      return "#16A34A";
    case 2:
      return "#C2410C";
    case 3:
      return colors.secondary;
    case 4:
      return "#1D4ED8";
    default:
      return colors.secondary;
  }
}
