import { StyleSheet, Dimensions } from 'react-native';
import { theme, type Palette } from '@styles/theme';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;
export type Styles = ReturnType<typeof makeDashboardStyles>;

export const makeDashboardStyles = (palette: Palette, tokens = theme) =>
    StyleSheet.create({
        screen: {
            flex: 1,
            backgroundColor: palette.background,
        },
        container: {
            flex: 1,
            padding: 16,
        },

        searchBar: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: palette.card,
            borderWidth: 1,
            borderColor: palette.border,
            borderRadius: tokens.radius.lg,
            paddingHorizontal: 16,
            paddingVertical: 12,
            marginBottom: 16,
        },
        searchInput: {
            flex: 1,
            fontSize: 16,
            color: palette.text,
            marginLeft: 12,
        },

        statsRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 16,
        },

        card: {
            backgroundColor: palette.card,
            borderWidth: 1,
            borderColor: palette.border,
            borderRadius: tokens.radius.lg,
            padding: 16,
        },
        smallCard: {
            width: CARD_WIDTH,
            height: CARD_WIDTH,
        },
        largeCard: {
            marginBottom: 16,
        },

        cardHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8,
        },
        cardTitle: {
            fontSize: 16,
            fontWeight: '600',
            color: palette.text,
        },
        cardSubtitle: {
            fontSize: 14,
            color: palette.subText,
        },

        progressContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
        },

        circleContainer: {
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 8,
        },
        circleBackground: {
            borderWidth: 6,
            borderColor: palette.border,
            justifyContent: 'center',
            alignItems: 'center',
        },
        circleProgress: {
            position: 'absolute',
            borderWidth: 6,
            borderLeftColor: 'transparent',
            borderBottomColor: 'transparent',
        },
        circleTextContainer: {
            position: 'absolute',
            justifyContent: 'center',
            alignItems: 'center',
        },
        circlePercentage: {
            fontSize: 16,
            fontWeight: '700',
            color: palette.text,
        },

        stepsTextContainer: {
            alignItems: 'center',
        },
        stepsCurrent: {
            fontSize: 18,
            fontWeight: '700',
            color: palette.text,
        },
        stepsGoal: {
            fontSize: 12,
            color: palette.subText,
            marginTop: 2,
        },

        weightMain: {
            fontSize: 20,
            fontWeight: '700',
            color: palette.text,
            textAlign: 'center',
        },
        weightGoal: {
            fontSize: 14,
            color: palette.subText,
            textAlign: 'center',
            marginTop: 4,
        },
        weightDifference: {
            fontSize: 12,
            color: tokens.colors.success,
            textAlign: 'center',
            marginTop: 2,
        },

        chartContainer: {
            marginTop: 8,
        },
        chartRow: {
            flexDirection: 'row',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            height: 120,
            marginBottom: 16,
        },
        barContainer: {
            alignItems: 'center',
            flex: 1,
        },
        bar: {
            width: 12,
            borderRadius: 6,
            backgroundColor: palette.primary,
            marginBottom: 4,
        },
        barLabel: {
            fontSize: 10,
            color: palette.subText,
        },


        foodRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 12,
        },
        foodItem: {
            alignItems: 'center',
            flex: 1,
        },
        foodValue: {
            fontSize: 18,
            fontWeight: '600',
            color: palette.text,
        },
        foodLabel: {
            fontSize: 12,
            color: palette.subText,
            marginTop: 2,
        },

        sleepProgressContainer: {
            alignItems: 'center',
        },
        sleepCircle: {
            width: 50,
            height: 50,
            borderRadius: 25,
            borderWidth: 3,
            borderColor: palette.border,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 4,
        },
        sleepCircleProgress: {
            position: 'absolute',
            width: 50,
            height: 50,
            borderRadius: 25,
            borderWidth: 3,
            borderLeftColor: 'transparent',
            borderBottomColor: 'transparent',
        },
    });

