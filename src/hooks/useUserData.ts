import axios from 'axios';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Lab, Patient } from '../types/user';

export const useUserData = () => {
  const [userData, setUserData] = useState<Patient | Lab | null>(null);
  const [loading, setLoading] = useState(true);
  const userRole = localStorage.getItem('userRole');
  const userId = JSON.parse(localStorage.getItem('currentUser') || '{}').id;

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const endpoint = userRole === 'patient' ? '/api/patients' : '/api/labs';
        const response = await axios.get(`${endpoint}/${userId}`);
        setUserData(response.data);
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast.error('Failed to load user data');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserData();
    }
  }, [userId, userRole]);

  const updateUserData = async (id: number, updates: Record<string, any>) => {
    try {
      const response = await axios.put(`http://localhost:8080/api/patients/${id}`, updates);
      return response.data;
    } catch (error) {
      console.error('Error updating user data:', error);
      throw error;
    }
  };

  return { userData, loading, updateUserData };
};