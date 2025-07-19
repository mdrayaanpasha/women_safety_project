import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Hand, HeartCrack, Ban, Landmark, Laptop, Gift, HelpCircle, Copy, CheckCircle2, ChevronDown, MapPin } from 'lucide-react';

// The main component for the complaint form.
const App = () => {
    // State for form data
    const [formData, setFormData] = useState({
        phoneNo: '',
        name: '',
        type: 'PHYSICAL',
        description: '',
        location: ''
    });

    // State for UI and interaction logic
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [complaintId, setComplaintId] = useState<number | null>(null);
    const [copied, setCopied] = useState(false);
    const [showOptional, setShowOptional] = useState(false);

    // Using a ref for the message timeout to avoid issues with re-renders
    const messageTimeoutRef = useRef<any>(null);

    // Define the base URL for your backend API.
    // Make sure this is running and accessible from your frontend.
    const BACKEND_URL = 'http://localhost:3000';

    // Defines the different types of abuse with corresponding icons.
    const abuseTypes = [
        { value: 'PHYSICAL', label: 'Physical', icon: <Hand size={20} /> },
        { value: 'EMOTIONAL', label: 'Emotional', icon: <HeartCrack size={20} /> },
        { value: 'SEXUAL', label: 'Sexual', icon: <Ban size={20} /> },
        { value: 'FINANCIAL', label: 'Financial', icon: <Landmark size={20} /> },
        { value: 'CYBER', label: 'Cyber', icon: <Laptop size={20} /> },
        { value: 'DOWRY', label: 'Dowry', icon: <Gift size={20} /> },
        { value: 'OTHER', label: 'Other', icon: <HelpCircle size={20} /> },
    ];

    // Helper function to show a message for a few seconds.
    const showTemporaryMessage = (msg: string) => {
        setMessage(msg);
        if (messageTimeoutRef.current) {
            clearTimeout(messageTimeoutRef.current);
        }
        messageTimeoutRef.current = setTimeout(() => {
            setMessage('');
        }, 4000);
    };

    // Handles changes in form inputs and text areas.
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Handles the selection of an abuse type.
    const handleTypeSelect = (type: string) => {
        setFormData({ ...formData, type });
    };

    // Handles the form submission.
    const handleSubmit = async () => {
        // Basic validation
        if (!formData.phoneNo || !formData.type || !formData.location) {
            showTemporaryMessage('Please fill all required fields: Phone, Abuse Type, and Location.');
            return;
        }

        setLoading(true);
        setMessage('');

        try {
            // ** REAL API CALL **
            // This now uses axios to send a POST request to your backend.
            // The mock function has been removed.
            const response = await axios.post(`${BACKEND_URL}/api/complaint/createComplaint`, formData);

            const id = response.data?.complaint?.id;
            if (id) {
                setComplaintId(id);
            } else {
                // Handle cases where the API might not return an ID as expected.
                showTemporaryMessage('Complaint filed, but no ID was returned. We still received it!');
            }
        } catch (err: any) {
            // Catches errors from the API call, like network issues or server errors.
            showTemporaryMessage(err.response?.data?.error || 'Submission failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Fetches the user's geolocation using the browser's Geolocation API.
    const fetchLocation = () => {
        if (!navigator.geolocation) {
            showTemporaryMessage('Your browser does not support Geolocation.');
            return;
        }
        setFormData(prev => ({ ...prev, location: 'Fetching...' }));
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const coords = `${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`;
                setFormData((prev) => ({ ...prev, location: coords }));
            },
            () => {
                showTemporaryMessage('Could not get location. Please enable location services.');
                setFormData(prev => ({ ...prev, location: 'Permission Denied' }));
            }
        );
    };

    // Copies the generated complaint link to the clipboard.
    const handleCopyLink = () => {
        const linkToCopy = `${window.location.origin}/complaint/${complaintId}`;
        const tempTextArea = document.createElement('textarea');
        tempTextArea.value = linkToCopy;
        document.body.appendChild(tempTextArea);
        tempTextArea.select();
        document.execCommand('copy');
        document.body.removeChild(tempTextArea);

        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Resets the form to its initial state to file another complaint.
    const resetForm = () => {
        setComplaintId(null);
        setFormData({
            phoneNo: '',
            name: '',
            type: 'PHYSICAL',
            description: '',
            location: formData.location, // Keep location pre-filled for convenience
        });
        setMessage('');
        setShowOptional(false);
    };

    // On component mount, fetch the location and set up cleanup for the message timeout.
    useEffect(() => {
        fetchLocation();
        return () => {
            if (messageTimeoutRef.current) {
                clearTimeout(messageTimeoutRef.current);
            }
        };
    }, []);

    return (
        <div className="font-sans bg-slate-900 flex items-center justify-center min-h-screen p-4 text-slate-100">
            <div className="w-full max-w-4xl bg-slate-950/70 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">

                {complaintId ? (
                    // Success Screen: Shown after a complaint is submitted successfully.
                    <div className="flex flex-col items-center justify-center text-center p-8 flex-grow">
                        <CheckCircle2 size={64} className="text-emerald-400 mb-4" />
                        <h2 className="text-2xl font-bold text-slate-50 mb-2">Complaint Submitted</h2>
                        <p className="text-slate-400 mb-4">Volunteers have been notified. Help is on the way.</p>
                        <p className="text-xs text-rose-400 font-medium mb-4">⚠️ This link is private. Do not share it.</p>

                        <div className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 flex items-center justify-between gap-2 mb-6">
                            <a
                                href={`${window.location.origin}/complaint/${complaintId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-mono text-xs text-sky-400 truncate hover:underline"
                            >
                                {`${window.location.origin}/complaint/${complaintId}`}
                            </a>
                            <button onClick={handleCopyLink} className="p-1.5 rounded-md hover:bg-slate-700 transition-colors text-slate-300">
                                {copied ? <CheckCircle2 size={16} className="text-emerald-400" /> : <Copy size={16} />}
                            </button>
                        </div>

                        <button
                            onClick={resetForm}
                            className="w-full max-w-xs mx-auto bg-slate-700 hover:bg-slate-600 text-slate-50 font-bold py-3 px-4 rounded-lg text-base transition-all duration-300"
                        >
                            File Another Complaint
                        </button>
                    </div>
                ) : (
                    // Form Screen: The main form for creating a complaint.
                    <>
                        <header className="p-6 border-b border-slate-800">
                            <h2 className="text-xl font-bold text-center text-slate-50">Report an Incident</h2>
                            <p className="text-center text-sm text-slate-400">Your report is anonymous and confidential.</p>
                        </header>

                        <div className="w-full p-6 md:p-8 grid md:grid-cols-2 md:gap-x-12 gap-y-6">
                            {/* Left Column: Required and optional inputs */}
                            <div className="space-y-6">
                                <div>
                                    <label htmlFor="phoneNo" className="block text-slate-400 text-sm font-medium mb-1.5">
                                        Your Phone Number <span className="text-rose-400">*</span>
                                    </label>
                                    <input
                                        type="tel" id="phoneNo" name="phoneNo"
                                        placeholder="10-digit mobile number"
                                        className="w-full p-3 border border-slate-700 rounded-lg text-base bg-slate-900 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                                        value={formData.phoneNo}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="location" className="block text-slate-400 text-sm font-medium mb-1.5">
                                        Your Location <span className="text-rose-400">*</span>
                                    </label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-grow">
                                            <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                            <input
                                                type="text" id="location" name="location" readOnly
                                                value={formData.location || '...'}
                                                className="w-full p-3 pl-10 border border-slate-700 rounded-lg bg-slate-900 text-slate-300 text-sm cursor-not-allowed placeholder-slate-500"
                                            />
                                        </div>
                                        <button onClick={fetchLocation} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-base transition-colors">📍</button>
                                    </div>
                                </div>

                                <div>
                                    <button onClick={() => setShowOptional(!showOptional)} className="w-full flex justify-between items-center text-slate-400 hover:text-slate-200 transition">
                                        <span className="text-sm font-medium">Optional Details</span>
                                        <ChevronDown size={20} className={`transition-transform duration-300 ${showOptional ? 'rotate-180' : ''}`} />
                                    </button>
                                    {showOptional && (
                                        <div className="mt-3 space-y-4 border-t border-slate-800 pt-4">
                                            <input
                                                type="text" name="name" placeholder="Your Name (Optional)"
                                                className="w-full p-3 border border-slate-700 rounded-lg text-base bg-slate-900 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                                                value={formData.name}
                                                onChange={handleChange}
                                            />
                                            <textarea
                                                name="description" rows={4} placeholder="Describe the incident (Optional)"
                                                className="w-full p-3 border border-slate-700 rounded-lg text-base bg-slate-900 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                                                value={formData.description}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right Column: Abuse types and submit button */}
                            <div className="flex flex-col">
                                <div>
                                    <label className="block text-slate-400 text-sm font-medium mb-2">
                                        Type of Incident <span className="text-rose-400">*</span>
                                    </label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {abuseTypes.map((t) => (
                                            <button
                                                key={t.value}
                                                onClick={() => handleTypeSelect(t.value)}
                                                className={`p-3 border rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-200 text-sm font-semibold
                                                    ${formData.type === t.value
                                                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 ring-2 ring-emerald-500/50'
                                                        : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                                                    }`}
                                            >
                                                {t.icon}
                                                <span>{t.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex-grow"></div>

                                <div className="mt-6">
                                    {message && (
                                        <p className="text-center text-sm mb-3 text-rose-400">
                                            {message}
                                        </p>
                                    )}
                                    <button
                                        onClick={handleSubmit}
                                        disabled={loading || !formData.location || !formData.phoneNo || formData.location === 'Fetching...'}
                                        className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold py-3 px-4 rounded-lg text-lg transition-all duration-300 disabled:opacity-50 disabled:saturate-50 disabled:cursor-not-allowed transform hover:scale-105 disabled:transform-none"
                                    >
                                        {loading ? 'Submitting...' : 'Send Help'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default App;
