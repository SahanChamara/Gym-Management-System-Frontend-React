import { useState, useEffect, useMemo } from "react";
import { Search, Filter, Calendar, Clock, UserCheck } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { type IDetectedBarcode } from "@yudiel/react-qr-scanner";
import Sidebar from "../components/Sidebar.tsx";
import QRScannerModal from "../components/QRScannerModal.tsx";
import { addAttendance, getAttendances } from "../services/api";
import type { Attendance } from "../types";
import { io } from "socket.io-client";

export default function Attendance() {
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [timeFilter, setTimeFilter] = useState<
    "today" | "thisWeek" | "thisMonth" | "all"
  >("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState({ startDate: "", endDate: "" });
  const [showCamera, setShowCamera] = useState(false);

  // New: toggle to show only latest per member
  const [showLatestOnly, setShowLatestOnly] = useState(false);

  useEffect(() => {
    const socket = io("https://api.rskfitness.technook.lk");

    socket.on("attendanceUpdate", (attendance) => {
      console.log("Attendance Return on Backend Socket", attendance);

      if (attendance.success) {
        toast.success(
          `Attendance recorded for member ${attendance.data.name}`,
          { position: "top-right" }
        );
        fetchAttendances();
      } else {
        toast.error(attendance.data.message || "Attendance Mark Failed", {
          position: "top-right",
        });
      }
    });

    fetchAttendances();

    return () => {
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  interface ApiError extends Error {
    response?: {
      data?: {
        message?: string;
      };
    };
  }

  const fetchAttendances = async () => {
    setLoading(true);
    try {
      const attendanceData = await getAttendances();
      const formattedAttendances: Attendance[] = attendanceData.map(
        (att: Attendance) => ({
          ...att,
          name: att.name || "N/A",
          mobileNumber: att.mobileNumber || "N/A",
          nicNumber: att.nicNumber || "N/A",
          timeOut: att.timeOut || "N/A",
        })
      );
      setAttendances(formattedAttendances);
    } catch (error) {
      console.error("Error fetching attendances:", error);
      toast.error("Failed to fetch attendance records", {
        position: "top-right",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQRScan = async (detectedCodes: IDetectedBarcode[]) => {
    if (!detectedCodes || detectedCodes.length === 0) {
      toast.error("No QR code detected", { position: "top-right" });
      return;
    }

    const data = detectedCodes[0].rawValue;
    if (!data) {
      toast.error("Invalid QR code data", { position: "top-right" });
      return;
    }

    const memberIdMatch = data.match(/memberId:\s*([a-f0-9]{24})/i);
    if (!memberIdMatch) {
      toast.error("Member ID not found in QR code", { position: "top-right" });
      return;
    }

    const memberId = memberIdMatch[1];
    try {
      await addAttendance(memberId, {
        timeIn: new Date().toISOString(),
        timeOut: null,
        status: "Present",
      });
      toast.success(`Attendance recorded for member ID ${memberId}`, {
        position: "top-right",
      });
      fetchAttendances();
    } catch (error: unknown) {
      console.error("Error recording attendance:", error);
      const errorMessage =
        error instanceof Error && "response" in error
          ? (error as ApiError).response?.data?.message ||
          "Something went wrong"
          : "Something went wrong";
      toast.error(errorMessage, { position: "top-right" });
      setShowCamera(false);
    }
  };

  const handleScanButtonClick = () => {
    setShowCamera(true);
  };

  /**
   * Helper: returns a numeric timestamp (ms) representing the "time" of an attendance record.
   * Priority:
   *  1. ISO timeIn (most common)
   *  2. Combined date + timeIn if timeIn is short "HH:mm" (local)
   *  3. date only
   *  4. fallback: 0
   */
  const getAttendanceTimestamp = (a: Attendance) => {
    // prefer ISO timeIn
    if (a.timeIn && a.timeIn !== "N/A") {
      const t = new Date(a.timeIn);
      if (!isNaN(t.getTime())) return t.getTime();
    }

    // if timeIn is "HH:mm" (no date) try combining
    if (a.date && a.timeIn && /^\d{1,2}:\d{2}(:\d{2})?$/.test(a.timeIn)) {
      // ensure date is like YYYY-MM-DD or parseable
      const combined = new Date(`${a.date}T${a.timeIn}`);
      if (!isNaN(combined.getTime())) return combined.getTime();
    }

    // fallback to date only
    if (a.date) {
      const d = new Date(a.date);
      if (!isNaN(d.getTime())) return d.getTime();
    }

    return 0;
  };

  const filteredAttendances = useMemo(() => {
    let filtered = [...attendances];
    const now = new Date();
    if (timeFilter === "today") {
      const today = now.toISOString().split("T")[0];
      filtered = filtered.filter((att) => att.date === today);
    } else if (timeFilter === "thisWeek") {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(now);
      weekEnd.setDate(now.getDate() - now.getDay() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      filtered = filtered.filter((att) => {
        const attDate = new Date(att.date);
        return attDate >= weekStart && attDate <= weekEnd;
      });
    } else if (timeFilter === "thisMonth") {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      monthStart.setHours(0, 0, 0, 0);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      monthEnd.setHours(23, 59, 59, 999);
      filtered = filtered.filter((att) => {
        const attDate = new Date(att.date);
        return attDate >= monthStart && attDate <= monthEnd;
      });
    }

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (att) =>
          (att.memberId || "").toLowerCase().includes(lower) ||
          (att.name || "").toLowerCase().includes(lower) ||
          (att.nicNumber || "N/A").toLowerCase().includes(lower) ||
          (att.mobileNumber || "N/A").toLowerCase().includes(lower)
      );
    }

    if (dateFilter.startDate || dateFilter.endDate) {
      filtered = filtered.filter((att) => {
        const attDate = new Date(att.date);
        const startDate = dateFilter.startDate
          ? new Date(dateFilter.startDate)
          : null;
        const endDate = dateFilter.endDate ? new Date(dateFilter.endDate) : null;

        if (startDate && endDate) {
          // include whole day ranges
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);
          return attDate >= startDate && attDate <= endDate;
        } else if (startDate) {
          startDate.setHours(0, 0, 0, 0);
          return attDate >= startDate;
        } else if (endDate) {
          endDate.setHours(23, 59, 59, 999);
          return attDate <= endDate;
        }
        return true;
      });
    }

    return filtered;
  }, [attendances, searchTerm, dateFilter, timeFilter]);

  // Sorted attendances (all filtered records, latest first)
  const sortedAttendances = useMemo(() => {
    return [...filteredAttendances].sort((a, b) => {
      const ta = getAttendanceTimestamp(a);
      const tb = getAttendanceTimestamp(b);
      return tb - ta; // descending (latest first)
    });
  }, [filteredAttendances]);

  // Latest per-member (deduped) — keeps single latest attendance per memberId
  const latestPerMember = useMemo(() => {
    const map = new Map<string, Attendance>();
    for (const att of filteredAttendances) {
      const existing = map.get(att.memberId);
      const candidateTime = getAttendanceTimestamp(att);
      if (!existing) {
        map.set(att.memberId, att);
      } else {
        const existingTime = getAttendanceTimestamp(existing);
        if (candidateTime > existingTime) {
          map.set(att.memberId, att);
        }
      }
    }
    const result = Array.from(map.values()).sort((a, b) => {
      const ta = getAttendanceTimestamp(a);
      const tb = getAttendanceTimestamp(b);
      return tb - ta;
    });
    return result;
  }, [filteredAttendances]);

  // Which array to display depends on the toggle
  const displayedAttendances = showLatestOnly ? latestPerMember : sortedAttendances;

  const clearFilters = () => {
    setSearchTerm("");
    setDateFilter({ startDate: "", endDate: "" });
    setTimeFilter("all");
  };

  const hasActiveFilters =
    Boolean(searchTerm) ||
    Boolean(dateFilter.startDate) ||
    Boolean(dateFilter.endDate) ||
    timeFilter !== "all";

  const renderTable = (attendancesToShow: Attendance[]) => (
    <div className="overflow-auto max-h-[80vh]">
      <table className="w-full min-w-[640px]">
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-700/50 border-b dark:border-slate-600">
            <th className="py-4 px-6 text-left text-sm font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
              Member
            </th>
            <th className="py-4 px-6 text-left text-sm font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider hidden sm:table-cell">
              NIC Number
            </th>
            <th className="py-4 px-6 text-left text-sm font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider hidden sm:table-cell">
              Mobile Number
            </th>
            <th className="py-4 px-6 text-left text-sm font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
              Date
            </th>
            <th className="py-4 px-6 text-left text-sm font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
              Time In
            </th>
            <th className="py-4 px-6 text-left text-sm font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
              Time Out
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
          {attendancesToShow.map((att, index) => (
            <tr
              key={att.attendanceId}
              className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${index % 2 === 0
                  ? "bg-white dark:bg-slate-800"
                  : "bg-slate-50/50 dark:bg-slate-800/50"
                }`}
            >
              <td className="py-4 px-6 font-medium text-slate-900 dark:text-white">
                {att.name || "N/A"}
              </td>
              <td className="py-4 px-6 hidden sm:table-cell text-slate-600 dark:text-slate-300 font-mono text-sm">
                {att.nicNumber || "N/A"}
              </td>
              <td className="py-4 px-6 hidden sm:table-cell text-slate-600 dark:text-slate-300 font-mono text-sm">
                {att.mobileNumber || "N/A"}
              </td>
              <td className="py-4 px-6 text-slate-600 dark:text-slate-300">
                {new Date(att.timeIn).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </td>
              <td className="py-4 px-6">
                <div
                  className="inline-block px-4 py-1 rounded-full border border-green-500 bg-green-600 bg-opacity-20 text-green-800 dark:text-green-300 font-medium text-sm shadow-sm"
                  title={att.timeIn}
                >
                  {att.timeIn && att.timeIn !== "N/A"
                    ? new Date(att.timeIn).toLocaleTimeString("en-US", {
                      timeZone: "Asia/Colombo",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                    : // if timeIn missing but date exists, show date-only time (00:00) as '—'
                    "N/A"}
                </div>
              </td>
              <td className="py-4 px-6">
                <div
                  className="inline-block px-4 py-1 rounded-full border border-red-500 bg-red-600 bg-opacity-20 text-red-800 dark:text-red-300 font-medium text-sm shadow-sm"
                  title={att.timeOut || "No time out recorded"}
                >
                  {att.timeOut && att.timeOut !== "N/A"
                    ? new Date(att.timeOut).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                    : "N/A"}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

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
      <div className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 dark:text-white mb-2">
              Attendance
            </h1>
            <p className="text-slate-600 dark:text-slate-300 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {displayedAttendances.length} of {attendances.length} attendance
              records shown
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 rounded-xl flex items-center transition-all duration-200 ${hasActiveFilters
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                  : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                }`}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
              {hasActiveFilters && (
                <span className="ml-2 bg-blue-500 text-white text-xs rounded-full px-2 py-0.5">
                  Active
                </span>
              )}
            </button>

            {/* Toggle: Latest per-member */}
            <button
              onClick={() => setShowLatestOnly((v) => !v)}
              title="Toggle latest per member"
              className={`px-3 py-2 rounded-xl flex items-center transition-all duration-200 border ${showLatestOnly
                  ? "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300"
                  : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                }`}
            >
              <Clock className="w-4 h-4 mr-2" />
              Latest per member
            </button>

            <button
              onClick={handleScanButtonClick}
              disabled={loading}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-xl flex items-center shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 dark:shadow-orange-500/25 disabled:opacity-50"
            >
              <UserCheck className="w-5 h-5 mr-2" />
              Scan Attendance
            </button>
          </div>
        </div>

        {showCamera && (
          <QRScannerModal
            onScan={handleQRScan}
            onClose={() => setShowCamera(false)}
          />
        )}

        {showFilters && (
          <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-2xl shadow-lg p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Search by Member
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search by ID, name, NIC, or mobile..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Time Period
                </label>
                <select
                  value={timeFilter}
                  onChange={(e) =>
                    setTimeFilter(
                      e.target.value as
                      | "today"
                      | "thisWeek"
                      | "thisMonth"
                      | "all"
                    )
                  }
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="thisWeek">This Week</option>
                  <option value="thisMonth">This Month</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  <Calendar className="inline w-4 h-4 mr-1" />
                  From Date
                </label>
                <input
                  type="date"
                  value={dateFilter.startDate}
                  onChange={(e) =>
                    setDateFilter((prev) => ({
                      ...prev,
                      startDate: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  <Calendar className="inline w-4 h-4 mr-1" />
                  To Date
                </label>
                <input
                  type="date"
                  value={dateFilter.endDate}
                  onChange={(e) =>
                    setDateFilter((prev) => ({
                      ...prev,
                      endDate: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>
            {hasActiveFilters && (
              <div className="flex justify-between items-center mt-4 pt-4 border-t dark:border-slate-700">
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Showing {displayedAttendances.length} of {attendances.length}{" "}
                  attendance records
                </span>
                <button
                  onClick={clearFilters}
                  className="text-sm text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300 font-medium"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        )}

        <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-2xl shadow-xl dark:shadow-slate-900/50 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
              <span className="ml-3 text-slate-600 dark:text-slate-300">
                Loading attendance...
              </span>
            </div>
          ) : displayedAttendances.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-slate-400 dark:text-slate-500 mb-4">
                {hasActiveFilters ? (
                  <Filter className="w-16 h-16 mx-auto mb-4 opacity-50" />
                ) : (
                  <Clock className="w-16 h-16 mx-auto mb-4 opacity-50" />
                )}
              </div>
              <h3 className="text-xl font-semibold text-slate-600 dark:text-slate-300 mb-2">
                {hasActiveFilters
                  ? "No attendance records match your filters"
                  : "No attendance records found"}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mb-4">
                {hasActiveFilters
                  ? "Try adjusting your search criteria or clear filters"
                  : "Scan a QR code to record attendance"}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300 font-medium"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            renderTable(displayedAttendances)
          )}
        </div>
      </div>
    </div>
  );
}