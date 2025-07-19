import React, { useState } from 'react';
import axios from 'axios';

const AdminPendingVerifications = () => {
    const [adminPassword, setAdminPassword] = useState('');
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

    const BACKEND_URL = 'http://localhost:3000';

    const fetchPendingUsers = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await axios.post(`${BACKEND_URL}/api/user/pending-verifications`, { adminPassword });
            setUsers(response.data.users || []);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Error fetching users.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (userId: number) => {
        try {
            await axios.post(`${BACKEND_URL}/api/user/verify/${userId}`, { adminPassword });
            alert('User verified.');
            fetchPendingUsers(); // Refresh list
        } catch (err: any) {
            alert(err.response?.data?.error || 'Error verifying user.');
        }
    };

    const handleReject = async (userId: number) => {
        try {
            await axios.post(`${BACKEND_URL}/api/user/reject/${userId}`, { adminPassword });
            alert('User rejected and banned.');
            fetchPendingUsers(); // Refresh list
        } catch (err: any) {
            alert(err.response?.data?.error || 'Error rejecting user.');
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-6 bg-white rounded-2xl shadow-xl">
            <h2 className="text-2xl font-bold mb-4 text-center">Pending Verifications (Admin)</h2>

            <input
                type="password"
                placeholder="Enter Admin Password"
                className="w-full p-3 border rounded-xl mb-4"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
            />

            <button
                onClick={fetchPendingUsers}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-semibold mb-4"
            >
                {loading ? 'Fetching...' : 'Fetch Pending Users'}
            </button>

            {error && <p className="text-red-600 text-center mb-4">{error}</p>}

            {users.length > 0 && (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="p-2 border">Image</th>
                                <th className="p-2 border">ID</th>
                                <th className="p-2 border">Name</th>
                                <th className="p-2 border">Email</th>
                                <th className="p-2 border">Type</th>
                                <th className="p-2 border">Location</th>
                                <th className="p-2 border">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.id}>
                                    <td className="p-2 border">
                                        {user.filePath ? (
                                            <img
                                                src={`${BACKEND_URL}${user.filePath}`}
                                                alt="User"
                                                className="w-16 h-16 rounded-lg object-cover cursor-pointer"
                                                onClick={() => setFullscreenImage(`${BACKEND_URL}${user.filePath}`)}
                                            />
                                        ) : (
                                            <div className="w-16 h-16 bg-gray-200 flex items-center justify-center text-gray-400 text-xs rounded-lg">
                                                No Image
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-2 border">{user.id}</td>
                                    <td className="p-2 border">{user.name}</td>
                                    <td className="p-2 border">{user.email}</td>
                                    <td className="p-2 border">{user.type}</td>
                                    <td className="p-2 border">{user.location}</td>
                                    <td className="p-2 border flex flex-col space-y-2">
                                        <button
                                            onClick={() => handleVerify(user.id)}
                                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-xl"
                                        >
                                            Accept
                                        </button>
                                        <button
                                            onClick={() => handleReject(user.id)}
                                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-xl"
                                        >
                                            Reject
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {users.length === 0 && !loading && !error && (
                <p className="text-center text-gray-500">No users pending verification.</p>
            )}

            {fullscreenImage && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
                    onClick={() => setFullscreenImage(null)}
                >
                    <img
                        src={fullscreenImage}
                        alt="Full Screen"
                        className="max-w-full max-h-full object-contain"
                    />
                </div>
            )}
        </div>
    );
};

export default AdminPendingVerifications;
