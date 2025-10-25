import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API = process.env.API_URL || 'http://localhost:5000';

async function run() {
  try {
    const testEmail = `e2e_user_${Date.now()}@example.com`;
    console.log('Registering user', testEmail);
    const reg = await axios.post(`${API}/api/auth/register`, {
      name: 'E2E Tester',
      email: testEmail,
      password: 'password123',
      role: 'Youth'
    });

    const token = reg.data.token;
    console.log('Registered. Token:', !!token);

    const questionnaire = {
      age: 20,
      gender: 'Prefer not to say',
      stressLevel: 'Moderate',
      hasEmergencyContact: true,
      emergencyContactName: 'Parent',
      emergencyContactPhone: '+1234567890',
      allowMoodTracking: true,
      additionalNotes: "E2E test notes"
    };

    console.log('Submitting questionnaire...');
    const post = await axios.post(`${API}/api/questionnaire`, questionnaire, { headers: { Authorization: `Bearer ${token}` } });
    console.log('POST response:', post.data.success, post.data.message || '');

    console.log('Fetching questionnaire...');
    const get = await axios.get(`${API}/api/questionnaire`, { headers: { Authorization: `Bearer ${token}` } });
    console.log('GET response success:', get.data.success);
    console.log('Questionnaire id:', get.data.data?._id || get.data._id);

    console.log('E2E test completed successfully');
  } catch (err) {
    console.error('E2E failed:', err.response?.data || err.message || err);
    process.exit(1);
  }
}

run();
