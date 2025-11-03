import { StyleSheet } from 'react-native';
import { theme as tokens, type Palette } from '@styles/theme';

export const makeBlogStyles = (palette: Palette, theme = tokens) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: palette.background,
      paddingTop: 8,
    },
    header: {
      paddingHorizontal: 16,
      paddingBottom: 4,
    },
    card: {
      backgroundColor: palette.card,
      borderColor: palette.border,
      borderWidth: 1,
      borderRadius: theme.radius.lg,
      padding: 12,
      height: 420,
      overflow: 'hidden',
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    title: {
      flex: 1,
      fontSize: 16,
      fontWeight: '700',
      color: palette.text,
      paddingRight: 12,
    },
    avatarBox: {
      width: 36,
      height: 36,
      borderRadius: 18,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: palette.border,
      backgroundColor: palette.card,
    },
    avatar: {
      width: '100%',
      height: '100%',
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    media: {
      borderRadius: theme.radius.md,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: palette.border,
    },
    mediaImage: {
      width: '100%',
      height: 260,
      backgroundColor: `${palette.border}33`,
    },
    actionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      marginTop: 10,
    },
    actionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 6,
      paddingHorizontal: 8,
      borderRadius: theme.radius.sm,
    },
    actionText: {
      fontSize: 14,
      fontWeight: '600',
      color: palette.text,
    },
    commentsBox: {
      marginTop: 10,
      borderTopWidth: 1,
      borderTopColor: palette.border,
      paddingTop: 8,
    },
    commentRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 6,
    },
    commentAuthor: {
      fontWeight: '700',
      color: palette.text,
    },
    commentText: {
      color: palette.text,
      flexShrink: 1,
    },
    commentEmpty: {
      color: palette.subText,
      fontStyle: 'italic',
    },
  });

