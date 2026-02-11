import { Platform, TextStyle } from 'react-native';

export type FontWeightToken = 'regular' | 'medium' | 'semibold' | 'bold' | 'extrabold';

export type TextVariant = 'title' | 'subtitle' | 'body' | 'meta' | 'emphasis' | 'cta';

interface VariantConfig {
  fontSize: number;
  lineHeight: number;
  letterSpacing?: number;
  weight: FontWeightToken;
}

const WEB_FONT_FAMILY: Record<FontWeightToken, string> = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
};

const NATIVE_FONT_WEIGHT: Record<FontWeightToken, TextStyle['fontWeight']> = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
};

const VARIANT_CONFIG: Record<TextVariant, VariantConfig> = {
  title: {
    fontSize: 38,
    lineHeight: 42,
    letterSpacing: 0.3,
    weight: 'extrabold',
  },
  subtitle: {
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: 0.2,
    weight: 'extrabold',
  },
  body: {
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: 0.2,
    weight: 'medium',
  },
  meta: {
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: 0.2,
    weight: 'bold',
  },
  emphasis: {
    fontSize: 20,
    lineHeight: 27,
    letterSpacing: 0.1,
    weight: 'semibold',
  },
  cta: {
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: 0.2,
    weight: 'extrabold',
  },
};

export function getFontStyle(weight: FontWeightToken): Pick<TextStyle, 'fontFamily' | 'fontWeight'> {
  if (Platform.OS === 'web') {
    return {
      fontFamily: WEB_FONT_FAMILY[weight],
      fontWeight: undefined,
    };
  }

  return {
    fontFamily: undefined,
    fontWeight: NATIVE_FONT_WEIGHT[weight],
  };
}

export function getTypographyStyle(variant: TextVariant): TextStyle {
  const config = VARIANT_CONFIG[variant];

  return {
    ...getFontStyle(config.weight),
    fontSize: config.fontSize,
    lineHeight: config.lineHeight,
    letterSpacing: config.letterSpacing ?? 0,
  };
}
