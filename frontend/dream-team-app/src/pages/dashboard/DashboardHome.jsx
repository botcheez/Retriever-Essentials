import { useState } from "react";
import { upload } from "../../api";
import Loading from "../../components/Loading";
import ErrorMessage from "../../components/ErrorMessage";
import Button from "../../components/Button";

// Columns the backend requires (see backend/routes/dataRoutes.js).
// Keep this list in sync with the backend if it changes.
const REQUIRED_COLUMNS = [
  "organization_ID", "term_code", "activity_date", "unit_code",
  "activity_type", "event_name", "quantity", "level", "class_standing",
  "enrollment_status", "race", "gender", "pell_eligible", "first_gen",
  "transfer", "housing", "college",
];

const MAX_SIZE_MB = 5; // the backend rejects bigger files

function DashboardHome() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [missingColumns, setMissingColumns] = useState([]);
  const [success, setSuccess] = useState("");
  // Changing this key makes React rebuild the file input, which clears it.
  const [inputKey, setInputKey] = useState(0);

  function handleFileChange(e) {
    setFile(e.target.files[0] || null);
    setError("");
    setMissingColumns([]);
    setSuccess("");
  }

  async function handleSubmit(e) {
    e.preventDefault();

    // Quick checks in the browser, before sending anything.
    if (!file) {
      setError("Please choose a file first.");
      return;
    }
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Only CSV files are supported right now.");
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`File is too large (max ${MAX_SIZE_MB} MB).`);
      return;
    }

    setLoading(true);
    setError("");
    setMissingColumns([]);
    setSuccess("");

    try {
      // The backend reads the file from a form field named "file".
      const formData = new FormData();
      formData.append("file", file);

      const result = await upload("/data/upload", formData);

      setSuccess(`${result.message}: ${result.recordsSaved} records saved from ${result.fileName}.`);
      setFile(null);
      setInputKey((k) => k + 1); // clear the file picker
    } catch (err) {
      setError(err.message);
      setMissingColumns(err.data?.missingColumns || []);
    } finally {
      setLoading(false); // runs whether it worked or failed
    }
  }

  return (
    <div>
      <h1>Home</h1>

      <h2>Upload data</h2>
      <form className="upload-form" onSubmit={handleSubmit}>
        <input
          key={inputKey}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          disabled={loading}
        />

        <Button type="submit" disabled={loading}>
          Upload
        </Button>

        {loading && <Loading message="Uploading..." />}

        <ErrorMessage message={error} />

        {missingColumns.length > 0 && (
          <div className="error-message">
            Missing columns: {missingColumns.join(", ")}
          </div>
        )}

        {success && <div className="success-message">{success}</div>}
      </form>

      <details className="upload-help">
        <summary>Which columns does my CSV need?</summary>
        <p>{REQUIRED_COLUMNS.join(", ")}</p>
      </details>
    </div>
  );
}

export default DashboardHome;
