import React, { useState } from "react";
import PropTypes from "prop-types";
import { supabase } from "@/supabase/client";
import { UploadCloud, FileText, X } from "lucide-react";

const ImportCSVModal = ({ isOpen, onClose, onImportSuccess }) => {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === "text/csv") {
      setFile(selectedFile);
      setFileName(selectedFile.name);
      setError("");
      setSuccessMessage("");
    } else {
      setFile(null);
      setFileName("");
      setError("Please select a valid .csv file.");
    }
  };

  const parseAndPrepareData = (csvText, startingId) => {
    const lines = csvText.split(/\r\n|\n/).filter((line) => line.trim() !== "");
    if (lines.length <= 1) return [];

    const headers = lines[0].split(",").map((header) => header.trim());
    const data = [];
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const year = today.getFullYear();
    const datePart = `${month}${day}${year}`;

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i]) continue;
      const values = lines[i].split(",");
      const entry = {};
      headers.forEach((header, index) => {
        const value = values[index] ? values[index].trim() : null;
        if (["quantity", "price"].includes(header) && value) {
          entry[header] = Number(value);
        } else {
          entry[header] = value;
        }
      });

      // Auto-generate medicineId and set status
      const nextId = startingId + i - 1;
      const typePart = entry.productType === "Medicine" ? "1" : "0";
      entry.medicineId = `${datePart}${typePart}${nextId}`;
      entry.status = "Available";

      data.push(entry);
    }
    return data;
  };

  const handleImport = async () => {
    if (!file) {
      setError("No file selected.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMessage("");

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        // 1. Get the last product ID to determine the next ID
        const { data: lastProduct, error: fetchError } = await supabase
          .from("products")
          .select("id")
          .order("id", { ascending: false })
          .limit(1)
          .single();

        if (fetchError && fetchError.code !== "PGRST116") {
          throw fetchError;
        }

        const nextId = lastProduct ? lastProduct.id + 1 : 1;

        // 2. Parse CSV and generate medicine IDs
        const productsToInsert = parseAndPrepareData(
          event.target.result,
          nextId
        );
        if (productsToInsert.length === 0) {
          setError("CSV file is empty or invalid.");
          setLoading(false);
          return;
        }

        // 3. Insert the new products
        const { error: insertError } = await supabase
          .from("products")
          .insert(productsToInsert);

        if (insertError) {
          throw insertError;
        }

        setSuccessMessage(
          `${productsToInsert.length} products imported successfully!`
        );
        onImportSuccess();
        setFile(null);
        setFileName("");
      } catch (e) {
        setError(`Import failed: ${e.message}`);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  const handleClose = () => {
    setFile(null);
    setFileName("");
    setError("");
    setSuccessMessage("");
    setLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-lg transform transition-all">
        <div className="flex items-center justify-between mb-6 pb-4 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            Import Products from CSV
          </h2>
          <button
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Select a CSV file to import. The file should have headers: `name`,
            `category`, `quantity`, `price`, `expireDate`, `productType`, and
            `description`.
          </p>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <label
              htmlFor="csv-upload"
              className="cursor-pointer flex flex-col items-center justify-center"
            >
              <UploadCloud size={48} className="text-gray-400 mb-2" />
              <span className="text-blue-600 font-semibold">
                Click to upload
              </span>
              <span className="text-gray-500 text-sm">or drag and drop</span>
              <span className="text-xs text-gray-400 mt-1">CSV files only</span>
            </label>
            <input
              id="csv-upload"
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {fileName && (
            <div className="flex items-center justify-between bg-gray-100 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <FileText size={20} className="text-gray-600" />
                <span className="text-sm font-medium text-gray-700">
                  {fileName}
                </span>
              </div>
              <button
                onClick={() => {
                  setFile(null);
                  setFileName("");
                }}
                className="text-gray-500 hover:text-red-500"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {error && <p className="text-red-500 text-sm">{error}</p>}
          {successMessage && (
            <p className="text-green-600 text-sm">{successMessage}</p>
          )}
        </div>

        <div className="mt-8 flex justify-end gap-4">
          <button
            onClick={handleClose}
            className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-blue-300"
            disabled={!file || loading}
          >
            {loading ? "Importing..." : "Import Products"}
          </button>
        </div>
      </div>
    </div>
  );
};

ImportCSVModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onImportSuccess: PropTypes.func.isRequired,
};

export default ImportCSVModal;
