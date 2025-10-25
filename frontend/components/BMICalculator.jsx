// /components/BMICalculator.jsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from './Card';
import { Colors } from '../utils/Colors';

const BMICalculator = () => {
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [bmi, setBmi] = useState(null);
  const [category, setCategory] = useState('');
  const [expanded, setExpanded] = useState(false);

  const calculateBMI = () => {
    if (!height || !weight) {
      Alert.alert('Missing Information', 'Please enter both height and weight');
      return;
    }

    const heightInMeters = parseFloat(height) / 100;
    const weightInKg = parseFloat(weight);
    
    if (heightInMeters <= 0 || weightInKg <= 0) {
      Alert.alert('Invalid Input', 'Please enter valid height and weight values');
      return;
    }

    const bmiValue = weightInKg / (heightInMeters * heightInMeters);
    const roundedBMI = Math.round(bmiValue * 10) / 10;
    
    setBmi(roundedBMI);
    determineCategory(roundedBMI);
  };

  const determineCategory = (bmiValue) => {
    if (bmiValue < 18.5) {
      setCategory('Underweight');
    } else if (bmiValue < 25) {
      setCategory('Normal weight');
    } else if (bmiValue < 30) {
      setCategory('Overweight');
    } else {
      setCategory('Obesity');
    }
  };

  const resetCalculator = () => {
    setHeight('');
    setWeight('');
    setBmi(null);
    setCategory('');
  };

  const getBMIColor = () => {
    if (!bmi) return Colors.textSecondary;
    if (bmi < 18.5) return '#3B82F6';
    if (bmi < 25) return '#10B981';
    if (bmi < 30) return '#F59E0B';
    return '#EF4444';
  };

  const getCategoryColor = () => {
    if (!category) return Colors.textSecondary;
    if (category === 'Underweight') return '#3B82F6';
    if (category === 'Normal weight') return '#10B981';
    if (category === 'Overweight') return '#F59E0B';
    return '#EF4444';
  };

  return (
    <Card style={[styles.shadowCard, styles.bmiCard]}>
      <TouchableOpacity 
        style={styles.header}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={styles.titleContainer}>
          <Ionicons name="fitness" size={24} color={Colors.secondary} />
          <Text style={styles.title}>🏋️ BMI Calculator</Text>
        </View>
        <Ionicons 
          name={expanded ? "chevron-up" : "chevron-down"} 
          size={20} 
          color={Colors.textSecondary} 
        />
      </TouchableOpacity>

      {expanded && (
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.inputSection}>
              <View style={styles.inputRow}>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Height (cm)</Text>
                  <TextInput
                    style={styles.input}
                    value={height}
                    onChangeText={setHeight}
                    placeholder="Enter height"
                    keyboardType="numeric"
                    placeholderTextColor={Colors.textSecondary}
                  />
                </View>
                
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Weight (kg)</Text>
                  <TextInput
                    style={styles.input}
                    value={weight}
                    onChangeText={setWeight}
                    placeholder="Enter weight"
                    keyboardType="numeric"
                    placeholderTextColor={Colors.textSecondary}
                  />
                </View>
              </View>

              <View style={styles.buttonContainer}>
                <TouchableOpacity 
                  style={[styles.button, styles.calculateButton]}
                  onPress={calculateBMI}
                >
                  <Ionicons name="calculator" size={16} color="#fff" />
                  <Text style={styles.buttonText}>Calculate BMI</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.button, styles.resetButton]}
                  onPress={resetCalculator}
                >
                  <Ionicons name="refresh" size={16} color={Colors.textSecondary} />
                  <Text style={styles.resetButtonText}>Reset</Text>
                </TouchableOpacity>
              </View>
            </View>

            {bmi && (
              <View style={styles.resultSection}>
                <View style={styles.resultCard}>
                  <Text style={styles.resultTitle}>Your BMI Result</Text>
                  
                  <View style={styles.bmiDisplay}>
                    <Text style={[styles.bmiValue, { color: getBMIColor() }]}>
                      {bmi}
                    </Text>
                    <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor() }]}>
                      <Text style={styles.categoryText}>{category}</Text>
                    </View>
                  </View>

                  <View style={styles.bmiScale}>
                    <View style={styles.scaleItem}>
                      <View style={[styles.scaleColor, { backgroundColor: '#3B82F6' }]} />
                      <Text style={styles.scaleText}>Underweight</Text>
                      <Text style={styles.scaleRange}>&lt; 18.5</Text>
                    </View>
                    <View style={styles.scaleItem}>
                      <View style={[styles.scaleColor, { backgroundColor: '#10B981' }]} />
                      <Text style={styles.scaleText}>Normal</Text>
                      <Text style={styles.scaleRange}>18.5 - 24.9</Text>
                    </View>
                    <View style={styles.scaleItem}>
                      <View style={[styles.scaleColor, { backgroundColor: '#F59E0B' }]} />
                      <Text style={styles.scaleText}>Overweight</Text>
                      <Text style={styles.scaleRange}>25 - 29.9</Text>
                    </View>
                    <View style={styles.scaleItem}>
                      <View style={[styles.scaleColor, { backgroundColor: '#EF4444' }]} />
                      <Text style={styles.scaleText}>Obesity</Text>
                      <Text style={styles.scaleRange}>≥ 30</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.healthTips}>
                  <Text style={styles.tipsTitle}>💡 Health Tips</Text>
                  {category === 'Underweight' && (
                    <Text style={styles.tipText}>
                      • Focus on nutrient-dense foods{'\n'}
                      • Include healthy fats and proteins{'\n'}
                      • Consider strength training{'\n'}
                      • Eat regular meals
                    </Text>
                  )}
                  {category === 'Normal weight' && (
                    <Text style={styles.tipText}>
                      • Maintain balanced diet{'\n'}
                      • Regular physical activity{'\n'}
                      • Stay hydrated{'\n'}
                      • Get adequate sleep
                    </Text>
                  )}
                  {category === 'Overweight' && (
                    <Text style={styles.tipText}>
                      • Portion control{'\n'}
                      • Increase physical activity{'\n'}
                      • Reduce processed foods{'\n'}
                      • Consistent exercise routine
                    </Text>
                  )}
                  {category === 'Obesity' && (
                    <Text style={styles.tipText}>
                      • Consult healthcare provider{'\n'}
                      • Gradual lifestyle changes{'\n'}
                      • Regular exercise{'\n'}
                      • Balanced nutrition plan
                    </Text>
                  )}
                </View>
              </View>
            )}

            <View style={styles.infoSection}>
              <Text style={styles.infoTitle}>About BMI</Text>
              <Text style={styles.infoText}>
                Body Mass Index (BMI) is a measure of body fat based on height and weight. 
                It's a useful screening tool but doesn't directly measure body fat.
              </Text>
              <Text style={styles.disclaimer}>
                Note: This is for informational purposes only. Consult a healthcare professional for medical advice.
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  shadowCard: {
    backgroundColor: Colors.card,
    shadowColor: Colors.primary,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
  },
  bmiCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#8B5CF6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.secondary,
    marginLeft: 8,
  },
  inputSection: {
    marginTop: 16,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  inputContainer: {
    flex: 1,
    marginHorizontal: 4,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 4,
  },
  calculateButton: {
    backgroundColor: Colors.secondary,
  },
  resetButton: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 6,
  },
  resetButtonText: {
    color: Colors.textSecondary,
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 6,
  },
  resultSection: {
    marginTop: 20,
  },
  resultCard: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  bmiDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  bmiValue: {
    fontSize: 36,
    fontWeight: '800',
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  categoryText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  bmiScale: {
    marginTop: 8,
  },
  scaleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  scaleColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  scaleText: {
    fontSize: 12,
    color: Colors.textPrimary,
    fontWeight: '500',
    flex: 1,
  },
  scaleRange: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  healthTips: {
    backgroundColor: 'rgba(139, 92, 246, 0.05)',
    borderRadius: 12,
    padding: 16,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  tipText: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  infoSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
    marginBottom: 8,
  },
  disclaimer: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 14,
  },
});

export default BMICalculator;