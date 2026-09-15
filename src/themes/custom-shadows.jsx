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

  const grey900 = palette?.grey?.[900] ?? '#000000';
  const primaryMain = palette?.primary?.main ?? '#52c41a';
  const secondaryMain = palette?.secondary?.main ?? '#8c8c8c';
  const errorMain = palette?.error?.main ?? '#ff4d4f';
  const warningMain = palette?.warning?.main ?? '#faad14';
  const infoMain = palette?.info?.main ?? '#13c2c2';
  const successMain = palette?.success?.main ?? '#52c41a';
  const grey500 = palette?.grey?.[500] ?? '#8c8c8c';

  return {
    button: `0 2px #0000000b`,
    text: `0 -1px 0 rgb(0 0 0 / 12%)`,
    z1: `0px 1px 4px ${safeWithAlpha(grey900, 0.08)}`,
    primary: `0 0 0 2px ${safeWithAlpha(primaryMain, 0.2)}`,
    secondary: `0 0 0 2px ${safeWithAlpha(secondaryMain, 0.2)}`,
    error: `0 0 0 2px ${safeWithAlpha(errorMain, 0.2)}`,
    warning: `0 0 0 2px ${safeWithAlpha(warningMain, 0.2)}`,
    info: `0 0 0 2px ${safeWithAlpha(infoMain, 0.2)}`,
    success: `0 0 0 2px ${safeWithAlpha(successMain, 0.2)}`,
    grey: `0 0 0 2px ${safeWithAlpha(grey500, 0.2)}`,
    primaryButton: `0 14px 12px ${safeWithAlpha(primaryMain, 0.2)}`,
    secondaryButton: `0 14px 12px ${safeWithAlpha(secondaryMain, 0.2)}`,
    errorButton: `0 14px 12px ${safeWithAlpha(errorMain, 0.2)}`,
    warningButton: `0 14px 12px ${safeWithAlpha(warningMain, 0.2)}`,
    infoButton: `0 14px 12px ${safeWithAlpha(infoMain, 0.2)}`,
    successButton: `0 14px 12px ${safeWithAlpha(successMain, 0.2)}`,
    greyButton: `0 14px 12px ${safeWithAlpha(grey500, 0.2)}`
  };
}
