import React, { useState, useEffect, useMemo } from "react";
import axiosInstance from "../../../utils/AxiosInstance";
import BarChartWidget from "../../../components/charts/BarChartWidget";
import TopPerformersChart from "../../../components/charts/TopPerformersChart";
import dayjs from "dayjs";
import ExportModal from "../../../components/exports/ExportModal";
import { PiFileCsvBold } from "react-icons/pi";
import isoWeek from "dayjs/plugin/isoWeek";
import quarterOfYear from "dayjs/plugin/quarterOfYear";
import weekOfYear from "dayjs/plugin/weekOfYear";
import { getPeriodArray, formatPeriodLabel } from '../../../utils/periodUtils';
import DownloadReportModal from '../../../components/exports/DownloadReportModal';
import { useAuth } from "../../../context/AuthContext";
dayjs.extend(isoWeek);
dayjs.extend(quarterOfYear);
dayjs.extend(weekOfYear);

function getDateRangeArray(start, end) {
  const arr = [];
  let curr = dayjs(start);
  const last = dayjs(end);
  while (curr.isBefore(last) || curr.isSame(last, "day")) {
    arr.push(curr.format("YYYY-MM-DD"));
    curr = curr.add(1, "day");
  }
  return arr;
}

const gradeColors = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#a832a6"];

const FarmerAnalytics = () => {
  const { user } = useAuth();
  const societyId = user?.managed_society?.id || user?.society?.id || null;
  // Set default date range: last 7 days, ending today
  const today = dayjs().format('YYYY-MM-DD');
  const sevenDaysAgo = dayjs().subtract(6, 'day').format('YYYY-MM-DD');
  const [dateRange, setDateRange] = useState({ start: sevenDaysAgo, end: today, granularity: 'daily' });
  const [excludedGrades, setExcludedGrades] = useState([]);
  const [lineData, setLineData] = useState([]);
  const [topGrades, setTopGrades] = useState([]);
  const [topFactories, setTopFactories] = useState([]);
  const [factories, setFactories] = useState([]);
  const [selectedFactory, setSelectedFactory] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [csvData, setCsvData] = useState([]);
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

  // Fetch factories for this farmer's society
  useEffect(() => {
    axiosInstance
      .get("societies/factories/")
      .then((res) => setFactories(res.data))
      .catch(() => setFactories([]));
  }, []);

  // Fetch main coffee movement data
  useEffect(() => {
    setLoading(true);
    setError(null);
    const params = {
      start_date: dateRange.start,
      end_date: dateRange.end,
      granularity: dateRange.granularity,
      factory: selectedFactory || undefined,
    };
    Object.keys(params).forEach((key) => {
      if (!params[key]) delete params[key];
    });
    axiosInstance
      .get("permits/permits/coffee-analytics/", { params })
      .then((res) => {
        // Handle paginated response
        const data = res.data.results ? res.data.results : res.data;
        setLineData(data);
      })
      .catch(() => setLineData([]))
      .finally(() => setLoading(false));
  }, [dateRange, selectedFactory]);

  // Fetch top grades
  useEffect(() => {
    const params = {
      start_date: dateRange.start,
      end_date: dateRange.end,
      factory: selectedFactory || undefined,
      exclude_grades: excludedGrades.length > 0 ? excludedGrades.join(",") : undefined,
    };
    Object.keys(params).forEach((key) => {
      if (!params[key]) delete params[key];
    });
    axiosInstance
      .get("permits/permits/top-grades/", { params })
      .then((res) => {
        // Handle paginated response
        const data = res.data.results ? res.data.results : res.data;
        setTopGrades(data.slice(0, 3));
      })
      .catch(() => setTopGrades([]));
  }, [dateRange, selectedFactory, excludedGrades]);

  // Fetch top factories
  useEffect(() => {
    const params = {
      start_date: dateRange.start,
      end_date: dateRange.end,
      exclude_grades: excludedGrades.length > 0 ? excludedGrades.join(",") : undefined,
    };
    Object.keys(params).forEach((key) => {
      if (!params[key]) delete params[key];
    });
    axiosInstance
      .get("permits/permits/top-factories/", { params })
      .then((res) => {
        // Handle paginated response
        const data = res.data.results ? res.data.results : res.data;
        setTopFactories(data.slice(0, 3));
      })
      .catch(() => setTopFactories([]));
  }, [dateRange, excludedGrades]);

  const allGrades = useMemo(() => {
    const gradeSet = new Set();
    lineData.forEach((row) => {
      Object.keys(row).forEach((key) => {
        if (key !== "period") gradeSet.add(key);
      });
    });
    return Array.from(gradeSet);
  }, [lineData]);

  const filledLineData = useMemo(() => {
    if (!dateRange.start || !dateRange.end) return lineData;
    const { granularity } = dateRange;
    let periodArr;
    if (granularity === "daily") {
      periodArr = getPeriodArray(dateRange.start, dateRange.end, "daily");
      // periodArr is array of strings
      const dataMap = Object.fromEntries(lineData.map((row) => [row.period, row]));
      return periodArr.map((date) => {
        const base = { period: date };
        allGrades.forEach((grade) => {
          base[grade] = dataMap[date]?.[grade] ?? 0;
        });
        return base;
      });
    } else {
      // weekly, monthly, 90days
      periodArr = getPeriodArray(dateRange.start, dateRange.end, granularity);
      const dataMap = Object.fromEntries(lineData.map((row) => [row.period, row]));
      return periodArr.map(({ key }) => {
        const base = { period: key };
        allGrades.forEach((grade) => {
          base[grade] = dataMap[key]?.[grade] ?? 0;
        });
        return base;
      });
    }
  }, [lineData, dateRange, allGrades]);

  const handleGradeToggle = (grade) => {
    setExcludedGrades((prev) =>
      prev.includes(grade) ? prev.filter((g) => g !== grade) : [...prev, grade]
    );
  };

  // Axis config for TopPerformersChart
  const getNiceDomainAndTicks = (data, dataKey, minTicks = 4, step = 1000) => {
    if (!data || data.length === 0)
      return { domain: [0, step], tickCount: minTicks };
    const max = Math.max(...data.map((d) => d[dataKey] || 0));
    if (max === 0) return { domain: [0, step], tickCount: minTicks };
    const niceStep = step || Math.pow(10, Math.floor(Math.log10(max)));
    const niceMax = Math.ceil(max / niceStep) * niceStep;
    const tickCount = Math.max(minTicks, Math.ceil(niceMax / niceStep) + 1);
    return { domain: [0, niceMax], tickCount };
  };
  const gradesAxis = getNiceDomainAndTicks(topGrades, "totalKg");
  const factoriesAxis = getNiceDomainAndTicks(topFactories, "totalKg");

  // Filter topGrades to exclude selected grades
  const filteredTopGrades = topGrades
    .filter((g) => !excludedGrades.includes(g.grade))
    .sort((a, b) => b.totalKg - a.totalKg)
    .slice(0, 3);

  // Filter out invalid data for charts
  const validFilteredTopGrades = filteredTopGrades.filter(
    item => typeof item.totalKg === 'number' && !isNaN(item.totalKg)
  );
  const validFilteredTopFactories = topFactories.filter(
    item => typeof item.totalKg === 'number' && !isNaN(item.totalKg)
  );

  // If backend supports grade filtering for factories, apply similar logic here
  const filteredTopFactories = topFactories;

  const prepareExportData = () => {
    // Only include grades that are not excluded
    const includedGrades = allGrades.filter(grade => !excludedGrades.includes(grade));

    const barChartRows = filledLineData.map(row => ({
      period: row.period,
      ...includedGrades.reduce((acc, grade) => ({ ...acc, [grade]: row[grade] }), {})
    }));

    const topFactoriesRows = topFactories.map(f => ({
      type: "Top Factory",
      factory: f.factory,
      totalKg: f.totalKg
    }));

    const topGradesRows = topGrades.map(g => ({
      type: "Top Grade",
      grade: g.grade,
      totalKg: g.totalKg
    }));

    // Combine all for preview/export
    const combined = [
      ...barChartRows,
      ...topFactoriesRows,
      ...topGradesRows
    ];

    // Set headers based on keys of the first row
    const headers = combined.length > 0
      ? Object.keys(combined[0]).map(key => ({ label: key, key }))
      : [];

    setCsvData(combined);
    setCsvHeaders(headers);
  };

  const handleExportClick = () => {
    prepareExportData();
    setIsExportModalOpen(true);
  };

  return (
    <div className="space-y-6 bg-amber-50 min-h-screen p-2 sm:p-4 md:p-6">
      <h1 className="text-xl sm:text-2xl font-bold mb-2">Society Analytics</h1>
      <p className="text-gray-600 mb-4 text-sm sm:text-base">
        Access detailed analytics and download reports to manage your society effectively.
      </p>
      <div className="flex flex-col sm:flex-row justify-end gap-2 mb-4">
        {/* Export Button */}
        <button
          className="flex items-center justify-center gap-1 px-4 py-2 rounded border border-gray-300 bg-white text-gray-700 font-medium shadow-sm hover:bg-gray-100 transition w-full sm:w-auto"
          onClick={handleExportClick}
        >
          <PiFileCsvBold className="w-5 h-5 text-amber-600" />
          Export
        </button>
        {/* Download Report Button */}
        <button
          className="flex items-center justify-center gap-1 px-4 py-2 rounded border border-gray-300 bg-white text-amber-700 font-medium shadow-sm hover:bg-amber-100 transition w-full sm:w-auto"
          onClick={() => setIsDownloadModalOpen(true)}
        >
          <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v12m0 0l-4-4m4 4l4-4" />
          </svg>
          Download Report
        </button>
      </div>
      
      {/* Filter Bar */}
      <div className="bg-white rounded-lg p-4 sm:p-6 mb-4 shadow-sm overflow-x-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Factory */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Factory</label>
            <select
              className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-amber-600 focus:ring-2 focus:ring-amber-200 text-sm"
              value={selectedFactory}
              onChange={e => setSelectedFactory(e.target.value)}
            >
              <option value="">All Factories</option>
              {factories.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="date"
                className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-amber-600 focus:ring-2 focus:ring-amber-200 text-sm"
                value={dateRange.start}
                onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
              />
              <input
                type="date"
                className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-amber-600 focus:ring-2 focus:ring-amber-200 text-sm"
                value={dateRange.end}
                onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
              />
            </div>
          </div>
          {/* Granularity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Granularity</label>
            <select
              className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-amber-600 focus:ring-2 focus:ring-amber-200 text-sm"
              value={dateRange.granularity}
              onChange={e => setDateRange({ ...dateRange, granularity: e.target.value })}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="90days">90 Days</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          {/* Exclude Coffee Grades */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Exclude Coffee Grades</label>
            <div className="flex flex-wrap gap-2">
              {allGrades.map((grade) => (
                <label key={grade} className="flex items-center space-x-1">
                  <input
                    type="checkbox"
                    checked={excludedGrades.includes(grade)}
                    onChange={() => handleGradeToggle(grade)}
                    className="accent-amber-600"
                  />
                  <span>{grade}</span>
                </label>
              ))}
            </div>
          </div>
          {/* Clear Filters Button */}
          <div className="flex justify-end mt-4 md:mt-0">
            <button
              onClick={() => {
                setSelectedFactory('');
                setDateRange({ start: sevenDaysAgo, end: today, granularity: 'daily' });
                setExcludedGrades([]);
              }}
              className="px-4 py-2 rounded bg-amber-200 text-amber-800 font-semibold hover:bg-amber-300 cursor-pointer w-full sm:w-auto"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Main Bar Chart */}
      <div className="mb-8 overflow-x-auto">
        {loading ? (
          <BarChartWidget
            data={[]}
            xAxisKey="period"
            yAxisKeys={allGrades.filter(
              (grade) => !excludedGrades.includes(grade)
            )}
            colors={gradeColors}
            title="My Coffee Transported Over Time"
            height={350}
            barProps={{
              isAnimationActive: false,
            }}
            xTickFormatter={period => formatPeriodLabel(period, dateRange.granularity)}
          />
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : filledLineData.length === 0 ? (
          <div className="text-gray-500 text-center py-8">
            No data available for current filters.
          </div>
        ) : (
          <BarChartWidget
            data={filledLineData}
            xAxisKey="period"
            yAxisKeys={allGrades.filter(
              (grade) => !excludedGrades.includes(grade)
            )}
            colors={gradeColors}
            title="My Coffee Transported Over Time"
            height={350}
            barProps={{
              isAnimationActive: false,
            }}
            xTickFormatter={period => formatPeriodLabel(period, dateRange.granularity)}
          />
        )}
      </div>

      {/* Top 3 Coffee Grades and Top 3 Factories for this Society */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
        {/* Top 3 Coffee Grades */}
        <div className="bg-white rounded-lg shadow p-4 flex flex-col justify-center overflow-x-auto">
          <TopPerformersChart
            data={validFilteredTopGrades}
            valueKey="totalKg"
            nameKey="grade"
            barColor="#8884d8"
            title="Top Performing Coffee Grades"
            xAxisLabel="Total Weight (KGs)"
            yAxisLabel="Grade"
          />
        </div>
        {/* Top 3 Factories */}
        <div className="bg-white rounded-lg shadow p-4 flex flex-col justify-center overflow-x-auto">
          <TopPerformersChart
            data={validFilteredTopFactories}
            valueKey="totalKg"
            nameKey="factory"
            barColor="#82ca9d"
            title="Top Performing Factories"
            xAxisLabel="Total Weight (KGs)"
            yAxisLabel="Factory"
          />
        </div>
      </div>

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        data={csvData}
        headers={csvHeaders}
        filename="society-analytics-export.csv"
        title="Preview Export Data"
        description="Below is a preview of the data you are about to export as CSV."
      />

      <DownloadReportModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
        dataSections={{
          main: filledLineData.map(row => {
            // Remove excluded grades from each row for preview/export
            const filteredRow = { period: row.period };
            allGrades.forEach(grade => {
              if (!excludedGrades.includes(grade)) {
                filteredRow[grade] = row[grade];
              }
            });
            return filteredRow;
          }),
          topFactories: topFactories,
          topGrades: topGrades,
          start_date: dateRange.start,
          end_date: dateRange.end,
          granularity: dateRange.granularity,
          society_id: societyId,
          exclude_grades: excludedGrades,
        }}
        defaultFileName="Farmer-Analytics-Report"
      />
    </div>
  );
};

export default FarmerAnalytics;
