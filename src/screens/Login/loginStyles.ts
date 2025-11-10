import { StyleSheet } from 'react-native';
import { theme, type Palette } from '@styles/theme';

export const makeloginStyles = (palette: Palette) =>
    StyleSheet.create({
        screen: {
            flex: 1,
        },
        backgroundImage: {
            flex: 1,
            width: '100%',
            height: '100%',
        },
        overlay: {
            flex: 1,
            backgroundColor: palette.overlay,
            justifyContent: 'center',
        },
        container: {
            flex: 1,
            justifyContent: 'center',
            paddingHorizontal: theme.spacing(2.5), // 20px
        },
        loginCard: {
            backgroundColor: palette.card100,
            borderRadius: theme.radius.xl,
            paddingVertical: theme.spacing(3),
            paddingHorizontal: theme.spacing(3),
            borderWidth: 1,
            borderColor: palette.border,
            ...theme.shadow.lg,
        },
        title: {
            fontSize: 28,
            fontWeight: 'bold',
            color: palette.text,
            textAlign: 'center',
            marginBottom: theme.spacing(1),
        },
        subtitle: {
            fontSize: 16,
            color: palette.subText,
            textAlign: 'center',
            marginBottom: theme.spacing(3),
        },
        inputWrapper: {
            marginBottom: theme.spacing(2),
            position: 'relative',
        },
        input: {
            backgroundColor: palette.card,
            borderWidth: 1,
            borderColor: palette.border,
            borderRadius: theme.radius.md,
            paddingHorizontal: theme.spacing(2),
            paddingVertical: theme.spacing(1.5),
            color: palette.text,
            fontSize: 16,
        },
        inputIconBtn: {
            position: 'absolute',
            right: theme.spacing(1.5),
            top: theme.spacing(1.5),
            padding: theme.spacing(0.5),
        },
        rowBetween: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: theme.spacing(2.5),
        },
        checkRow: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        checkbox: {
            width: 20,
            height: 20,
            borderWidth: 2,
            borderColor: palette.primary,
            borderRadius: theme.radius.sm,
            marginRight: theme.spacing(1),
            justifyContent: 'center',
            alignItems: 'center',
        },
        checkMark: {
            width: 10,
            height: 10,
            backgroundColor: palette.primary,
            borderRadius: 2,
        },
        linkText: {
            color: palette.primary,
            fontSize: 14,
            fontWeight: '500',
        },
        primaryBtn: {
            backgroundColor: palette.primary,
            borderRadius: theme.radius.md,
            paddingVertical: theme.spacing(1.75),
            alignItems: 'center',
            marginBottom: theme.spacing(2.5),
        },
        primaryBtnText: {
            color: palette.onPrimary,
            fontSize: 16,
            fontWeight: '600',
        },
        dividerRow: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: theme.spacing(2.5),
        },
        divider: {
            flex: 1,
            height: 1,
            backgroundColor: palette.border,
        },
        dividerText: {
            color: palette.subText,
            paddingHorizontal: theme.spacing(1.25),
            fontSize: 14,
        },
        googleBtn: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: palette.border,
            backgroundColor: palette.card,
            borderRadius: theme.radius.md,
            paddingVertical: theme.spacing(1.5),
            paddingHorizontal: theme.spacing(2),
        },
        googleIconWrap: {
            width: 22,
            height: 22,
            borderRadius: 11,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: theme.spacing(1.5),
        },
        googleBtnText: {
            color: palette.text,
            fontSize: 16,
            fontWeight: '600',
        },
        footerRow: {
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: theme.spacing(2.5),
        },
        footerLink: {
            color: palette.primary,
            fontWeight: '600',
            marginLeft: theme.spacing(0.75),
        },
    });
export default makeloginStyles;