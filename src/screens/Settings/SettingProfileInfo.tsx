import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView
} from 'react-native';
import { makeProfileStyles } from '../Profile/ProfileStyles';
import {
  ACTIVITY_LEVELS,
  ALLERGY_OPTIONS,
  ModalType,
  ProfileInformationsProps,
  numericMaxLength,
  modalPlaceholders,
  modalTitles,
  modalDescriptions,
  SEX_OPTIONS
} from '../../models/ProfileModel';
import { useProfile } from '../../context/ProfileContext';
import Icon from 'react-native-vector-icons/Ionicons';

type SettingProfileInfoProps = ProfileInformationsProps & {
  layout?: 'default' | 'inline';
};

export const SettingProfileInfo: React.FC<SettingProfileInfoProps> = ({
  palette,
  layout = 'default',
}) => {
  const styles = React.useMemo(() => makeProfileStyles(palette), [palette]);
  const {
    sex,
    age,
    height,
    weight,
    goalWeight,
    activityLevel,
    allergies,
    setSex,
    setAge,
    setHeight,
    setWeight,
    setGoalWeight,
    setActivityLevel,
    setAllergies,
  } = useProfile();

  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [draftTextValue, setDraftTextValue] = useState('');
  const [draftActivity, setDraftActivity] = useState<string | null>(activityLevel);
  const [draftAllergies, setDraftAllergies] = useState<string[]>(allergies);
  const [draftSex, setDraftSex] = useState<typeof SEX_OPTIONS[number]>(sex);

  const neutralBorder = palette.border;
  const neutralBackground = palette.card;
  const modalTextColor = palette.text;

  const selectedActivity = useMemo(
    () => (activityLevel ? activityLevel : 'Select level'),
    [activityLevel]
  );

  const editCards = useMemo(
    () => [
      {
        key: 'sex',
        type: 'sex' as ModalType,
        label: 'Sex',
        value: sex,
        helper: 'Choose Male or Female',
        icon: 'male-female-outline',
      },
      {
        key: 'age',
        type: 'age' as ModalType,
        label: 'Age',
        value: age ? `${age} years` : 'Set age',
        helper: 'Tap to update',
        icon: 'calendar-outline',
      },
      {
        key: 'height',
        type: 'height' as ModalType,
        label: 'Height',
        value: height ? `${height} cm` : 'Set height',
        helper: 'Tap to update',
        icon: 'resize-outline',
      },
      {
        key: 'weight',
        type: 'weight' as ModalType,
        label: 'Weight',
        value: weight ? `${weight} kg` : 'Set weight',
        helper: 'Tap to update',
        icon: 'barbell-outline',
      },
      {
        key: 'goal',
        type: 'goal' as ModalType,
        label: 'Target',
        value: goalWeight ? `${goalWeight} kg` : 'Set target weight',
        helper: 'Define your goal',
        icon: 'flag-outline',
      },
      {
        key: 'activity',
        type: 'activity' as ModalType,
        label: 'Activity level',
        value: selectedActivity,
        helper: 'Choose your routine',
        icon: 'pulse-outline',
      },
      {
        key: 'allergies',
        type: 'allergies' as ModalType,
        label: 'Allergies',
        value: allergies.length ? allergies.join(', ') : 'No allergies',
        helper: 'Manage list',
        icon: 'leaf-outline',
      },
    ],
    [sex, age, height, weight, goalWeight, selectedActivity, allergies],
  );

  const openModal = (type: ModalType) => {
    if (!type) {
      return;
    }

    switch (type) {
      case 'age':
        setDraftTextValue(age);
        break;
      case 'height':
        setDraftTextValue(height);
        break;
      case 'weight':
        setDraftTextValue(weight);
        break;
      case 'goal':
        setDraftTextValue(goalWeight);
        break;
      case 'sex':
        setDraftSex(sex);
        break;
      case 'activity':
        setDraftActivity(activityLevel ?? ACTIVITY_LEVELS[0]);
        break;
      case 'allergies':
        setDraftAllergies(allergies);
        break;
    }

    setActiveModal(type);
  };

  const handleNumericChange = (value: string, maxLength: number) => {
    const numericValue = value.replace(/[^0-9]/g, '').slice(0, maxLength);
    setDraftTextValue(numericValue);
  };

  const toggleAllergy = (option: string) => {
    setDraftAllergies(prev =>
      prev.includes(option) ? prev.filter(item => item !== option) : [...prev, option]
    );
  };

  const handleModalCancel = () => {
    setActiveModal(null);
  };

  const handleModalSave = () => {
    if (!activeModal) {
      return;
    }

    if (activeModal === 'sex') {
      setSex(draftSex);
      setActiveModal(null);
      return;
    }

    if (activeModal === 'activity') {
      if (draftActivity) {
        setActivityLevel(draftActivity);
      }
      setActiveModal(null);
      return;
    }

    if (activeModal === 'allergies') {
      setAllergies(draftAllergies);
      setActiveModal(null);
      return;
    }

    const normalized = draftTextValue.trim();
    if (!normalized) {
      setActiveModal(null);
      return;
    }

    switch (activeModal) {
      case 'age':
        setAge(normalized);
        break;
      case 'height':
        setHeight(normalized);
        break;
      case 'weight':
        setWeight(normalized);
        break;
      case 'goal':
        setGoalWeight(normalized);
        break;
    }

    setActiveModal(null);
  };

  const renderModalBody = () => {
    if (!activeModal) {
      return null;
    }

    if (activeModal === 'sex') {
      return (
        <View style={styles.optionList}>
          {SEX_OPTIONS.map(option => {
            const isSelected = draftSex === option;
            return (
              <TouchableOpacity
                key={option}
                onPress={() => setDraftSex(option)}
                style={[
                  styles.optionButton,
                  { borderColor: neutralBorder, backgroundColor: neutralBackground },
                  isSelected && styles.optionButtonSelected
                ]}
              >
                <Text
                  style={[
                    styles.optionButtonText,
                    { color: isSelected ? '#ffffff' : modalTextColor }
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      );
    }

    if (activeModal === 'activity') {
      return (
        <View style={styles.optionList}>
          {ACTIVITY_LEVELS.map(level => {
            const isSelected = draftActivity === level;
            return (
              <TouchableOpacity
                key={level}
                onPress={() => setDraftActivity(level)}
                style={[
                  styles.optionButton,
                  { borderColor: neutralBorder, backgroundColor: neutralBackground },
                  isSelected && styles.optionButtonSelected
                ]}
              >
                <Text
                  style={[
                    styles.optionButtonText,
                    { color: isSelected ? '#ffffff' : modalTextColor }
                  ]}
                >
                  {level}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      );
    }

    if (activeModal === 'allergies') {
      return (
        <ScrollView
          style={styles.optionScroll}
          contentContainerStyle={styles.optionGrid}
          nestedScrollEnabled
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {ALLERGY_OPTIONS.map(option => {
            const isSelected = draftAllergies.includes(option);
            return (
              <TouchableOpacity
                key={option}
                onPress={() => toggleAllergy(option)}
                style={[
                  styles.optionChip,
                  { borderColor: neutralBorder, backgroundColor: neutralBackground },
                  isSelected && styles.optionChipSelected
                ]}
              >
                <Text
                  style={[
                    styles.optionChipText,
                    { color: isSelected ? '#ffffff' : modalTextColor }
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity
            onPress={() => setDraftAllergies([])}
            style={[
              styles.optionChip,
              { borderColor: neutralBorder, backgroundColor: neutralBackground }
            ]}
          >
            <Text style={[styles.optionChipText, { color: modalTextColor }]}>
              No allergies
            </Text>
          </TouchableOpacity>
        </ScrollView>
      );
    }

    const key = activeModal as 'age' | 'height' | 'weight' | 'goal';
    return (
      <TextInput
        value={draftTextValue}
        onChangeText={value => handleNumericChange(value, numericMaxLength[key])}
        keyboardType="number-pad"
        placeholder={modalPlaceholders[key]}
        style={[
          styles.modalInput,
          { borderColor: neutralBorder, color: modalTextColor }
        ]}
        placeholderTextColor={palette.subText}
      />
    );
  };

  const sectionWrapperStyle =
    layout === 'inline' ? styles.inlineSection : styles.section;
  const sectionTitleStyle =
    layout === 'inline' ? styles.inlineSectionTitle : styles.sectionTitle;
  const containerStyle =
    layout === 'inline' ? styles.inlineSettingsContainer : styles.settingsContainer;

  return (
    <>
      <View style={sectionWrapperStyle}>
        <Text style={sectionTitleStyle}>Information</Text>
        <View style={containerStyle}>
          {editCards.map(card => (
            <TouchableOpacity
              key={card.key}
              style={styles.settingsBlock}
              activeOpacity={0.85}
              onPress={() => openModal(card.type)}
            >
              <View style={[styles.settingsIconWrap, { backgroundColor: `${palette.primary}14` }]}>
                <Icon name={card.icon} size={20} color={palette.primary} />
              </View>
              <Text style={styles.settingsText}>{card.label}</Text>
              <Text
                style={[styles.settingsValue, { color: palette.text }]}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {card.value}
              </Text>
              <Text style={[styles.settingsHelper, { color: palette.subText }]}>{card.helper}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <Modal
        transparent
        animationType="fade"
        visible={Boolean(activeModal)}
        onRequestClose={handleModalCancel}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: palette.card100, borderColor: neutralBorder }
            ]}
          >
            {activeModal && (
              <>
                <Text style={[styles.modalTitle, { color: modalTextColor }]}>
                  {modalTitles[activeModal]}
                </Text>
                <Text style={styles.modalSubtitle}>
                  {modalDescriptions[activeModal]}
                </Text>
                {renderModalBody()}
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    onPress={handleModalCancel}
                    style={[
                      styles.modalButton,
                      { borderColor: neutralBorder, backgroundColor: neutralBackground }
                    ]}
                  >
                    <Text style={[styles.modalButtonText, { color: modalTextColor }]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleModalSave}
                    style={[styles.modalButton, styles.modalPrimaryButton]}
                  >
                    <Text style={styles.modalPrimaryButtonText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
};

export default SettingProfileInfo;
