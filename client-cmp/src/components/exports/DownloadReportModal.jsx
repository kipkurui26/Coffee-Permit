import React, { useState, useMemo } from "react";
import PropTypes from "prop-types";
import Modal from "react-modal";
import { CSVLink } from "react-csv";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import axiosInstance from "../../utils/AxiosInstance";

// Patch jsPDF prototype for Vite/ESM compatibility
if (typeof jsPDF.API.autoTable === "undefined") {
  jsPDF.API.autoTable = autoTable;
}

Modal.setAppElement("#root");

// Section config: label, backend key, data key
const sectionConfig = [
  { label: "Total Coffee Moved", backendKey: "include_total", dataKey: "main", alwaysSelected: true },
  { label: "Top Coffee Factories", backendKey: "include_top_factories", dataKey: "topFactories" },
  { label: "Top Coffee Movers", backendKey: "include_top_societies", dataKey: "topMovers" },
  { label: "Top Coffee Grades", backendKey: "include_top_grades", dataKey: "topGrades" },
];

const DownloadReportModal = ({
  isOpen,
  onClose,
  dataSections,
  defaultFileName = "report",
  excludedGrades = [],
  allGrades = [],
}) => {
  // Only show toggles for sections that exist in dataSections
  const availableSections = sectionConfig.filter(cfg => dataSections[cfg.dataKey]);

  const [fileName, setFileName] = useState(defaultFileName);
  const [format, setFormat] = useState("csv");
  const [selectedSections, setSelectedSections] = useState(() => {
    const initial = {};
    availableSections.forEach(cfg => initial[cfg.label] = true);
    return initial;
  });
  const [exportLoading, setExportLoading] = React.useState(false);

  // Filter main data section by excludedGrades if present
  const filteredMain = useMemo(() => {
    if (!dataSections.main || !Array.isArray(dataSections.main) || !allGrades.length) return dataSections.main || [];
    const includedGrades = allGrades.filter(grade => !excludedGrades.includes(grade));
    return dataSections.main.map(row => {
      const filteredRow = { period: row.period };
      includedGrades.forEach(grade => {
        if (row.hasOwnProperty(grade)) filteredRow[grade] = row[grade];
      });
      return filteredRow;
    });
  }, [dataSections.main, excludedGrades, allGrades]);

  // Optionally filter topGrades section as well
  const filteredTopGrades = useMemo(() => {
    if (!dataSections.topGrades || !Array.isArray(dataSections.topGrades)) return dataSections.topGrades || [];
    return dataSections.topGrades.filter(g => !excludedGrades.includes(g.grade));
  }, [dataSections.topGrades, excludedGrades]);

  // Combine selected data for preview/export
  const exportData = useMemo(() => {
    let combined = [];
    availableSections.forEach(cfg => {
      if ((cfg.alwaysSelected || selectedSections[cfg.label]) && dataSections[cfg.dataKey]) {
        if (cfg.dataKey === 'main') {
          combined = combined.concat(filteredMain);
        } else if (cfg.dataKey === 'topGrades') {
          combined = combined.concat(filteredTopGrades);
        } else {
          combined = combined.concat(dataSections[cfg.dataKey]);
        }
      }
    });
    return combined;
  }, [selectedSections, dataSections, availableSections, filteredMain, filteredTopGrades]);

  // Generate headers for CSV/PDF
  const headers = exportData.length > 0
    ? Object.keys(exportData[0]).map(key => ({ label: key, key }))
    : [];

  // PDF Export Handler
  const handlePDFExport = async () => {
    const start_date = dataSections.start_date || "";
    const end_date = dataSections.end_date || "";
    const granularity = dataSections.granularity || "monthly";
    const society_id = dataSections.society_id || null;

    const payload = {
      start_date,
      end_date,
      granularity,
      society_id,
      exclude_grades: excludedGrades.length > 0 ? excludedGrades : undefined,
    };
    availableSections.forEach(cfg => {
      payload[cfg.backendKey] = !!selectedSections[cfg.label];
    });

    try {
      const response = await axiosInstance.post(
        "/permits/analytics-report-pdf/",
        payload,
        { responseType: "blob" }
      );
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileName}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      onClose();
    } catch (err) {
      if (typeof window.showGlobalToast === "function") {
        window.showGlobalToast("Error generating PDF: " + (err?.message || "Unknown error"), "error");
      } else {
        alert("Error generating PDF: " + (err?.message || "Unknown error"));
      }
    }
  };

  // Accessibility: focus first input when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        const input = document.getElementById("download-report-filename");
        if (input) input.focus();
      }, 100);
    }
  }, [isOpen]);

  const isDownloadDisabled = !exportData.length || !fileName.trim();

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      contentLabel="Download Report"
      className="bg-white p-6 rounded shadow-lg max-w-2xl mx-auto mt-20 outline-none"
      overlayClassName="fixed inset-0 bg-black/60 flex items-center justify-center"
      ariaHideApp={false}
    >
      <div className="max-h-[75vh] overflow-y-auto">
        <div className="mb-4 flex items-center">
          <button
            onClick={onClose}
            className="mr-2 px-2 py-1 rounded bg-amber-100 text-amber-700 font-semibold hover:bg-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-400"
            aria-label="Back"
          >
            <span className="text-lg">&#8592;</span>
            <span className="sr-only">Back</span>
          </button>
          <div>
            <h2 className="text-xl font-bold mb-1">Download Report</h2>
            <p className="text-gray-600 text-sm mb-2">Customize your export below. Choose file name, format, and which data to include. Preview before downloading.</p>
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1">
            <label htmlFor="download-report-filename" className="block text-sm font-medium text-gray-700 mb-1">File Name</label>
            <input
              id="download-report-filename"
              value={fileName}
              onChange={e => setFileName(e.target.value.replace(/[^a-zA-Z0-9-_ ]/g, ""))}
              placeholder="File name"
              className="block w-full rounded border border-gray-300 px-3 py-2 shadow-sm focus:border-amber-600 focus:ring-2 focus:ring-amber-200"
              aria-label="File name"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
            <select
              value={format}
              onChange={e => setFormat(e.target.value)}
              className="block w-full rounded border border-gray-300 px-3 py-2 shadow-sm focus:border-amber-600 focus:ring-2 focus:ring-amber-200"
              aria-label="Export format"
            >
              <option value="csv">CSV</option>
              <option value="pdf">PDF</option>
            </select>
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Data Sections</label>
          <div className="flex flex-wrap gap-4">
            {availableSections.map(cfg => (
              <label key={cfg.label} className="flex items-center gap-1 text-sm">
                <input
                  type="checkbox"
                  checked={cfg.alwaysSelected ? true : selectedSections[cfg.label]}
                  disabled={cfg.alwaysSelected}
                  onChange={cfg.alwaysSelected ? undefined : () => setSelectedSections(s => ({ ...s, [cfg.label]: !s[cfg.label] }))}
                  className="accent-amber-600"
                  aria-label={`Include ${cfg.label}`}
                />
                <span>{cfg.label}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto max-h-64 mb-4 border rounded">
          {exportData.length > 0 ? (
            <table className="min-w-full text-xs border">
              <thead>
                <tr>
                  {headers.map(h => (
                    <th key={h.key} className="border px-2 py-1 bg-gray-100">{h.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {exportData.slice(0, 10).map((row, i) => (
                  <tr key={i}>
                    {headers.map(h => (
                      <td key={h.key} className="border px-2 py-1">{row[h.key]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-gray-500 text-center py-4">No data to preview.</div>
          )}
          {exportData.length > 10 && (
            <div className="text-xs text-gray-500 mt-2 px-2">Showing first 10 rows of {exportData.length} total.</div>
          )}
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button
          className="px-4 py-2 rounded bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 disabled:opacity-50"
          onClick={exportLoading ? undefined : onClose}
          disabled={exportLoading}
        >
          Cancel
        </button>
        {format === "csv" ? (
          <CSVLink
            data={exportData}
            headers={headers}
            filename={`${fileName}.csv`}
            className={`px-4 py-2 rounded bg-amber-600 text-white font-semibold hover:bg-amber-700 flex items-center gap-1${isDownloadDisabled || exportLoading ? ' pointer-events-none opacity-50' : ''}`}
            onClick={e => {
              setExportLoading(true);
              if (typeof onClose === 'function') onClose(e);
              setTimeout(() => setExportLoading(false), 1000); // Simulate async for UX
            }}
            aria-disabled={isDownloadDisabled || exportLoading}
            tabIndex={isDownloadDisabled || exportLoading ? -1 : 0}
          >
            {exportLoading ? (
              <span className="flex items-center"><span className="animate-spin mr-2 h-4 w-4 border-b-2 border-white rounded-full"></span>Exporting...</span>
            ) : (
              "Download CSV"
            )}
          </CSVLink>
        ) : (
          <button
            onClick={async () => {
              setExportLoading(true);
              await handlePDFExport();
              setExportLoading(false);
            }}
            className={`px-4 py-2 rounded bg-amber-600 text-white font-semibold hover:bg-amber-700${isDownloadDisabled || exportLoading ? ' opacity-50 cursor-not-allowed' : ''}`}
            disabled={isDownloadDisabled || exportLoading}
          >
            {exportLoading ? (
              <span className="flex items-center"><span className="animate-spin mr-2 h-4 w-4 border-b-2 border-white rounded-full"></span>Exporting...</span>
            ) : (
              "Download PDF"
            )}
          </button>
        )}
      </div>
    </Modal>
  );
};

DownloadReportModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  dataSections: PropTypes.object.isRequired,
  defaultFileName: PropTypes.string,
  excludedGrades: PropTypes.array,
  allGrades: PropTypes.array,
};

export default DownloadReportModal;
