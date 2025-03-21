let light = {
  "colors": {
    "primary": "rgb(154, 69, 37)",
    "onPrimary": "rgb(255, 255, 255)",
    "primaryContainer": "rgb(255, 219, 207)",
    "onPrimaryContainer": "rgb(57, 12, 0)",
    "secondary": "rgb(155, 68, 38)",
    "onSecondary": "rgb(255, 255, 255)",
    "secondaryContainer": "rgb(255, 219, 208)",
    "onSecondaryContainer": "rgb(57, 12, 0)",
    "tertiary": "rgb(111, 93, 0)",
    "onTertiary": "rgb(255, 255, 255)",
    "tertiaryContainer": "rgb(255, 225, 104)",
    "onTertiaryContainer": "rgb(34, 27, 0)",
    "error": "rgb(186, 26, 26)",
    "onError": "rgb(255, 255, 255)",
    "errorContainer": "rgb(255, 218, 214)",
    "onErrorContainer": "rgb(65, 0, 2)",
    "background": "rgb(255, 251, 255)",
    "onBackground": "rgb(32, 26, 24)",
    "surface": "rgb(255, 251, 255)",
    "onSurface": "rgb(32, 26, 24)",
    "surfaceVariant": "rgb(245, 222, 215)",
    "onSurfaceVariant": "rgb(83, 67, 62)",
    "outline": "rgb(133, 115, 109)",
    "outlineVariant": "rgb(216, 194, 187)",
    "shadow": "rgb(0, 0, 0)",
    "scrim": "rgb(0, 0, 0)",
    "inverseSurface": "rgb(54, 47, 45)",
    "inverseOnSurface": "rgb(251, 238, 234)",
    "inversePrimary": "rgb(255, 181, 156)",
    "elevation": {
      "level0": "transparent",
      "level1": "rgb(250, 242, 244)",
      "level2": "rgb(247, 236, 238)",
      "level3": "rgb(244, 231, 231)",
      "level4": "rgb(243, 229, 229)",
      "level5": "rgb(241, 226, 225)"
    },
    "surfaceDisabled": "rgba(32, 26, 24, 0.12)",
    "onSurfaceDisabled": "rgba(32, 26, 24, 0.38)",
    "backdrop": "rgba(59, 45, 41, 0.4)"
  }
}
let dark = {
  "colors": {
    "primary": "rgb(255, 181, 156)",
    "onPrimary": "rgb(92, 25, 0)",
    "primaryContainer": "rgb(124, 46, 15)",
    "onPrimaryContainer": "rgb(255, 219, 207)",
    "secondary": "rgb(255, 181, 157)",
    "onSecondary": "rgb(93, 24, 0)",
    "secondaryContainer": "rgb(124, 46, 17)",
    "onSecondaryContainer": "rgb(255, 219, 208)",
    "tertiary": "rgb(226, 197, 75)",
    "onTertiary": "rgb(58, 48, 0)",
    "tertiaryContainer": "rgb(84, 70, 0)",
    "onTertiaryContainer": "rgb(255, 225, 104)",
    "error": "rgb(255, 180, 171)",
    "onError": "rgb(105, 0, 5)",
    "errorContainer": "rgb(147, 0, 10)",
    "onErrorContainer": "rgb(255, 180, 171)",
    "background": "rgb(32, 26, 24)",
    "onBackground": "rgb(237, 224, 220)",
    "surface": "rgb(32, 26, 24)",
    "onSurface": "rgb(237, 224, 220)",
    "surfaceVariant": "rgb(83, 67, 62)",
    "onSurfaceVariant": "rgb(216, 194, 187)",
    "outline": "rgb(160, 141, 135)",
    "outlineVariant": "rgb(83, 67, 62)",
    "shadow": "rgb(0, 0, 0)",
    "scrim": "rgb(0, 0, 0)",
    "inverseSurface": "rgb(237, 224, 220)",
    "inverseOnSurface": "rgb(54, 47, 45)",
    "inversePrimary": "rgb(154, 69, 37)",
    "elevation": {
      "level0": "transparent",
      "level1": "rgb(43, 34, 31)",
      "level2": "rgb(50, 38, 35)",
      "level3": "rgb(57, 43, 39)",
      "level4": "rgb(59, 45, 40)",
      "level5": "rgb(63, 48, 43)"
    },
    "surfaceDisabled": "rgba(237, 224, 220, 0.12)",
    "onSurfaceDisabled": "rgba(237, 224, 220, 0.38)",
    "backdrop": "rgba(59, 45, 41, 0.4)"
  }
}

const createMarkedStyles = (theme) => {
  const { colors, spacing } = theme;

  return {
    em: {
      fontStyle: 'italic',
      color: colors.onSurface,
    },
    strong: {
      fontWeight: 'bold',
      color: colors.onSurface,
    },
    strikethrough: {
      textDecorationLine: 'line-through',
      color: colors.onSurfaceVariant,
    },
    text: {
      color: colors.onSurface,
    },
    paragraph: {
      marginBottom: spacing?.medium,
    },
    link: {
      color: colors.primary,
      textDecorationLine: 'underline',
    },
    blockquote: {
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
      paddingLeft: spacing?.medium,
      marginBottom: spacing?.medium,
      color: colors.onSurface,
      backgroundColor: colors.surfaceVariant,
    },
    h1: {
      fontSize: 32,
      fontWeight: 'bold',
      color: colors.onSurface,
      marginBottom: spacing?.large,
    },
    h2: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.onSurface,
      marginBottom: spacing?.medium,
    },
    h3: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.onSurface,
      marginBottom: spacing?.medium,
    },
    h4: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.onSurface,
      marginBottom: spacing?.medium,
    },
    h5: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.onSurface,
      marginBottom: spacing?.small,
    },
    h6: {
      fontSize: 14,
      fontWeight: 'bold',
      color: colors.onSurface,
      marginBottom: spacing?.small,
    },
    codespan: {
      backgroundColor: colors.surfaceVariant,
      paddingHorizontal: spacing?.small / 2,
      borderRadius: 4,
      color: colors.onSurface,
      fontFamily: 'monospace',
    },
    code: {
      backgroundColor: colors.surfaceVariant,
      padding: spacing?.medium,
      borderRadius: 4,
      marginBottom: spacing?.medium,
      fontFamily: 'monospace',
      color: colors.onSurface,
    },
    hr: {
      borderBottomWidth: 1,
      borderBottomColor: colors.outlineVariant,
      marginVertical: spacing?.large,
    },
    list: {
      marginBottom: spacing?.medium,
    },
    li: {
      color: colors.onSurface,
      marginBottom: spacing?.small / 2,
      
    },
    image: {
      width: '100%',
      height: 200,
      resizeMode: 'contain',
      marginBottom: spacing?.medium,
    },
    table: {
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      marginBottom: spacing?.medium,
    },
    tableRow: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderColor: colors.outlineVariant,
    },
    tableCell: {
      flex: 1,
      padding: spacing?.small,
      color: colors.onSurface,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
    },
    bullet_list_icon: {
      color: colors.onSurface,
      marginRight: spacing?.small,
    },
    ordered_list_icon: {
      color: colors.onSurface,
      marginRight: spacing?.small,
    },
    ordered_list_content: {
      color: colors.onSurface,
      marginLeft: spacing?.small,
    },
    bullet_list_content: {
      color: colors.onSurface,
      marginLeft: spacing?.small,
    },
  };
};

const lightMarkedStyles = createMarkedStyles({
  ...light,
  spacing: {
    small: 4,
    medium: 8,
    large: 16,
  }
});

const darkMarkedStyles = createMarkedStyles({
  ...dark,
  spacing: {
    small: 4,
    medium: 8,
    large: 16,
  }
});

export default {
  light,
  dark,
  lightMarkedStyles,
  darkMarkedStyles,
}