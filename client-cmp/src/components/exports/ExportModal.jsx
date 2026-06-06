import React from "react";
import Modal from "react-modal";
import { CSVLink } from "react-csv";
import { PiFileCsvBold } from "react-icons/pi";

Modal.setAppElement("#root"); // Make sure this matches your app's root element

const ExportModal = ({
  isOpen,
  onClose,
  data,
  headers,
  filename = "export.csv",
  title = "Preview Export Data",
  description = "Below is a preview of the data you are about to export.",
  maxPreviewRows = 20,
}) => {
  const [exportLoading, setExportLoading] = React.useState(false);

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      contentLabel="Export Preview"
      className="bg-white p-6 rounded shadow-lg max-w-2xl mx-auto mt-20"
      overlayClassName="fixed inset-0 bg-black/60 flex items-center justify-center"
    >
      <div className="flex items-center gap-2 mb-2">
        <PiFileCsvBold className="w-6 h-6 text-amber-600" />
        <h2 className="text-xl font-bold">{title}</h2>
      </div>
      <div className="max-h-[70vh] overflow-y-auto">
        <p className="text-gray-600 mb-4">{description}</p>
        <div className="overflow-x-auto max-h-96 mb-4">
          <table className="min-w-full text-sm border">
            <thead>
              <tr>
                {headers.map((h) => (
                  <th key={h.key} className="border px-2 py-1 bg-gray-100">
                    {h.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.slice(0, maxPreviewRows).map((row, i) => (
                <tr key={i}>
                  {headers.map((h) => (
                    <td key={h.key} className="border px-2 py-1">
                      {row[h.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {data.length > maxPreviewRows && (
            <div className="text-xs text-gray-500 mt-2">
              Showing first {maxPreviewRows} rows of {data.length} total.
            </div>
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
        <CSVLink
          data={data}
          headers={headers}
          filename={filename}
          className={`px-4 py-2 rounded bg-amber-600 text-white font-semibold hover:bg-amber-700 flex items-center gap-1${exportLoading ? ' opacity-50 pointer-events-none' : ''}`}
          onClick={e => {
            setExportLoading(true);
            if (typeof onClose === 'function') onClose(e);
            setTimeout(() => setExportLoading(false), 1000); // Simulate async for UX
          }}
          tabIndex={exportLoading ? -1 : 0}
          aria-disabled={exportLoading}
        >
          {exportLoading ? (
            <span className="flex items-center"><span className="animate-spin mr-2 h-4 w-4 border-b-2 border-white rounded-full"></span>Exporting...</span>
          ) : (
            <><PiFileCsvBold className="w-5 h-5" />Download CSV</>
          )}
        </CSVLink>
      </div>
    </Modal>
  );
};

export default ExportModal;
