import React, { useState, useContext } from 'react'
import { Mail, Lock } from 'lucide-react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { AuthContext } from '../context/AuthContext'
import { forgotPassword, resetPassword } from '../services/auth'
import InputField from '../components/InputField'
import { Button, LinkButton } from '../components/Button'
import ToastConfig from '../components/ToastConfig'

type AuthStep = 'LOGIN' | 'FORGOT' | 'RESET'

export default function Login() {
    const { loginUser } = useContext(AuthContext)
    const [step, setStep] = useState<AuthStep>('LOGIN')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [otp, setOtp] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [loading, setLoading] = useState(false)

    const handleError = (err: unknown, fallbackMsg: string) => {
        console.error(err)
        if (axios.isAxiosError(err) && err.response?.data?.message) {
            toast.error(err.response.data.message)
        } else {
            toast.error(fallbackMsg)
        }
    }

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email || !password) return toast.error('Email and password are required')

        try {
            setLoading(true)
            await loginUser(email, password)
        } catch (err) {
            handleError(err, 'Invalid login')
        } finally {
            setLoading(false)
        }
    }

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email) return toast.error('Email is required')

        try {
            setLoading(true)
            await forgotPassword(email)
            toast.success('Reset email sent')
            setStep('RESET')
        } catch (err) {
            handleError(err, 'Email is not registered')
        } finally {
            setLoading(false)
        }
    }

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email || !otp || !newPassword) return toast.error('All fields are required')

        try {
            setLoading(true)
            await resetPassword(email, otp, newPassword)
            toast.success('Password reset successful')
            await loginUser(email, newPassword)
            setStep('LOGIN')
        } catch (err) {
            handleError(err, 'Reset failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-lg w-full max-w-md">
                <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-6 text-center">
                    {step === 'RESET' ? 'Reset Password' : step === 'FORGOT' ? 'Forgot Password' : 'THE RSK FITNESS'}
                </h1>

                {step === 'LOGIN' && (
                    <form onSubmit={handleLogin}>
                        <InputField
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            icon={<Mail className="w-5 h-5" />}
                            label="Email"
                        />
                        <InputField
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            icon={<Lock className="w-5 h-5" />}
                            label="Password"
                        />
                        <Button type="submit" loading={loading}>Login</Button>
                        <LinkButton onClick={() => setStep('FORGOT')}>Forgot Password?</LinkButton>
                    </form>
                )}

                {step === 'FORGOT' && (
                    <form onSubmit={handleForgotPassword}>
                        <InputField
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            icon={<Mail className="w-5 h-5" />}
                            label="Email"
                        />
                        <Button type="submit" loading={loading}>Send Reset Email</Button>
                        <LinkButton onClick={() => setStep('LOGIN')}>Back to Login</LinkButton>
                    </form>
                )}

                {step === 'RESET' && (
                    <form onSubmit={handleResetPassword}>
                        <InputField
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            icon={<Mail className="w-5 h-5" />}
                            label="Email"
                        />
                        <InputField
                            type="text"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            placeholder="Enter OTP"
                            label="OTP"
                        />
                        <InputField
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter new password"
                            icon={<Lock className="w-5 h-5" />}
                            label="New Password"
                        />
                        <Button type="submit" loading={loading}>Reset Password</Button>
                        <LinkButton onClick={() => setStep('LOGIN')}>Back to Login</LinkButton>
                    </form>
                )}
                <ToastConfig />
            </div>
        </div>
    )
}