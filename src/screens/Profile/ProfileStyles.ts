import { StyleSheet } from 'react-native';
import { theme, lightPalette } from '@styles/theme';

export const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#f4f6fb', // tło całego ekranu
  },
  header: {
    backgroundColor: lightPalette.background, // niebieski nagłówek
    alignItems: 'center',
    borderBlockColor: lightPalette.border,
    paddingVertical: 20,
    margin: 10,
    borderRadius: theme.radius.lg,
    borderColor: lightPalette.border,
    borderWidth: 1,
  },
  settingsIcon: {
    position: 'absolute',
    top: 20,
    right: 20,
    padding: 5,
  },


  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 15,
    borderWidth: 3,
    borderColor: theme.colors.primary,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: lightPalette.text,
  },
  email: {
    fontSize: 16,
    color: lightPalette.text,
    marginTop: 5,
  },
  section: {
    padding: 10,
    backgroundColor: lightPalette.background,
    paddingVertical: 20,
    margin: 10,
    borderRadius: theme.radius.lg,
    borderColor: lightPalette.border,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },

  settingsContainer: {
    margin: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',


  },
  settingsBlock: {
    margin: 5,
    borderRadius: theme.radius.md,
    padding: 10,
    backgroundColor: lightPalette.card,
    borderColor: lightPalette.border,
    borderWidth: 1,
    width: '45%',
    minHeight: 100,
  },

  settingsText: {
    fontSize: 16,
    color: lightPalette.text,
    fontWeight: '600',
  },
  settingsValue: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: '500',
  },
  optionList: {
    marginTop: 8,
  },
  optionButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    marginTop: 12,
  },
  optionButtonSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  optionButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  optionScroll: {
    maxHeight: 220,
  },
  optionChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  optionChipSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  optionChipText: {
    fontSize: 15,
    fontWeight: '500',
  },

  achivmentContainer: {
    margin: 10,
    textAlign: 'center',
    justifyContent: 'center',
  },
  achivmentBlock: {
    margin: 5,
    borderRadius: theme.radius.md,
    padding: 10,
    backgroundColor: lightPalette.card,
    borderColor: lightPalette.border,
    borderWidth: 1,
    width: '100%',
    height: 100,
  },
  achivmentText: {
    fontSize: 16,
    fontWeight: '600',
    color: lightPalette.text,
  },
  achivmentDescription: {
    marginTop: 10,
    fontSize: 16,
    alignItems: 'center',
    justifyContent: 'center',
    color: lightPalette.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 320,
    padding: 20,
    backgroundColor: lightPalette.card,
    borderRadius: theme.radius.md,
    borderColor: lightPalette.border,
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    color: lightPalette.text,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: lightPalette.border,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: lightPalette.text,
    marginTop: 8,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: lightPalette.border,
    backgroundColor: lightPalette.card,
    marginLeft: 12,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: lightPalette.text,
  },
  modalPrimaryButton: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  modalPrimaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: lightPalette.text,
  },
});
