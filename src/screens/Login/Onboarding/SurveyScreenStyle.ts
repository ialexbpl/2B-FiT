import { StyleSheet, Platform } from 'react-native';
import { theme } from '../../../styles/theme';

export const surveyStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing(2),
    paddingTop: theme.spacing(2),
    paddingBottom: theme.spacing(3),
  },
  card: {
    borderRadius: theme.radius.lg,
    padding: theme.spacing(2),
    borderWidth: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: theme.spacing(1),
  },
  subtitle: {
    fontSize: 14,
    marginBottom: theme.spacing(2),
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(1),
  },
  input: {
    borderWidth: 1,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing(1.5),
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 16,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  } as any,
  chip: {
    paddingHorizontal: theme.spacing(1.5),
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  submitButton: {
    marginTop: theme.spacing(3),
    borderRadius: theme.radius.xl,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
