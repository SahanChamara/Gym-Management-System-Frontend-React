import { QrCode, Users, Calendar, CreditCard, BarChart, X } from 'lucide-react';
import Sidebar from '../components/Sidebar.tsx';
import QRScannerModal from '../components/QRScannerModal.tsx';
import MemberForm from '../components/MemberForm.tsx';
import { useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { addAttendance, getAttendanceByMemberId, getMemberById, addMember } from '../services/api';
import type { Member, Attendance } from '../types';
import type { IDetectedBarcode } from '@yudiel/react-qr-scanner';
import { AxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
    const [isScanning, setIsScanning] = useState(false);
    const [showCamera, setShowCamera] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState<Member | null>(null);
    const [loading, setLoading] = useState(false);
    const [memberCache, setMemberCache] = useState<Map<string, Member>>(new Map());
    const navigate = useNavigate();

    const fetchMemberData = async (memberId: string): Promise<Member> => {
        if (memberCache.has(memberId)) {
            return memberCache.get(memberId)!;
        }
        try {
            const member = await getMemberById(memberId);
            setMemberCache(prev => new Map(prev).set(memberId, member));
            return member;
        } catch (err) {
            console.error('Error fetching member data:', err);
            throw new AxiosError(`Member ID ${memberId} not found`);
        }
    };

    const handleQRScan = async (detectedCodes: IDetectedBarcode[]) => {
        if (!detectedCodes || detectedCodes.length === 0) {
            toast.error('No QR code detected', { position: 'top-right' });
            return;
        }

        const data = detectedCodes[0].rawValue;
        if (!data) {
            toast.error('Invalid QR code data', { position: 'top-right' });
            return;
        }

        try {
            setIsScanning(true);

            // Parse QR code for MongoDB ObjectId
            const memberIdMatch = data.match(/memberId:\s*([a-f0-9]{24})/i);
            if (!memberIdMatch) {
                throw new Error('Invalid QR code format. Expected memberId: [24-character ObjectId]');
            }
            const memberId = memberIdMatch[1];

            // Verify member exists
            const member = await fetchMemberData(memberId);

            // Prepare attendance data with exact type expected by addAttendance
            const attendanceData: { timeIn: string; timeOut: null; status: string } = {
                timeIn: new Date().toISOString(),
                timeOut: null,
                status: 'Present',
            };

            // Call addAttendance to mark timeIn or timeOut
            await addAttendance(memberId, attendanceData);

            // Fetch updated attendance to determine if it was timeIn or timeOut
            const memberAttendances = await getAttendanceByMemberId(memberId);
            const today = new Date().toISOString().split('T')[0];
            const todayAttendance = memberAttendances.find(
                (att: Attendance) => att.date === today
            );

            const action = todayAttendance?.timeOut ? 'out' : 'in';
            toast.success(`Time ${action} recorded for ${member.name}`, { position: 'top-right' });
            setShowCamera(false);
        } catch (err: unknown) {
            console.error('QR Scan Error:', err);
            let errorMessage = 'Failed to process QR code. Please ensure the QR code is valid.';
            if (err instanceof AxiosError && err.response?.data?.message) {
                errorMessage = err.response.data.message;
            } else if (err instanceof Error) {
                errorMessage = err.message;
            }
            toast.error(errorMessage, { position: 'top-right' });
        } finally {
            setIsScanning(false);
        }
    };

    const handleScan = () => {
        setShowCamera(true);
    };

    const handleAddMember = () => {
        setFormData({
            name: '',
            age: 0,
            height: 0,
            weight: 0,
            nicNumber: '',
            email: '',
            address: '',
            qrCodeData: '',
            fingerprintData: '',
            faceImageData: '',
            membershipStartDate: '',
            activeStatus: true,
        });
        setShowModal(true);
    };

    const handleSubmit = async (data: Member) => {
        if (!data.name || !data.email || !data.nicNumber) {
            toast.error('Name, email, and NIC number are required', { position: 'top-right' });
            return;
        }
        try {
            setLoading(true);
            await addMember(data);
            toast.success('Member added successfully', { position: 'top-right' });
            setShowModal(false);
            setFormData(null);
        } catch (err) {
            console.error('Error adding member:', err);
            toast.error('Failed to save member', { position: 'top-right' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="flex flex-col md:flex-row min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
            <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                closeOnClick
                pauseOnHover
                theme="colored"
                toastClassName="dark:bg-slate-800 dark:text-white"
            />
            <Sidebar />
            <div className="flex-1 p-4 md:p-8 pb-20 md:pb-8">
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-slate-100 mb-2">Dashboard</h1>
                            <p className="text-slate-600 dark:text-slate-400">Welcome back! Here's what's happening at your gym today.</p>
                        </div>
                        <div className="hidden md:block">
                            <div
                                className="bg-white dark:bg-slate-800 rounded-lg px-4 py-2 shadow-sm border border-slate-200 dark:border-slate-700">
                                <span className="text-sm text-slate-600 dark:text-slate-400">Today:</span>
                                <span
                                    className="ml-2 font-semibold text-slate-800 dark:text-slate-200">{new Date().toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                    <div className="lg:col-span-1">
                        <div
                            className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-xl p-6 md:p-8 text-white h-full min-h-[350px] flex flex-col items-center justify-center relative overflow-hidden">
                            <div
                                className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                            <div
                                className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
                            <div className="relative z-10 text-center">
                                <div className="p-4 rounded-full bg-white/20 backdrop-blur-sm mb-6 mx-auto w-fit">
                                    <QrCode className="w-12 h-12 md:w-16 md:h-16" />
                                </div>
                                <h2 className="text-xl md:text-2xl font-bold mb-3">Quick Check-In</h2>
                                <p className="text-orange-100 mb-6 text-sm md:text-base">Scan QR code for instant attendance tracking</p>
                                <button
                                    onClick={handleScan}
                                    disabled={isScanning}
                                    className="bg-white text-orange-600 px-6 py-3 rounded-xl font-semibold hover:bg-orange-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50"
                                >
                                    {isScanning ? 'Scanning...' : 'Start Scanning'}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                            <button
                                onClick={handleAddMember}
                                className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-md hover:shadow-lg transition-all duration-200 border border-slate-200 dark:border-slate-700 text-center hover:-translate-y-0.5 h-44 md:h-[175px] flex flex-col items-center justify-center">
                                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                                <span
                                    className="text-sm font-medium text-slate-700 dark:text-slate-300">Add Member</span>
                            </button>
                            <button
                                className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-md hover:shadow-lg transition-all duration-200 border border-slate-200 dark:border-slate-700 text-center hover:-translate-y-0.5 h-44 md:h-[175px] flex flex-col items-center justify-center">
                                <Calendar className="w-6 h-6 text-green-600 dark:text-green-400 mx-auto mb-2" />
                                <span
                                    className="text-sm font-medium text-slate-700 dark:text-slate-300">Schedule Class</span>
                            </button>
                            <button
                                onClick={() => navigate('/payments')}
                                className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-md hover:shadow-lg transition-all duration-200 border border-slate-200 dark:border-slate-700 text-center hover:-translate-y-0.5 h-44 md:h-[175px] flex flex-col items-center justify-center">
                                <CreditCard className="w-6 h-6 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
                                <span
                                    className="text-sm font-medium text-slate-700 dark:text-slate-300">Process Payment</span>
                            </button>
                            <button
                                onClick={() => navigate('/reports')}
                                className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-md hover:shadow-lg transition-all duration-200 border border-slate-200 dark:border-slate-700 text-center hover:-translate-y-0.5 h-44 md:h-[175px] flex flex-col items-center justify-center">
                                <BarChart className="w-6 h-6 text-orange-600 dark:text-orange-400 mx-auto mb-2" />
                                <span
                                    className="text-sm font-medium text-slate-700 dark:text-slate-300">View Reports</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {showCamera && (
                <QRScannerModal
                    onScan={handleQRScan}
                    onClose={() => setShowCamera(false)}
                />
            )}

            {showModal && formData && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 p-6 rounded-2xl shadow-2xl w-full max-w-md sm:max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                                Add New Member
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <MemberForm
                            formData={formData}
                            onSubmit={handleSubmit}
                            onCancel={() => setShowModal(false)}
                            loading={loading}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}