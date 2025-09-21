import axios from 'axios';

const API = axios.create({
  baseURL: 'http://YOUR_LOCAL_IP:5000', // replace with your backend IP or ngrok URL
});

export default API;
    