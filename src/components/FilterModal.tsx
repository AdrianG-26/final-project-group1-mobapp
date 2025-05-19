import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: any) => void;
}

const FilterModal: React.FC<FilterModalProps> = ({ visible, onClose, onApply }) => {
  const [sortBy, setSortBy] = useState<string>('');
  const [discounts, setDiscounts] = useState<string[]>([]);
  const [gender, setGender] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);

  const handleSortBySelect = (value: string) => {
    setSortBy(value);
  };

  const handleDiscountToggle = (value: string) => {
    setDiscounts(prev => 
      prev.includes(value) 
        ? prev.filter(item => item !== value)
        : [...prev, value]
    );
  };

  const handleGenderToggle = (value: string) => {
    setGender(prev => 
      prev.includes(value) 
        ? prev.filter(item => item !== value)
        : [...prev, value]
    );
  };

  const handleTypeToggle = (value: string) => {
    setTypes(prev => 
      prev.includes(value) 
        ? prev.filter(item => item !== value)
        : [...prev, value]
    );
  };

  const handleReset = () => {
    setSortBy('');
    setDiscounts([]);
    setGender([]);
    setTypes([]);
  };

  const handleApply = () => {
    onApply({
      sortBy,
      discounts,
      gender,
      types
    });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Filter</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Sort By */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sort By</Text>
              <TouchableOpacity
                style={styles.radioButton}
                onPress={() => handleSortBySelect('low-high')}
              >
                <View style={[styles.radio, sortBy === 'low-high' && styles.radioSelected]} />
                <Text style={styles.optionText}>Price: Low-High</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.radioButton}
                onPress={() => handleSortBySelect('high-low')}
              >
                <View style={[styles.radio, sortBy === 'high-low' && styles.radioSelected]} />
                <Text style={styles.optionText}>Price: High-Low</Text>
              </TouchableOpacity>
            </View>

            {/* Sale & Offers */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sale & Offers</Text>
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() => handleDiscountToggle('20-30')}
              >
                <View style={[styles.checkboxInner, discounts.includes('20-30') && styles.checkboxSelected]}>
                  {discounts.includes('20-30') && <Icon name="check" size={16} color="#fff" />}
                </View>
                <Text style={styles.optionText}>20-30%</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() => handleDiscountToggle('30-40')}
              >
                <View style={[styles.checkboxInner, discounts.includes('30-40') && styles.checkboxSelected]}>
                  {discounts.includes('30-40') && <Icon name="check" size={16} color="#fff" />}
                </View>
                <Text style={styles.optionText}>30-40%</Text>
              </TouchableOpacity>
            </View>

            {/* Gender */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Gender</Text>
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() => handleGenderToggle("Men's")}
              >
                <View style={[styles.checkboxInner, gender.includes("Men's") && styles.checkboxSelected]}>
                  {gender.includes("Men's") && <Icon name="check" size={16} color="#fff" />}
                </View>
                <Text style={styles.optionText}>Male</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() => handleGenderToggle("Women's")}
              >
                <View style={[styles.checkboxInner, gender.includes("Women's") && styles.checkboxSelected]}>
                  {gender.includes("Women's") && <Icon name="check" size={16} color="#fff" />}
                </View>
                <Text style={styles.optionText}>Female</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() => handleGenderToggle('Unisex')}
              >
                <View style={[styles.checkboxInner, gender.includes('Unisex') && styles.checkboxSelected]}>
                  {gender.includes('Unisex') && <Icon name="check" size={16} color="#fff" />}
                </View>
                <Text style={styles.optionText}>Unisex</Text>
              </TouchableOpacity>
            </View>

            {/* Types */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Types</Text>
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() => handleTypeToggle('shoes')}
              >
                <View style={[styles.checkboxInner, types.includes('shoes') && styles.checkboxSelected]}>
                  {types.includes('shoes') && <Icon name="check" size={16} color="#fff" />}
                </View>
                <Text style={styles.optionText}>Shoes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() => handleTypeToggle('slippers')}
              >
                <View style={[styles.checkboxInner, types.includes('slippers') && styles.checkboxSelected]}>
                  {types.includes('slippers') && <Icon name="check" size={16} color="#fff" />}
                </View>
                <Text style={styles.optionText}>Slippers</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() => handleTypeToggle('sandals')}
              >
                <View style={[styles.checkboxInner, types.includes('sandals') && styles.checkboxSelected]}>
                  {types.includes('sandals') && <Icon name="check" size={16} color="#fff" />}
                </View>
                <Text style={styles.optionText}>Sandals</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity 
              style={styles.resetButton} 
              onPress={handleReset}
            >
              <Text style={styles.resetButtonText}>
                Reset ({[...discounts, ...gender, ...types].length + (sortBy ? 1 : 0)})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.applyButton} 
              onPress={handleApply}
            >
              <Text style={styles.applyButtonText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#fff',
    marginTop: 50,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#000',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    backgroundColor: '#000',
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkboxInner: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#000',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#000',
  },
  optionText: {
    fontSize: 16,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    gap: 12,
  },
  resetButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#000',
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  applyButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#000',
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default FilterModal; 