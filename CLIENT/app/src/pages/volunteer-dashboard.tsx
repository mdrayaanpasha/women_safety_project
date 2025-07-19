import React, { useEffect, useState } from 'react';
import axios from 'axios';

const VolunteerDashboard = () => {
    const [complaints, setComplaints] = useState<any[]>([]);
    const [userType, setUserType] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [statusUpdating, setStatusUpdating] = useState(false);

    const BACKEND_URL = 'http://localhost:3000';
    const token = localStorage.getItem('VL-TK');

    const decodeToken = () => {
        if (!token) return;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            setUserType(payload.userType);
        } catch {
            console.error('Failed to decode JWT.');
        }
    };

    const fetchComplaints = async () => {
        setLoading(true);
        try {
            const response = await axios.post(`http://localhost:3000/api/user/check-dispatch`, { token });

            if (response.data?.complaints?.length > 0) {
                setComplaints(response.data.complaints);
            } else {
                setComplaints([]);
            }
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to fetch complaints.');
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (dispatchId: number, newStatus: 'IN_PROGRESS' | 'RESOLVED') => {
        setStatusUpdating(true);
        try {
            await axios.post(`${BACKEND_URL}/api/complaint/updateVolunteers`, {
                token,
                dispatchId,
                newStatus
            });
            alert(`Status updated to ${newStatus}`);
            fetchComplaints();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to update status.');
        } finally {
            setStatusUpdating(false);
        }
    };

    useEffect(() => {
        decodeToken();
        fetchComplaints();
    }, []);

    return (
        <div className="max-w-5xl mx-auto p-6 bg-white rounded-xl shadow-xl">
            <h1 className="text-2xl font-bold mb-4 text-center">
                Volunteer Dashboard ({userType})
            </h1>

            {loading ? (
                <p className="text-center">Loading complaints...</p>
            ) : complaints.length > 0 ? (
                complaints.map((complaint) => (
                    <div key={complaint.dispatchId} className="space-y-4 mb-6 border p-4 rounded-xl bg-gray-50 shadow">
                        <div>
                            <h2 className="font-bold text-lg mb-2">Complaint ID: {complaint.complaintId}</h2>
                            <p><strong>Name:</strong> {complaint.complainantName}</p>
                            <p><strong>Phone:</strong> {complaint.complainantPhone}</p>
                            <p><strong>Type:</strong> {complaint.type}</p>
                            <p><strong>Description:</strong> {complaint.description || 'No description.'}</p>
                            <p><strong>Location:</strong> {complaint.location}</p>
                            <p><strong>Reported At:</strong> {new Date(complaint.reportedAt).toLocaleString()}</p>
                            <p className="mt-2">
                                <strong>Your Volunteer Status:</strong>{' '}
                                <span className="font-semibold">{complaint.volunteerStatus}</span>
                            </p>
                        </div>

                        <div className="flex justify-center gap-4">
                            <button
                                disabled={statusUpdating}
                                onClick={() => updateStatus(complaint.dispatchId, 'IN_PROGRESS')}
                                className="bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded-xl font-semibold"
                            >
                                Mark In Progress
                            </button>
                            <button
                                disabled={statusUpdating}
                                onClick={() => updateStatus(complaint.dispatchId, 'RESOLVED')}
                                className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-xl font-semibold"
                            >
                                Mark Resolved
                            </button>
                        </div>
                    </div>
                ))
            ) : (
                <p className="text-center text-gray-500">No active complaints assigned to you yet.</p>
            )}
        </div>
    );
};

export default VolunteerDashboard;
