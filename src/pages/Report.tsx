"use client";

import React, { useEffect, useState } from "react";
import { Users, Activity, DollarSign, Clock, TrendingUp } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { toast, ToastContainer } from "react-toastify";
import Sidebar from "../components/Sidebar";
import { getAttendanceReport, getRevenueReport, getStats } from "../services/api";

// ------------------ Card Components ------------------ //
interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className }) => (
  <div
    className={`relative overflow-hidden rounded-2xl border border-slate-700 bg-slate-800 shadow-lg ${className}`}
  >
    {children}
  </div>
);

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ElementType;
  trend?: number;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
}) => (
  <Card>
    <div className="relative p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 rounded-xl bg-orange-500/20">
          <Icon className="w-6 h-6 text-orange-500" />
        </div>
        {trend !== undefined && (
          <div
            className={`flex items-center ${
              trend >= 0 ? "text-green-400" : "text-red-400"
            }`}
          >
            <TrendingUp className="w-4 h-4 mr-1" />
            <span className="text-sm font-medium">
              {trend > 0 ? "+" : ""}
              {trend}%
            </span>
          </div>
        )}
      </div>
      <h3 className="text-sm font-medium text-gray-400 mb-1">{title}</h3>
      <p className="text-2xl font-bold text-white mb-1">{value}</p>
      <p className="text-sm text-gray-500">{subtitle}</p>
    </div>
  </Card>
);

// ------------------ Reports Page ------------------ //
const Reports: React.FC = () => {

  const [filter, setFilter] = useState<"week" | "month" | "year">("month");
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    todayAttendance: 0,
    thisMonthRevenue: 0,
    attendanceGrowth: 0,
    revenueGrowth: 0,
  })

  const [attendanceData, setattendanceData] = useState([]);
  const [revenueData, setRevenueData] = useState([]);

  useEffect(() => {
    fetchStats()
    fetchAttendanceReportData();
    fetchRevenueReportData();
  },[filter])

  const fetchStats = async () => {
    try{
      const stats = await getStats();
      console.log("stats Data", stats);
      
      setStats(stats);
    }catch(e){
      console.log("stats error", e);      
      toast.error('Stats Fetch Failed...')
    }
  };

  const fetchAttendanceReportData = async () => {
    try{
      const attendanceReportData = await getAttendanceReport(filter);
      console.log("Attendance Report Data", attendanceReportData);
      setattendanceData(attendanceReportData);
    }catch(e) {
      console.log("Attendance Report Data Fetch Failed...",e);
      toast.error("Attendance Report Data Fetch Error");      
    }
  };

  const fetchRevenueReportData = async () => {
    try{
      const revenueReportData = await getRevenueReport(filter);
      console.log("Revenue report Data", revenueReportData);
      setRevenueData(revenueReportData);
    }catch(e){
      console.log("Revenue Report Data Fetch Failed...", e);
      toast.error("Revenue Data Report Fetch Error"); 
    }
  }

  /* // Demo stats
  const stats = {
    totalMembers: 0,
    activeMembers: 0,
    todayAttendance: 0,
    thisMonthRevenue: 0,
    attendanceGrowth: 0,
    revenueGrowth: 0,
  }; */

  // Revenue datasets
  /* const revenueData = {
    week: [
      { label: "Mon", revenue: 1200 },
      { label: "Tue", revenue: 1500 },
      { label: "Wed", revenue: 1800 },
      { label: "Thu", revenue: 1700 },
      { label: "Fri", revenue: 2000 },
      { label: "Sat", revenue: 2200 },
      { label: "Sun", revenue: 1600 },
    ],
    month: [
      { label: "Week 1", revenue: 8000 },
      { label: "Week 2", revenue: 9500 },
      { label: "Week 3", revenue: 11000 },
      { label: "Week 4", revenue: 12500 },
    ],
    year: [
      { label: "Jan", revenue: 8000 },
      { label: "Feb", revenue: 9500 },
      { label: "Mar", revenue: 11000 },
      { label: "Apr", revenue: 12500 },
      { label: "May", revenue: 14200 },
      { label: "Jun", revenue: 16000 },
      { label: "Jul", revenue: 17500 },
      { label: "Aug", revenue: 18500 },
      { label: "Sep", revenue: 19000 },
      { label: "Oct", revenue: 21000 },
      { label: "Nov", revenue: 22000 },
      { label: "Dec", revenue: 24000 },
    ],
  }; */

  // Attendance datasets
  /* const attendanceData = {
    week: [
      { label: "Mon", members: 42 },
      { label: "Tue", members: 38 },
      { label: "Wed", members: 51 },
      { label: "Thu", members: 47 },
      { label: "Fri", members: 54 },
      { label: "Sat", members: 62 },
      { label: "Sun", members: 40 },
    ],
    month: [
      { label: "Week 1", members: 280 },
      { label: "Week 2", members: 310 },
      { label: "Week 3", members: 295 },
      { label: "Week 4", members: 330 },
    ],
    year: [
      { label: "Jan", members: 1250 },
      { label: "Feb", members: 1320 },
      { label: "Mar", members: 1420 },
      { label: "Apr", members: 1500 },
      { label: "May", members: 1600 },
      { label: "Jun", members: 1700 },
      { label: "Jul", members: 1800 },
      { label: "Aug", members: 1750 },
      { label: "Sep", members: 1650 },
      { label: "Oct", members: 1850 },
      { label: "Nov", members: 1900 },
      { label: "Dec", members: 2000 },
    ],
  }; */

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Reports & Analytics</h1>

        {/* Filter Dropdown */}
        <select
          value={filter}
          onChange={(e) =>
            setFilter(e.target.value as "week" | "month" | "year")
          }
          className="bg-slate-800 text-white text-sm rounded-lg px-3 py-2 border border-slate-700 focus:outline-none"
        >
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
        </select>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 py-10">
        <StatCard
          title="Total Members"
          value={stats.totalMembers}
          subtitle={`${stats.activeMembers} active members`}
          icon={Users}
          trend={12.5}
        />
        <StatCard
          title="Today's Attendance"
          value={stats.todayAttendance}
          subtitle="Members checked in today"
          icon={Activity}
          trend={stats.attendanceGrowth}
        />
        <StatCard
          title="Monthly Revenue"
          value={`LKR ${stats.thisMonthRevenue.toLocaleString()}`}
          subtitle="This month's earnings"
          icon={DollarSign}
          trend={stats.revenueGrowth}
        />
        <StatCard
          title="Average Daily Visits"
          value="47"
          subtitle="Last 30 days average"
          icon={Clock}
          trend={8.2}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Line Chart */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Revenue</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
              <XAxis dataKey="label" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #334155",
                  color: "#fff",
                }}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#f97316"
                strokeWidth={3}
                dot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Attendance Bar Chart */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Attendance</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={attendanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
              <XAxis dataKey="label" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #334155",
                  color: "#fff",
                }}
              />
              <Bar dataKey="members" fill="#f97316" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
      </div>
    </div>
  );
};

export default Reports;