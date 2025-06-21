const { validateMedicationData } = require('./medicationValidation');

describe('Medication Validation Utility', () => {
  describe('validateMedicationData', () => {
    it('should return isValid: true for valid medication data', () => {
      const validData = {
        name: 'Ibuprofen',
        dosage: '200mg',
        frequency: 'as_needed'
      };
      const result = validateMedicationData(validData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('should return an error if the medication name is too short', () => {
      const invalidData = {
        name: 'A',
        dosage: '200mg',
        frequency: 'once_daily'
      };
      const result = validateMedicationData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.name).toBeDefined();
    });

    it('should return an error if the dosage is missing', () => {
      const invalidData = {
        name: 'Paracetamol',
        dosage: '',
        frequency: 'twice_daily'
      };
      const result = validateMedicationData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.dosage).toBeDefined();
    });

    it('should return an error for an invalid frequency option', () => {
      const invalidData = {
        name: 'Aspirin',
        dosage: '1 tablet',
        frequency: 'sometimes'
      };
      const result = validateMedicationData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.frequency).toBeDefined();
    });

    it('should return multiple errors for multiple invalid fields', () => {
      const invalidData = {
        name: '',
        dosage: '',
        frequency: ''
      };
      const result = validateMedicationData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.name).toBeDefined();
      expect(result.errors.dosage).toBeDefined();
      expect(result.errors.frequency).toBeDefined();
    });
  });
});