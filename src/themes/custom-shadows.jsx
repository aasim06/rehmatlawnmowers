// project imports
import { withAlpha } from 'utils/colorUtils';

// ==============================|| DEFAULT THEME - CUSTOM SHADOWS ||============================== //

export default function CustomShadows(palette) {
  // palette values may be CSS vars strings like "var(--palette-grey-900)"
  // withAlpha handles both hex and var() formats safely
  const safeWithAlpha = (color, opacity) => {
    try {
      return withAlpha(color, opacity);
    } catch {
      return `rgba(0,0,0,${opacity})`;
    }
  };

  const grey900 = palette?.grey?.[900] ?? '#101828';
  const primaryMain = palette?.primary?.main ?? '#465fff';
  const secondaryMain = palette?.secondary?.main ?? '#667085';
  const errorMain = palette?.error?.main ?? '#f04438';
  const warningMain = palette?.warning?.main ?? '#f79009';
  const infoMain = palette?.info?.main ?? '#0ba5ec';
  const successMain = palette?.success?.main ?? '#12b76a';
  const grey500 = palette?.grey?.[500] ?? '#667085';

  return {
    button: `0 1px 2px rgba(16, 24, 40, 0.05)`,
    text: `0 -1px 0 rgb(0 0 0 / 12%)`,
    z1: `0 1px 3px ${safeWithAlpha(grey900, 0.08)}, 0 1px 2px ${safeWithAlpha(grey900, 0.04)}`,
    primary: `0 0 0 3px ${safeWithAlpha(primaryMain, 0.14)}`,
    secondary: `0 0 0 3px ${safeWithAlpha(secondaryMain, 0.14)}`,
    error: `0 0 0 3px ${safeWithAlpha(errorMain, 0.14)}`,
    warning: `0 0 0 3px ${safeWithAlpha(warningMain, 0.14)}`,
    info: `0 0 0 3px ${safeWithAlpha(infoMain, 0.14)}`,
    success: `0 0 0 3px ${safeWithAlpha(successMain, 0.14)}`,
    grey: `0 0 0 3px ${safeWithAlpha(grey500, 0.14)}`,
    primaryButton: `0 1px 2px ${safeWithAlpha(primaryMain, 0.18)}`,
    secondaryButton: `0 1px 2px ${safeWithAlpha(secondaryMain, 0.14)}`,
    errorButton: `0 1px 2px ${safeWithAlpha(errorMain, 0.18)}`,
    warningButton: `0 1px 2px ${safeWithAlpha(warningMain, 0.18)}`,
    infoButton: `0 1px 2px ${safeWithAlpha(infoMain, 0.18)}`,
    successButton: `0 1px 2px ${safeWithAlpha(successMain, 0.18)}`,
    greyButton: `0 1px 2px ${safeWithAlpha(grey500, 0.14)}`
  };
}
