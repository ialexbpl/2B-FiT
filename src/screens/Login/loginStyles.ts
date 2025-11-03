import { StyleSheet } from 'react-native';
import { theme, type Palette } from '@styles/theme';

export const makeloginStyles = (palette: Palette) =>
    StyleSheet.create({
        screen: {
            flex: 1,
            backgroundColor: palette.background,
        },
        container: {
            flex: 1,
            paddingHorizontal: 16,
            paddingTop: 32,
        },
        title: {
            fontSize: 28,
            fontWeight: '700',
            color: palette.text,
        },
        subtitle: {
            fontSize: 14,
            color: palette.subText,
        },
        spacer: { height: 16 },
        inputWrapper: {
            borderWidth: 1,
            borderColor: palette.border,
            backgroundColor: palette.card,
            borderRadius: theme.radius.md,
            paddingHorizontal: 12,
            paddingVertical: 4,
            marginTop: 12,
            flexDirection: 'row',
            alignItems: 'center',
        },
        input: {
            flex: 1,
            paddingVertical: 10,
            fontSize: 16,
            color: palette.text,
        },
        inputIconBtn: {
            padding: 8,
            marginLeft: 4,
        },
        rowBetween: {
            marginTop: 10,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
        },
        checkRow: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        checkbox: {
            width: 18,
            height: 18,
            borderRadius: 4,
            borderWidth: 1,
            borderColor: palette.border,
            marginRight: 8,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: palette.card,
        },
        checkMark: {
            width: 10,
            height: 10,
            borderRadius: 2,
            backgroundColor: theme.colors.primary,
        },
        linkText: {
            color: theme.colors.primary,
            fontWeight: '600',
        },
        primaryBtn: {
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 14,
            borderRadius: theme.radius.md,
            marginTop: 16,
            backgroundColor: theme.colors.primary,
        },
        primaryBtnText: {
            color: palette.onPrimary,
            fontSize: 16,
            fontWeight: '600',
        },
        dividerRow: {
            marginTop: 18,
            marginBottom: 8,
            flexDirection: 'row',
            alignItems: 'center',
        },
        divider: {
            flex: 1,
            height: 1,
            backgroundColor: palette.border,
        },
        dividerText: {
            color: palette.subText,
            marginHorizontal: 8,
            fontSize: 12,
        },

        googleBtn: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: palette.border,
            backgroundColor: palette.card,
            borderRadius: theme.radius.md,
            paddingVertical: 12,
            paddingHorizontal: 16,
            marginTop: 8,
        },
        googleIconWrap: {
            width: 22,
            height: 22,
            borderRadius: 11,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
        },
        googleBtnText: {
            color: palette.text,
            fontSize: 16,
            fontWeight: '600',
        },

        socialRow: {
            flexDirection: 'row',
            marginTop: 8,
        },
        socialBtn: {
            flex: 1,
            borderWidth: 1,
            borderColor: palette.border,
            backgroundColor: palette.card,
            borderRadius: theme.radius.md,
            paddingVertical: 12,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
        },
        socialBtnLeft: { marginRight: 8 },
        socialBtnRight: { marginLeft: 8 },
        socialIconWrap: {
            width: 22,
            height: 22,
            borderRadius: 11,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 8,
        },
        footerRow: {
            marginTop: 14,
            flexDirection: 'row',
            justifyContent: 'center',
        },
        footerLink: {
            color: theme.colors.primary,
            fontWeight: '700',
            marginLeft: 6,
        },
    });

export default makeloginStyles;