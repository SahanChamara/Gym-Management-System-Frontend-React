import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import type { Payment, Member } from '../types';
import { getMembers } from '../services/api';

interface PaymentFormProps {
    formData: Payment;
    onSubmit: (data: Payment) => void;
    onCancel: () => void;
    loading: boolean;
}

export default function PaymentForm({ formData, onSubmit, onCancel, loading }: PaymentFormProps) {
    const [data, setData] = useState<Payment>({ ...formData });
    const [members, setMembers] = useState<Member[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [membersLoading, setMembersLoading] = useState(false);
    const [paymentPlan, setPaymentPlan] = useState<string>('1month');
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Payment plan configurations
    const paymentPlans = {
        '1month': { amount: 3500, months: 1, label: '1 Month' },
        '3months': { amount: 9000, months: 3, label: '3 Months' },
        '6months': { amount: 16000, months: 6, label: '6 Months' },
        '1year': { amount: 25000, months: 12, label: '1 Year' },
    };

    // Fetch members and pre-populate searchTerm when editing
    useEffect(() => {
        (async () => {
            setMembersLoading(true);
            try {
                const response = await getMembers();
                setMembers(response);
                if (formData.paymentId && formData.memberId) {
                    const member = response.find((m: { memberId: string; }) => m.memberId === formData.memberId);
                    setSearchTerm(member?.name || '');
                }
            } catch (err) {
                console.error('Error fetching members:', err);
                toast.error('Failed to fetch members', { position: 'top-right' });
            } finally {
                setMembersLoading(false);
            }
        })();
    }, [formData.paymentId, formData.memberId]);

    // Update amount and validUntilDate when payment plan or paymentDate changes
    useEffect(() => {
        if (data.paymentDate && paymentPlan) {
            const paymentDate = new Date(data.paymentDate);
            if (!isNaN(paymentDate.getTime())) {
                const plan = paymentPlans[paymentPlan as keyof typeof paymentPlans];
                const validUntil = new Date(paymentDate);
                validUntil.setMonth(paymentDate.getMonth() + plan.months);
                setData((prev) => ({
                    ...prev,
                    amount: plan.amount,
                    validUntilDate: validUntil.toISOString().split('T')[0]
                }));
            }
        }
    }, [data.paymentDate, paymentPlan]);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Validate form fields
    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};
        if (!data.memberId) {
            newErrors.memberId = 'Please select a member';
        }
        if (!data.amount || data.amount <= 0) {
            newErrors.amount = 'Amount must be greater than 0';
        }
        if (!data.paymentStatus) {
            newErrors.paymentStatus = 'Please select a payment status';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) {
            toast.error('Please fix the errors in the form', { position: 'top-right' });
            return;
        }
        onSubmit(data);
    };

    const filteredMembers = members.filter((member) =>
        `${member.memberId} ${member.name} ${member.nicNumber || ''}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
    );

    const handleMemberSelect = (member: Member) => {
        if (!member.memberId) {
            toast.error('Selected member has no ID', { position: 'top-right' });
            return;
        }
        setData({ ...data, memberId: member.memberId });
        setSearchTerm(member.name);
        setShowDropdown(false);
        setErrors((prev) => ({ ...prev, memberId: '' }));
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">
                    {formData.paymentId ? 'Edit Payment' : 'Add Payment'}
                </h2>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
                    <div className="flex flex-col gap-1 relative" ref={dropdownRef}>
                        <label htmlFor="member" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Member
                        </label>
                        <input
                            id="member"
                            type="text"
                            placeholder={membersLoading ? 'Loading members...' : 'Search by ID, Name, or NIC'}
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setShowDropdown(true);
                                setErrors((prev) => ({ ...prev, memberId: '' }));
                            }}
                            onFocus={() => setShowDropdown(true)}
                            disabled={membersLoading}
                            className={`p-2 border rounded-lg dark:bg-slate-700 dark:text-slate-200 w-full ${errors.memberId ? 'border-red-500' : ''
                                }`}
                        />
                        {errors.memberId && (
                            <p className="text-red-500 text-xs mt-1">{errors.memberId}</p>
                        )}
                        {showDropdown && !membersLoading && (
                            <ul className="absolute z-20 top-16 w-full bg-white dark:bg-slate-700 border rounded-lg max-h-60 overflow-y-auto text-gray-300">
                                {filteredMembers.length > 0 ? (
                                    filteredMembers.map((member) => (
                                        <li
                                            key={member.memberId}
                                            onClick={() => handleMemberSelect(member)}
                                            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-600 cursor-pointer"
                                        >
                                            {member.name} {member.nicNumber ? `(${member.nicNumber})` : ''}
                                        </li>
                                    ))
                                ) : (
                                    <li className="p-2 text-gray-500 dark:text-gray-400">No members found</li>
                                )}
                            </ul>
                        )}
                    </div>

                    <div className="flex flex-col gap-1">
                        <label htmlFor="paymentPlan" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Select Payment Plan
                        </label>
                        <select
                            id="paymentPlan"
                            value={paymentPlan}
                            onChange={(e) => setPaymentPlan(e.target.value)}
                            className="p-2 border rounded-lg dark:bg-slate-700 dark:text-slate-200 w-full"
                        >
                            {Object.entries(paymentPlans).map(([key, plan]) => (
                                <option key={key} value={key}>
                                    {plan.label} - LKR {plan.amount.toLocaleString()}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label htmlFor="amount" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Amount (LKR)
                        </label>
                        <input
                            id="amount"
                            type="number"
                            step="0.01"
                            min="0.01"
                            placeholder="Enter amount"
                            value={data.amount || ''}
                            onChange={(e) => {
                                const value = e.target.value ? parseFloat(e.target.value) : 0;
                                setData({ ...data, amount: value });
                                setErrors((prev) => ({ ...prev, amount: '' }));
                            }}
                            className={`p-2 border rounded-lg dark:bg-slate-700 dark:text-slate-200 w-full opacity-75 ${errors.amount ? 'border-red-500' : ''
                                }`}
                            title="Amount is automatically set based on selected payment plan"
                        />
                        {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
                    </div>

                    <div className="flex flex-col gap-1">
                        <label htmlFor="paymentDate" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Payment Date
                        </label>
                        <input
                            id="paymentDate"
                            type="date"
                            value={data.paymentDate}
                            onChange={(e) => {
                                setData({ ...data, paymentDate: e.target.value });
                                setErrors((prev) => ({ ...prev, paymentDate: '' }));
                            }}
                            className="p-2 border rounded-lg dark:bg-slate-700 dark:text-slate-200 w-full"
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label
                            htmlFor="validUntilDate"
                            className="text-sm font-medium text-gray-700 dark:text-gray-300"
                            title="Automatically calculated based on Payment Date and selected plan"
                        >
                            Valid Until
                        </label>
                        <input
                            id="validUntilDate"
                            type="date"
                            value={data.validUntilDate}
                            readOnly
                            className="p-2 border rounded-lg dark:bg-slate-700 dark:text-slate-200 w-full opacity-75 cursor-not-allowed"
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label htmlFor="paymentStatus" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Payment Status
                        </label>
                        <select
                            id="paymentStatus"
                            value={data.paymentStatus}
                            onChange={(e) => {
                                setData({ ...data, paymentStatus: e.target.value });
                                setErrors((prev) => ({ ...prev, paymentStatus: '' }));
                            }}
                            className={`p-2 border rounded-lg dark:bg-slate-700 dark:text-slate-200 w-full ${errors.paymentStatus ? 'border-red-500' : ''
                                }`}
                        >
                            <option value="">Select Status</option>
                            <option value="Completed">Completed</option>
                            <option value="Pending">Pending</option>
                            <option value="Failed">Failed</option>
                        </select>
                        {errors.paymentStatus && (
                            <p className="text-red-500 text-xs mt-1">{errors.paymentStatus}</p>
                        )}
                    </div>

                    <div className="flex justify-end gap-4">
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={loading}
                            className="px-4 py-2 bg-gray-200 dark:bg-slate-600 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-500 transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || membersLoading}
                            className="px-4 py-2 bg-orange-500 text-white rounded-lg disabled:opacity-50 hover:bg-orange-600 transition-colors"
                        >
                            {loading ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}