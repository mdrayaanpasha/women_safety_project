import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

const ActivateAccount = () => {
    const { token } = useParams<{ token: string }>();
    const [status, setStatus] = useState<string>('Activating...');
    const BACKEND_URL = 'http://localhost:3000';

    useEffect(() => {
        const activateAccount = async () => {
            if (!token) {
                setStatus('Invalid activation link.');
                return;
            }

            try {
                // Save token in localStorage as VL-TK

                const response = await axios.post(`http://localhost:3000/api/user/activate`, {
                    token
                });

                setStatus('Your account has been activated successfully..');
                localStorage.setItem('VL-TK', token);
                window.location.href = "./dashboard"
            } catch (error: any) {
                setStatus(
                    error?.response?.data?.error ||
                    'Failed to activate your account. The token may be invalid or expired.'
                );
            }
        };

        activateAccount();
    }, [token]);

    return (
        <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded-xl shadow-lg text-center">
            <h1 className="text-2xl font-bold mb-4">Account Activation</h1>
            <p className="text-gray-700">{status}</p>
        </div>
    );
};

export default ActivateAccount;
