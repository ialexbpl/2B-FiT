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
  modalTitles
} from '../../models/ProfileModel';
import { } from '@styles/theme';
import { useProfile } from '../../context/ProfileContext';



export const SettingProfileInfo: React.FC<ProfileInformationsProps> = ({
  palette,
}) => {
  const styles = React.useMemo(() => makeProfileStyles(palette), [palette]);
  const {
    age,
    height,
    weight,
    goalWeight,
    activityLevel,
    allergies,
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

  const neutralBorder = palette.border;
  const neutralBackground = palette.card;
  const modalTextColor = palette.text;

  const selectedActivity = useMemo(
    () => (activityLevel ? activityLevel : 'Select level'),
    [activityLevel]
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

  return (
    <>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Information</Text>
        <View style={styles.settingsContainer}>
          <TouchableOpacity
            style={styles.settingsBlock}
            activeOpacity={0.7}
            onPress={() => openModal('age')}
          >
            <Text style={styles.settingsText}>Age:</Text>
            <Text style={[styles.settingsValue, { color: palette.subText }]}>
              {age ? `${age} years` : 'Set age'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingsBlock}
            activeOpacity={0.7}
            onPress={() => openModal('height')}
          >
            <Text style={styles.settingsText}>Height:</Text>
            <Text style={[styles.settingsValue, { color: palette.subText }]}>
              {height ? `${height} cm` : 'Set height'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingsBlock}
            activeOpacity={0.7}
            onPress={() => openModal('weight')}
          >
            <Text style={styles.settingsText}>Weight:</Text>
            <Text style={[styles.settingsValue, { color: palette.subText }]}>
              {weight ? `${weight} kg` : 'Set weight'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingsBlock}
            activeOpacity={0.7}
            onPress={() => openModal('goal')}
          >
            <Text style={styles.settingsText}>Target:</Text>
            <Text style={[styles.settingsValue, { color: palette.subText }]}>
              {goalWeight ? `${goalWeight} kg` : 'Set target weight'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingsBlock}
            activeOpacity={0.7}
            onPress={() => openModal('activity')}
          >
            <Text style={styles.settingsText}>Activity level:</Text>
            <Text style={[styles.settingsValue, { color: palette.subText }]}>
              {selectedActivity}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingsBlock}
            activeOpacity={0.7}
            onPress={() => openModal('allergies')}
          >
            <Text style={styles.settingsText}>Allergies:</Text>
            <Text style={[styles.settingsValue, { color: palette.subText }]}>
              {allergies.length ? allergies.join(', ') : 'No allergies'}
            </Text>
          </TouchableOpacity>
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
              { backgroundColor: neutralBackground, borderColor: neutralBorder }
            ]}
          >
            {activeModal && (
              <>
                <Text style={[styles.modalTitle, { color: modalTextColor }]}>
                  {modalTitles[activeModal]}
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
