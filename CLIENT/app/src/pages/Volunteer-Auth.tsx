import React, { useState, useEffect } from 'react';
import axios from 'axios';
// Import toast and Toaster from react-hot-toast
import toast, { Toaster } from 'react-hot-toast';
import { User, Mail, Lock, Phone, MapPin, Upload, Scale, Shield, HeartPulse, Loader2 } from 'lucide-react';

// --- Helper Component: Styled Input Field ---
// A reusable, styled input component with an icon.
const InputField = ({ icon, ...props }: { icon: React.ReactNode;[key: string]: any }) => (
  <div className="relative mb-4">
    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
      {icon}
    </span>
    <input
      {...props}
      className="w-full bg-slate-800/50 border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-slate-200 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
    />
  </div>
);

// --- Main Authentication Form Component ---
// NOTE: You need to install react-hot-toast: npm install react-hot-toast
const UserAuthForm = () => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    password: '',
    phone: '',
    type: 'LEGAL',
    location: '',
  });
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);

  const BACKEND_URL = 'http://localhost:3000';

  const fetchLocation = () => {
    if (navigator.geolocation) {
      setIsFetchingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const locationString = `${latitude.toFixed(6)},${longitude.toFixed(6)}`;
          setFormData((prev) => ({ ...prev, location: locationString }));
          toast.success('Location fetched automatically!');
          setIsFetchingLocation(false);
        },
        (error) => {
          console.error('Location fetch failed:', error.message);
          toast.error('Could not fetch location. Please enable permissions.');
          setIsFetchingLocation(false);
        }
      );
    }
  };

  // Automatically fetch location when switching to register mode
  useEffect(() => {
    if (mode === 'register') {
      fetchLocation();
    }
  }, [mode]);


  const handleModeChange = () => {
    setMode(prev => prev === 'login' ? 'register' : 'login');
    setFormData({ email: '', name: '', password: '', phone: '', type: 'LEGAL', location: '' });
    setImage(null);
    setImagePreview(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleTypeSelect = (type: string) => {
    setFormData({ ...formData, type });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading(mode === 'register' ? 'Submitting profile for review...' : 'Logging in...');

    try {
      if (mode === 'register') {
        const data = new FormData();
        // Append all form data fields, including the new 'phone' field
        Object.entries(formData).forEach(([key, value]) => {
          data.append(key, value);
        });
        if (image) {
          data.append('image', image);
        }

        await axios.post(`${BACKEND_URL}/api/user/register`, data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        // Updated success message for registration
        toast.success('Profile submitted! We are reviewing your profile and will reach out within a day after verification.', { id: toastId, duration: 6000 });

        // Reset the form but stay on the register page
        setFormData({ email: '', name: '', password: '', phone: '', type: 'LEGAL', location: '' });
        setImage(null);
        setImagePreview(null);
        fetchLocation(); // Re-fetch location for a potential new registration

      } else {
        await axios.post(`${BACKEND_URL}/api/user/login`, {
          email: formData.email,
          password: formData.password
        });
        toast.success('Login successful! Welcome back.', { id: toastId });
        // Here you would typically handle the login token (e.g., save to localStorage and redirect)
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'An unknown error occurred.';
      toast.error(errorMessage, { id: toastId });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const volunteerTypes = [
    { id: 'LEGAL', name: 'Legal', icon: <Scale /> },
    { id: 'POLICE', name: 'Police', icon: <Shield /> },
    { id: 'MENTAL', name: 'Mental Health', icon: <HeartPulse /> },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4 font-sans bg-grid-slate-800/[0.2]">
      {/* Toaster component from react-hot-toast will render all notifications */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#334155',
            color: '#f1f5f9',
          },
        }}
      />

      <div className="w-full max-w-4xl grid lg:grid-cols-2 rounded-2xl shadow-2xl overflow-hidden bg-slate-900/70 backdrop-blur-sm border border-slate-800">
        {/* Left Panel: Welcome Message & Graphics */}
        <div className="hidden lg:flex flex-col items-center justify-center p-8 bg-gradient-to-br from-indigo-600 to-purple-700 text-white">
          <h2 className="text-3xl font-bold mb-4">
            {mode === 'login' ? 'Welcome Back!' : 'Join Our Community'}
          </h2>
          <p className="text-center text-indigo-200">
            {mode === 'login'
              ? 'Log in to continue your journey with us.'
              : 'Become a volunteer and make a difference in someone\'s life.'}
          </p>
          <div className="mt-8 w-48 h-48 bg-white/10 rounded-full flex items-center justify-center">
            <User size={80} className="text-indigo-300" />
          </div>
        </div>

        {/* Right Panel: Form */}
        <div className="p-8">
          <h2 className="text-2xl font-bold text-center mb-6 text-slate-100">
            {mode === 'login' ? 'Login to Your Account' : 'Create a Volunteer Account'}
          </h2>

          <form onSubmit={handleSubmit}>
            {mode === 'register' && (
              <>
                <InputField name="name" type="text" placeholder="Full Name" icon={<User size={18} />} value={formData.name} onChange={handleChange} required />
                <InputField name="phone" type="tel" placeholder="Phone Number" icon={<Phone size={18} />} value={formData.phone} onChange={handleChange} required />

                <div className="mb-4">
                  <p className="text-slate-300 text-sm font-medium mb-2">Select Your Volunteer Type</p>
                  <div className="grid grid-cols-3 gap-2">
                    {volunteerTypes.map(vType => (
                      <button type="button" key={vType.id} onClick={() => handleTypeSelect(vType.id)}
                        className={`flex flex-col items-center p-3 border-2 rounded-lg transition-all ${formData.type === vType.id ? 'border-indigo-500 bg-indigo-500/20 text-white' : 'border-slate-700 hover:border-slate-500 text-slate-300'}`}>
                        {vType.icon}
                        <span className="text-xs mt-1">{vType.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <InputField
                  name="location"
                  type="text"
                  placeholder={isFetchingLocation ? 'Fetching location...' : 'Location (auto-fetched)'}
                  icon={<MapPin size={18} />}
                  value={formData.location}
                  readOnly
                  required
                />

                <label className="w-full flex items-center justify-center p-4 border-2 border-dashed border-slate-700 rounded-lg cursor-pointer hover:border-indigo-500 hover:bg-slate-800/50 transition-all mb-4">
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-16 h-16 rounded-full object-cover" />
                  ) : (
                    <div className="text-center text-slate-400">
                      <Upload size={24} className="mx-auto mb-1" />
                      <p className="text-sm font-semibold">Upload Professional Proof</p>
                      <p className="text-xs">e.g., Bar Council ID, Medical License</p>
                    </div>
                  )}
                </label>
              </>
            )}

            <InputField name="email" type="email" placeholder="Email Address" icon={<Mail size={18} />} value={formData.email} onChange={handleChange} required />
            <InputField name="password" type="password" placeholder="Password" icon={<Lock size={18} />} value={formData.password} onChange={handleChange} required />

            <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition-all flex items-center justify-center">
              {loading ? <Loader2 className="animate-spin" /> : (mode === 'login' ? 'Login' : 'Submit for Review')}
            </button>
          </form>

          <p className="text-center mt-4 text-sm text-slate-400">
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
            <button onClick={handleModeChange} className="ml-2 text-indigo-400 font-semibold hover:underline">
              {mode === 'login' ? 'Register' : 'Login'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserAuthForm;
