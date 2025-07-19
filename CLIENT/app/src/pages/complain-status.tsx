import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
// Importing icons needed for the refined design
import {
    FileText, User, Tag, CheckCircle, Scale, Shield, HeartPulse,
    ClipboardList, AlertTriangle, Check, Loader, Clock, XCircle
} from 'lucide-react';

// --- Helper Component: Volunteer Status Timeline ---
// A clear, visual timeline for each volunteer's progress.
const VolunteerStatusTimeline = ({ status }: { status: 'AUTO_DISPATCHED' | 'IN_PROGRESS' | 'RESOLVED' | null }) => {
    const stages = ['Dispatched', 'In Progress', 'Resolved'];

    if (!status) {
        return (
            <div className="text-center p-4 bg-slate-800/50 rounded-lg mt-3">
                <p className="text-sm text-slate-500">Awaiting assignment...</p>
            </div>
        );
    }

    const getStatusIndex = (currentStatus: string) => {
        if (currentStatus === 'RESOLVED') return 2;
        if (currentStatus === 'IN_PROGRESS') return 1;
        return 0; // AUTO_DISPATCHED
    };
    const activeIndex = getStatusIndex(status);

    return (
        <div className="flex items-center w-full pt-4 mt-4 border-t border-slate-700/50">
            {stages.map((stage, index) => {
                const isCompleted = index < activeIndex;
                const isActive = index === activeIndex;
                const nodeColor = isCompleted || isActive ? 'bg-teal-500' : 'bg-slate-600';
                const textColor = isCompleted || isActive ? 'text-slate-100' : 'text-slate-400';
                const connectorColor = isCompleted ? 'bg-teal-500' : 'bg-slate-700';

                return (
                    <React.Fragment key={stage}>
                        <div className="flex flex-col items-center text-center">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center ${nodeColor} border-2 border-slate-800`}>
                                {isCompleted && <Check size={16} className="text-white" />}
                                {isActive && status === 'IN_PROGRESS' && <Loader size={14} className="text-white animate-spin" />}
                                {isActive && status === 'RESOLVED' && <Check size={16} className="text-white" />}
                            </div>
                            <p className={`text-xs mt-2 font-semibold ${textColor}`}>{stage}</p>
                        </div>
                        {index < stages.length - 1 && <div className={`flex-1 h-1 mx-1 sm:mx-4 ${connectorColor}`} />}
                    </React.Fragment>
                );
            })}
        </div>
    );
};


const ComplaintDetailsPage = () => {
    const { id } = useParams<{ id: string }>();
    const [complaintData, setComplaintData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const BACKEND_URL = 'http://localhost:3000';

    useEffect(() => {
        const fetchComplaintDetails = async () => {
            setLoading(true);
            try {
                const response = await axios.post(`${BACKEND_URL}/api/complaint/getComplaintDetailsWithVolunteers/${id}`);
                setComplaintData(response.data?.data);
                console.log(response.data.data)
            } catch (err: any) {
                setError(err.response?.data?.error || 'Failed to fetch complaint details.');
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchComplaintDetails();
    }, [id]);

    const roleIcons: { [key: string]: React.ReactNode } = {
        'Legal': <Scale className="text-slate-300" />,
        'Police': <Shield className="text-slate-300" />,
        'Mental Health': <HeartPulse className="text-slate-300" />
    };

    if (loading || error) {
        const message = loading ? 'Loading Complaint Details...' : error;
        const icon = loading ? <Loader size={32} className="animate-spin" /> : <XCircle size={32} />;
        return (
            <div className={`flex min-h-screen items-center justify-center bg-slate-950 ${loading ? 'text-slate-400' : 'text-rose-500'}`}>
                {icon}
                <span className="ml-3 text-lg">{message}</span>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 bg-grid-slate-800/[0.2] p-4 sm:p-6 lg:p-8 font-sans text-slate-200">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* --- Header: Complaint Info --- */}
                <header className="p-6 bg-slate-900/70 backdrop-blur-sm border border-slate-800 rounded-xl">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm text-slate-400">Complaint ID</p>
                            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-50">{complaintData.complaintId}</h1>
                        </div>
                        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium
                            ${complaintData.status === 'Resolved' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-blue-500/20 text-blue-300'}`}>
                            <div className={`w-2 h-2 rounded-full ${complaintData.status === 'Resolved' ? 'bg-emerald-400' : 'bg-blue-400'}`}></div>
                            <span>{complaintData.status}</span>
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-800 text-sm text-slate-300 flex space-x-6">
                        <p><strong className="text-slate-400 font-medium">Type:</strong> {complaintData.complaintType}</p>
                        <p><strong className="text-slate-400 font-medium">Lodged:</strong> {new Date(complaintData.reportedAt).toLocaleDateString()}</p>
                    </div>
                </header>

                {/* --- Main Section: Assigned Volunteers --- */}
                <main>
                    <h2 className="text-xl font-bold text-slate-200 mb-4 ml-1">Assigned Volunteers</h2>
                    <div className="space-y-4">
                        {complaintData.dispatches && complaintData.dispatches.length > 0 ? (
                            complaintData.dispatches.flatMap((dispatch: any) => [
                                { role: 'Legal', volunteer: dispatch.legalVolunteer },
                                { role: 'Police', volunteer: dispatch.policeVolunteer },
                                { role: 'Mental Health', volunteer: dispatch.mentalVolunteer },
                            ]).map(({ role, volunteer }: any, index: any): any => (
                                <div key={`${role}-${index}`} className="p-5 bg-slate-900/70 backdrop-blur-sm border border-slate-800 rounded-xl">
                                    <div className="flex items-center space-x-4">
                                        <div className="bg-slate-800 p-3 rounded-full">{roleIcons[role]}</div>
                                        <div>
                                            <p className="font-bold text-lg text-slate-100">{role} Support</p>
                                            <p>Phone: {volunteer.mobile}</p>
                                            <p className="text-sm text-slate-400">{volunteer ? volunteer.name : 'Unassigned'}</p>
                                        </div>
                                    </div>
                                    <VolunteerStatusTimeline status={volunteer ? volunteer.status : null} />
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-12 text-slate-500 bg-slate-900/70 backdrop-blur-sm border border-slate-800 rounded-xl">
                                No volunteers have been assigned yet.
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default ComplaintDetailsPage;