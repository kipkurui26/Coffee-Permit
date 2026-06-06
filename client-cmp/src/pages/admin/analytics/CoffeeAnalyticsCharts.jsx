import axiosInstance from '../../../utils/AxiosInstance';
import React, { useState, useEffect } from 'react';
import PermitAnalyticsCharts from './PermitAnalyticsCharts';
import dayjs from 'dayjs';
import BarChartWidget from '../../../components/charts/BarChartWidget';
import TopPerformersChart from '../../../components/charts/TopPerformersChart';
import ExportModal from '../../../components/exports/ExportModal';
import weekOfYear from "dayjs/plugin/weekOfYear";
import isoWeek from "dayjs/plugin/isoWeek";
import quarterOfYear from "dayjs/plugin/quarterOfYear";
import { PiFileCsvBold } from "react-icons/pi";
import { FiDownload } from "react-icons/fi";
import { getPeriodArray, formatPeriodLabel } from '../../../utils/periodUtils';
import DownloadReportModal from '../../../components/exports/DownloadReportModal';
import { useAuth } from '../../../context/AuthContext';

dayjs.extend(weekOfYear);
dayjs.extend(isoWeek);
dayjs.extend(quarterOfYear);

function getDateRangeArray(start, end) {
  const arr = [];
  let curr = dayjs(start);
  const last = dayjs(end);
  while (curr.isBefore(last) || curr.isSame(last, 'day')) {
    arr.push(curr.format('YYYY-MM-DD'));
    curr = curr.add(1, 'day');
  }
  return arr;
}

// Function to calculate the X-axis and Y-axis
function getNiceDomainAndTicks(data, dataKey, minTicks = 4, step = 1000) {
  if (!data || data.length === 0) return { domain: [0, step], tickCount: minTicks };
  const max = Math.max(...data.map(d => Number(d[dataKey]) || 0));
  if (!isFinite(max) || max <= 0) return { domain: [0, step], tickCount: minTicks };
  const niceStep = step || Math.pow(10, Math.floor(Math.log10(max)));
  const niceMax = Math.ceil(max / niceStep) * niceStep;
  const tickCount = Math.max(minTicks, Math.ceil(niceMax / niceStep) + 1);
  return { domain: [0, niceMax], tickCount };
}

// Simple ErrorBoundary for chart sections
class ChartErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  componentDidCatch(error, errorInfo) {
    // You can log error here
    console.error('Chart error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return <div className="text-red-500">Chart failed to load</div>;
    }
    return this.props.children;
  }
}

const Spinner = () => (
  <div className="flex justify-center items-center py-8">
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-600"></div>
    <span className="ml-2 text-amber-700">Loading...</span>
  </div>
);

const CoffeeAnalysisCharts = () => {
  const { user } = useAuth();

  // Filter state
  const [selectedSociety, setSelectedSociety] = useState('');
  const [selectedFactory, setSelectedFactory] = useState('');
  // Set default date range: last 7 days, ending today
  const today = dayjs().format('YYYY-MM-DD');
  const sevenDaysAgo = dayjs().subtract(6, 'day').format('YYYY-MM-DD');
  const [dateRange, setDateRange] = useState({ start: sevenDaysAgo, end: today, granularity: 'daily' });
  const [excludedGrades, setExcludedGrades] = useState([]);
  const [lineData, setLineData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [societiesList, setSocietiesList] = useState([]);
  const [factoriesList, setFactoriesList] = useState([]);
  const [topMovers, setTopMovers] = useState([]);
  const [topGrades, setTopGrades] = useState([]);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [csvData, setCsvData] = useState([]);
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

  // Pagination state for top_grades
  const [gradesPage, setGradesPage] = useState(1);
  const [gradesPageSize, setGradesPageSize] = useState(100);

  // Pagination state for top_factories
  const [factoriesPage, setFactoriesPage] = useState(1);
  const [factoriesPageSize, setFactoriesPageSize] = useState(100);

  // Handlers for filters
  const handleGradeToggle = (grade) => {
    setExcludedGrades((prev) =>
      prev.includes(grade) ? prev.filter((g) => g !== grade) : [...prev, grade]
    );
  };

  // Main analytics data fetch
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = {
          start_date: dateRange.start,
          end_date: dateRange.end,
          granularity: dateRange.granularity,
          society: selectedSociety || undefined,
          factory: selectedFactory || undefined,
        };
        Object.keys(params).forEach(key => {
          if (!params[key]) delete params[key];
        });
        const response = await axiosInstance.get('permits/permits/coffee-analytics/', { params });
        const data = response.data.results ? response.data.results : response.data;
        setLineData(data);
      } catch (err) {
        setError('Failed to load analytics data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [dateRange, selectedSociety, selectedFactory]);

  useEffect(() => {
    // Fetch societies
    axiosInstance.get('societies/admin/societies/')
      .then(res => setSocietiesList(res.data))
      
      .catch(() => setSocietiesList([]));
    // Fetch factories
    axiosInstance.get('societies/factories/')
      .then(res => setFactoriesList(res.data))
      .catch(() => setFactoriesList([]));
  }, []);

  // Top societies fetch
  useEffect(() => {
    const fetchTopSocieties = async () => {
      try {
        const params = {
          start_date: dateRange.start,
          end_date: dateRange.end,
          society: selectedSociety || undefined,
          factory: selectedFactory || undefined,
        };
        Object.keys(params).forEach(key => {
          if (!params[key]) delete params[key];
        });
        const moversRes = await axiosInstance.get('permits/permits/top-societies/', { params });
        const moversData = moversRes.data.results ? moversRes.data.results : moversRes.data;
        setTopMovers(moversData);
      } catch (err) {
        setTopMovers([]);
      }
    };
    fetchTopSocieties();
  }, [dateRange, selectedSociety, selectedFactory]);

  // Top grades fetch
  useEffect(() => {
    const fetchTopGrades = async () => {
      try {
        const params = {
          start_date: dateRange.start,
          end_date: dateRange.end,
          society: selectedSociety || undefined,
          factory: selectedFactory || undefined,
          page: gradesPage,
          page_size: gradesPageSize,
        };
        Object.keys(params).forEach(key => {
          if (!params[key]) delete params[key];
        });
        const gradesRes = await axiosInstance.get('permits/permits/top-grades/', { params });
        const gradesData = gradesRes.data.results ? gradesRes.data.results : gradesRes.data;
        setTopGrades(gradesData);
      } catch (err) {
        setTopGrades([]);
      }
    };
    fetchTopGrades();
  }, [dateRange, selectedSociety, selectedFactory, gradesPage, gradesPageSize]);

  // Top factories fetch
  useEffect(() => {
    const fetchTopFactories = async () => {
      try {
        const params = {
          start_date: dateRange.start,
          end_date: dateRange.end,
          society: selectedSociety || undefined,
          factory: selectedFactory || undefined,
          page: factoriesPage,
          page_size: factoriesPageSize,
        };
        Object.keys(params).forEach(key => {
          if (!params[key]) delete params[key];
        });
        const factoriesRes = await axiosInstance.get('permits/permits/top-factories/', { params });
        const factoriesData = factoriesRes.data.results ? factoriesRes.data.results : factoriesRes.data;
        // No need to set topFactories as it's no longer used
      } catch (err) {
        // No need to set topFactories as it's no longer used
      }
    };
    fetchTopFactories();
  }, [dateRange, selectedSociety, selectedFactory, factoriesPage, factoriesPageSize]);

  const allGrades = React.useMemo(() => {
    const gradeSet = new Set();
    lineData.forEach(row => {
      Object.keys(row).forEach(key => {
        if (key !== 'period') gradeSet.add(key);
      });
    });
    return Array.from(gradeSet);
  }, [lineData]);

  const filledLineData = React.useMemo(() => {
    if (!dateRange.start || !dateRange.end) return lineData;
    const { granularity } = dateRange;
    let periodArr;
    if (granularity === "daily") {
      periodArr = getPeriodArray(dateRange.start, dateRange.end, "daily");
      const dataMap = Object.fromEntries(lineData.map(row => [row.period, row]));
      return periodArr.map(date => {
        const base = { period: date };
        allGrades.forEach(grade => {
          let value = dataMap[date]?.[grade];
          base[grade] = (value === undefined || value === null || isNaN(Number(value))) ? 0 : Number(value);
        });
        return base;
      });
    } else {
      periodArr = getPeriodArray(dateRange.start, dateRange.end, granularity);
      const dataMap = Object.fromEntries(lineData.map(row => [row.period, row]));
      return periodArr.map(({ key }) => {
        const base = { period: key };
        allGrades.forEach(grade => {
          let value = dataMap[key]?.[grade];
          base[grade] = (value === undefined || value === null || isNaN(Number(value))) ? 0 : Number(value);
        });
        return base;
      });
    }
  }, [lineData, dateRange, allGrades]);

  const filteredFactories = selectedSociety
    ? factoriesList.filter(f => String(f.society) === String(selectedSociety))
    : factoriesList;

  const moversAxis = getNiceDomainAndTicks(topMovers, "totalKg");
  const gradesAxis = getNiceDomainAndTicks(topGrades, "totalKg");

  // Filter, sort, and slice for top 3 after exclusions
  const filteredTopGrades = topGrades
    .filter(g => !excludedGrades.includes(g.grade))
    .sort((a, b) => b.totalKg - a.totalKg)
    .slice(0, 3);

  // Filter out invalid data for charts
  const validTopMovers = topMovers.filter(
    item => typeof item.totalKg === 'number' && !isNaN(item.totalKg)
  );
  const validFilteredTopGrades = filteredTopGrades.filter(
    item => typeof item.totalKg === 'number' && !isNaN(item.totalKg)
  );

  // Export functionality
  const prepareExportData = () => {
    const includedGrades = allGrades.filter(grade => !excludedGrades.includes(grade));
    const barChartRows = filledLineData.map(row => ({
      period: row.period,
      ...includedGrades.reduce((acc, grade) => ({ ...acc, [grade]: row[grade] }), {})
    }));
    const topMoversRows = topMovers.map(f => ({
      type: "Top Society",
      society: f.society,
      totalKg: f.totalKg
    }));
    const topGradesRows = topGrades.map(g => ({
      type: "Top Grade",
      grade: g.grade,
      totalKg: g.totalKg
    }));
    const combined = [
      ...barChartRows,
      ...topMoversRows,
      ...topGradesRows
    ];
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

  // Add gradeColors for bar colors
  const gradeColors = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#a832a6"];

  return (
    <div className="space-y-6 bg-amber-50 min-h-screen p-2 sm:p-4 md:p-6">
      {/* Section Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
          Coffee Movement Analytics
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">
          Analyze total coffee transported by grade, society, warehouse, and more. Use the filters below to customize your view.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row justify-end gap-2 mb-4">
        {/* Export Button */}
        <button
          className="flex items-center gap-1 px-4 py-2 rounded border border-gray-300 bg-white text-gray-700 font-medium shadow-sm hover:bg-gray-100 transition w-full sm:w-auto"
          onClick={handleExportClick}
        >
          <PiFileCsvBold className="w-5 h-5 text-amber-600" />
          Export
        </button>
        {/* Download Report Button */}
        <button
          className="flex items-center gap-1 px-4 py-2 rounded border border-gray-300 bg-white text-amber-700 font-medium shadow-sm hover:bg-amber-100 transition w-full sm:w-auto"
          onClick={() => setIsDownloadModalOpen(true)}
        >
          <FiDownload className="w-4 h-4 text-amber-600" />
          Download Report
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-lg p-4 sm:p-6 mb-4 shadow-sm overflow-x-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Society */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Society</label>
            <select
              className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-amber-600 focus:ring-2 focus:ring-amber-200"
              value={selectedSociety}
              onChange={(e) => setSelectedSociety(e.target.value)}
            >
              <option value="">All Societies</option>
              {societiesList
                .filter(society => society.is_approved)
                .map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
            </select>
          </div>
          {/* Factory */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Factory</label>
            <select
              className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-amber-600 focus:ring-2 focus:ring-amber-200"
              value={selectedFactory}
              onChange={(e) => setSelectedFactory(e.target.value)}
            >
              <option value="">All Factories</option>
              {filteredFactories.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
            <div className="flex gap-2">
              <input
                type="date"
                className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-amber-600 focus:ring-2 focus:ring-amber-200"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              />
              <input
                type="date"
                className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-amber-600 focus:ring-2 focus:ring-amber-200"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          {/* Granularity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Granularity</label>
            <select
              className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-amber-600 focus:ring-2 focus:ring-amber-200"
              value={dateRange.granularity}
              onChange={(e) => setDateRange({ ...dateRange, granularity: e.target.value })}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="90days">90 Days</option>
            </select>
          </div>
          {/* Exclude Coffee Grades */}
          <div>
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
                setSelectedSociety('');
                setSelectedFactory('');
                setDateRange({ start: sevenDaysAgo, end: today, granularity: 'daily' });
                setExcludedGrades([]);
              }}
              className="px-4 py-2 rounded bg-amber-200 text-amber-800 font-semibold hover:bg-amber-300 cursor-pointer"
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
            yAxisKeys={allGrades.filter(grade => !excludedGrades.includes(grade))}
            colors={gradeColors}
            title="Total Coffee Transported Over Time"
            height={350}
            barProps={{
              isAnimationActive: false,
            }}
            xTickFormatter={period => formatPeriodLabel(period, dateRange.granularity)}
            yAxisProps={{
              domain: [0, 100]
            }}
          />
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : (
          <ChartErrorBoundary>
            {Array.isArray(filledLineData) && filledLineData.length > 0 &&
              allGrades.filter(grade => !excludedGrades.includes(grade)).length > 0 &&
              filledLineData.every(row =>
                allGrades.filter(grade => !excludedGrades.includes(grade)).every(grade => typeof row[grade] === 'number' && !isNaN(row[grade]))
              ) ? (
              <BarChartWidget
                data={filledLineData}
                xAxisKey="period"
                yAxisKeys={allGrades.filter(grade => !excludedGrades.includes(grade))}
                colors={gradeColors}
                title="Total Coffee Transported Over Time"
                height={350}
                barProps={{
                  isAnimationActive: false,
                }}
                xTickFormatter={period => formatPeriodLabel(period, dateRange.granularity)}
                yAxisProps={{
                  domain: [
                    (dataMin) => Math.floor(isFinite(dataMin) ? dataMin : 0),
                    (dataMax) => Math.ceil(isFinite(dataMax) ? dataMax : 100)
                  ]
                }}
              />
            ) : (
              <div className="text-gray-500 text-center py-8">No valid data available for current filters.</div>
            )}
          </ChartErrorBoundary>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
        {/* Top 3 performing societies */}
        <div className="bg-white rounded-lg shadow p-4 flex flex-col justify-center">
          <TopPerformersChart
            data={validTopMovers}
            valueKey="totalKg"
            nameKey="society"
            barColor="#8884d8"
            title="Top 3 Performing Societies"
            xAxisLabel="Total Weight (KGs)"
            yAxisLabel="Society"
          />
        </div>
        {/* Top 3 performing coffee grades */}
        <div className="bg-white rounded-lg shadow p-4 flex flex-col justify-center">
          <TopPerformersChart
            data={validFilteredTopGrades}
            valueKey="totalKg"
            nameKey="grade"
            barColor="#82ca9d"
            title="Top 3 Performing Coffee Grades"
            xAxisLabel="Total Weight (KGs)"
            yAxisLabel="Grade"
          />
        </div>
      </div>

      {/* <PermitAnalyticsCharts
        selectedSociety={selectedSociety}
        selectedFactory={selectedFactory}
        dateRange={dateRange}
        xTickFormatter={period => formatPeriodLabel(period, dateRange.granularity)}
      /> */}

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        data={csvData}
        headers={csvHeaders}
        filename="admin-analytics-export.csv"
        title="Preview Export Data"
        description="Below is a preview of the data you are about to export as CSV."
      />

      <DownloadReportModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
        dataSections={{
          main: filledLineData,
          topFactories: [],
          topMovers: topMovers,
          topGrades: topGrades,
          start_date: dateRange.start,
          end_date: dateRange.end,
          granularity: dateRange.granularity,
          society_id: selectedSociety || user?.managed_society?.id || undefined,
        }}
        excludedGrades={excludedGrades}
        allGrades={allGrades}
        defaultFileName="Coffee-Analytics-Report"
      />
    </div>
  );
};

export default CoffeeAnalysisCharts;
