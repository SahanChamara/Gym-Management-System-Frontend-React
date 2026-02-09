import {NavLink} from 'react-router-dom';
import {
    BarChart,
    Calendar,
    CreditCard,
    LogOut,
    MessageSquare,
    Users,
    Dumbbell,
    ClipboardPlus    
} from 'lucide-react';
import {useContext, memo} from 'react';
import {AuthContext} from '../context/AuthContext.tsx';

const navItems = [
    {path: '/', label: 'Dashboard', icon: BarChart},
    {path: '/members', label: 'Members', icon: Users},
    {path: '/attendance', label: 'Attendance', icon: Calendar},
    {path: '/payments', label: 'Payments', icon: CreditCard},
    {path: '/notifications', label: 'Notifications', icon: MessageSquare},
    {path: '/reports', label: 'Report', icon: ClipboardPlus}
];

// Memoized Nav Item component
const NavItem = memo(({path, label, Icon}: { path: string; label: string; Icon: any }) => (
    <NavLink
        to={path}
        className={({isActive}) =>
            `flex items-center px-4 py-4 rounded-2xl transition-all duration-300 group relative overflow-hidden ${
                isActive
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25'
                    : 'text-slate-300 hover:bg-slate-800/50 hover:text-white hover:translate-x-1'
            }`
        }
    >
        {({isActive}) => (
            <>
                {isActive && (
                    <div
                        className="absolute inset-0 bg-gradient-to-r from-orange-400 to-orange-500 opacity-20 rounded-2xl"></div>
                )}
                <div
                    className={`p-2 rounded-xl mr-4 transition-all duration-300 ${
                        isActive ? 'bg-white/20 shadow-lg' : 'bg-slate-700/50 group-hover:bg-slate-700'
                    }`}
                >
                    <Icon className="w-5 h-5"/>
                </div>
                <span className="font-medium relative z-10">{label}</span>
                {isActive && <div className="ml-auto w-2 h-2 bg-white rounded-full shadow-lg"></div>}
            </>
        )}
    </NavLink>
));

export default function Sidebar() {
    const {logoutUser} = useContext(AuthContext);

    return (
        <>
            {/* Desktop Sidebar */}
            <div
                className="hidden md:flex md:w-72 md:flex-col md:h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 shadow-2xl relative overflow-hidden">
                {/* Decorative Circles */}
                <div
                    className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full -translate-y-16 translate-x-16"></div>
                <div className="absolute bottom-20 left-0 w-24 h-24 bg-blue-500/10 rounded-full -translate-x-12"></div>

                {/* Logo Header */}
                <div className="p-8 relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg">
                            <Dumbbell className="w-8 h-8 text-white"/>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white">The RSK Fitness</h1>
                            <p className="text-slate-400 text-sm">Dashboard</p>
                        </div>
                    </div>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 px-6 relative z-10">
                    <div className="space-y-2">
                        {navItems.map(({path, label, icon}) => (
                            <NavItem key={path} path={path} label={label} Icon={icon}/>
                        ))}
                    </div>
                </nav>

                {/* Logout Button */}
                <div className="p-6 relative z-10">
                    <div className="bg-slate-800/50 rounded-2xl p-1 backdrop-blur-sm border border-slate-700/50">
                        <button
                            onClick={logoutUser}
                            className="flex items-center w-full px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-xl transition-all duration-300 group"
                        >
                            <div
                                className="p-2 bg-slate-700/50 rounded-xl mr-4 group-hover:bg-red-500/20 transition-all duration-300">
                                <LogOut className="w-5 h-5 group-hover:text-red-400"/>
                            </div>
                            <span className="font-medium">Logout</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Navigation */}
            <div
                className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg shadow-2xl border-t border-slate-200/50 dark:border-slate-700/50 z-50">
                <nav className="flex justify-around p-1">
                    {navItems.map(({path, label, icon: Icon}) => (
                        <NavLink
                            key={path}
                            to={path}
                            className={({isActive}) =>
                                `flex flex-col items-center p-3 m-1 rounded-2xl transition-all duration-300 min-w-[60px] ${
                                    isActive
                                        ? 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 scale-105'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                                }`
                            }
                        >
                            {({isActive}) => (
                                <>
                                    <div
                                        className={`p-1 rounded-lg transition-all duration-300 ${
                                            isActive ? 'bg-orange-100 dark:bg-orange-900/50' : ''
                                        }`}
                                    >
                                        <Icon className="w-5 h-5"/>
                                    </div>
                                    <span className="text-xs font-medium mt-1">{label}</span>
                                    {isActive && <div className="w-1 h-1 bg-orange-500 rounded-full mt-1"></div>}
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>
            </div>
        </>
    );
}
