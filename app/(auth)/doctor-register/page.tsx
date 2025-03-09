"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

interface FormData {
  name: string;
  email: string;
  password: string;
  specialization: string;
  qualification: string;
  experience: string;
  workingHours: {
    start: string;
    end: string;
  };
  availableDays: string[];
  maxAppointmentsPerDay: number;
  about: string;
  profileImage: string;
}

export default function DoctorRegister() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    specialization: '',
    qualification: '',
    experience: '',
    workingHours: {
      start: '09:00',
      end: '17:00'
    },
    availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    maxAppointmentsPerDay: 10,
    about: '',
    profileImage: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMissingFields([]);

    // Validate form data
    if (formData.availableDays.length === 0) {
      setError('Please select at least one available day');
      setMissingFields(['availableDays']);
      setLoading(false);
      return;
    }

    // Format data for submission
    const submissionData = {
      ...formData,
      experience: Number(formData.experience),
      maxAppointmentsPerDay: Number(formData.maxAppointmentsPerDay)
    };

    try {
      console.log('Submitting data:', submissionData);
      const response = await axios.post('/api/doctor/register', submissionData);
      router.push('/doctor-login?registered=true');
    } catch (error: any) {
      console.error('Error registering doctor:', error);
      if (error.response?.data?.details) {
        // Handle validation errors
        const details = error.response.data.details;
        const fields = details.map((d: any) => d.field);
        setMissingFields(fields);
        setError(error.response.data.error || 'Validation failed');
      } else if (error.response?.data?.missingFields) {
        setMissingFields(error.response.data.missingFields);
        setError('Please fill in all required fields');
      } else {
        setError(error.response?.data?.error || error.response?.data?.message || 'Failed to register');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof FormData] as Record<string, string>),
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleDayToggle = (day: string) => {
    setFormData(prev => ({
      ...prev,
      availableDays: prev.availableDays.includes(day)
        ? prev.availableDays.filter(d => d !== day)
        : [...prev.availableDays, day]
    }));
  };

  const isFieldMissing = (fieldName: string) => {
    return missingFields.includes(fieldName);
  };

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Register as a Doctor</h1>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg mb-6">
            {error}
            {missingFields.length > 0 && (
              <ul className="mt-2 list-disc list-inside">
                {missingFields.map(field => (
                  <li key={field}>
                    {field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-400 mb-2">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className={`w-full p-2 bg-gray-800 text-white rounded-lg border ${
                isFieldMissing('name') ? 'border-red-500' : 'border-gray-700'
              } focus:border-orange-500 focus:outline-none`}
            />
          </div>

          <div>
            <label className="block text-gray-400 mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className={`w-full p-2 bg-gray-800 text-white rounded-lg border ${
                isFieldMissing('email') ? 'border-red-500' : 'border-gray-700'
              } focus:border-orange-500 focus:outline-none`}
            />
          </div>

          <div>
            <label className="block text-gray-400 mb-2">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              minLength={6}
              className={`w-full p-2 bg-gray-800 text-white rounded-lg border ${
                isFieldMissing('password') ? 'border-red-500' : 'border-gray-700'
              } focus:border-orange-500 focus:outline-none`}
            />
            <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
          </div>

          <div>
            <label className="block text-gray-400 mb-2">
              Specialization <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="specialization"
              value={formData.specialization}
              onChange={handleInputChange}
              required
              className={`w-full p-2 bg-gray-800 text-white rounded-lg border ${
                isFieldMissing('specialization') ? 'border-red-500' : 'border-gray-700'
              } focus:border-orange-500 focus:outline-none`}
            />
          </div>

          <div>
            <label className="block text-gray-400 mb-2">
              Qualification <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="qualification"
              value={formData.qualification}
              onChange={handleInputChange}
              required
              className={`w-full p-2 bg-gray-800 text-white rounded-lg border ${
                isFieldMissing('qualification') ? 'border-red-500' : 'border-gray-700'
              } focus:border-orange-500 focus:outline-none`}
            />
          </div>

          <div>
            <label className="block text-gray-400 mb-2">
              Years of Experience <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="experience"
              value={formData.experience}
              onChange={handleInputChange}
              required
              min="0"
              className={`w-full p-2 bg-gray-800 text-white rounded-lg border ${
                isFieldMissing('experience') ? 'border-red-500' : 'border-gray-700'
              } focus:border-orange-500 focus:outline-none`}
            />
          </div>

          <div>
            <label className="block text-gray-400 mb-2">
              Working Hours <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-4">
              <input
                type="time"
                name="workingHours.start"
                value={formData.workingHours.start}
                onChange={handleInputChange}
                required
                className={`flex-1 p-2 bg-gray-800 text-white rounded-lg border ${
                  isFieldMissing('workingHours') ? 'border-red-500' : 'border-gray-700'
                } focus:border-orange-500 focus:outline-none`}
              />
              <span className="text-gray-400">to</span>
              <input
                type="time"
                name="workingHours.end"
                value={formData.workingHours.end}
                onChange={handleInputChange}
                required
                className={`flex-1 p-2 bg-gray-800 text-white rounded-lg border ${
                  isFieldMissing('workingHours') ? 'border-red-500' : 'border-gray-700'
                } focus:border-orange-500 focus:outline-none`}
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-400 mb-2">
              Available Days <span className="text-red-500">*</span>
            </label>
            <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 rounded-lg border ${
              isFieldMissing('availableDays') ? 'border-red-500' : 'border-gray-700'
            }`}>
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                <label key={day} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.availableDays.includes(day)}
                    onChange={() => handleDayToggle(day)}
                    className="text-orange-500 rounded border-gray-700 focus:ring-orange-500"
                  />
                  <span className="text-gray-300">{day}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-gray-400 mb-2">
              Maximum Appointments per Day <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="maxAppointmentsPerDay"
              value={formData.maxAppointmentsPerDay}
              onChange={handleInputChange}
              required
              min="1"
              max="20"
              className="w-full p-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-orange-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-gray-400 mb-2">About</label>
            <textarea
              name="about"
              value={formData.about}
              onChange={handleInputChange}
              rows={4}
              className="w-full p-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-orange-500 focus:outline-none"
              placeholder="Tell us about your experience and expertise..."
            />
          </div>

          <div>
            <label className="block text-gray-400 mb-2">Profile Image URL (Optional)</label>
            <input
              type="url"
              name="profileImage"
              value={formData.profileImage}
              onChange={handleInputChange}
              className="w-full p-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-orange-500 focus:outline-none"
              placeholder="https://example.com/your-image.jpg"
            />
          </div>

          <div className="text-sm text-gray-400 mb-4">
            <p>Fields marked with <span className="text-red-500">*</span> are required</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 text-white py-2 rounded-lg font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
      </div>
    </div>
  );
} 