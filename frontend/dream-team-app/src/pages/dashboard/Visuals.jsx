import React, { useState, useEffect } from "react";
import API from "../../api"; // Pre-configured Axios instance for backend requests

const Visuals = () => {

  // STATE MANAGEMENT
  
  // Data States (SCRUM-61)
  const [data, setData] = useState([]);             // Stores raw data fetched from API
  const [filteredData, setFilteredData] = useState([]); // Stores filtered data for display
  const [loading, setLoading] = useState(true);      // Controls loading state UI
  const [error, setError] = useState("");            // Stores error messages

  // Filter States (SCRUM-62)
  const [searchTerm, setSearchTerm] = useState("");         // Search bar query
  const [selectedCategory, setSelectedCategory] = useState("All"); // Dropdown filter selection

  // FETCH UPLOADED DATA FROM BACKEND
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch user's uploaded dataset from the backend endpoint
      const response = await API.get("/data");
      const result = response.data || [];
      
      // Store original dataset and initialize filtered view with full data
      setData(result);
      setFilteredData(result);
    } catch (err) {
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  };


  // Re-runs whenever `searchTerm`, `selectedCategory`, or `data` changes

  useEffect(() => {
    let updated = [...data];

    // 1. Text Search Filter: Checks if query string exists inside any record field
    if (searchTerm.trim() !== "") {
      updated = updated.filter((item) =>
        JSON.stringify(item).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 2. Category Dropdown Filter: Filters records by selected category
    if (selectedCategory !== "All") {
      updated = updated.filter((item) => item.category === selectedCategory);
    }

    // Update state to trigger re-render of table and metrics
    setFilteredData(updated);
  }, [searchTerm, selectedCategory, data]);

  // Calculations update dynamically based on filtered data
  
  // Metric 1: Total count of visible items
  const totalItems = filteredData.length;

  // Metric 2: Sum total of numeric 'value' fields in dataset
  const totalValue = filteredData.reduce(
    (acc, curr) => acc + (Number(curr.value) || 0),
    0
  );

  // Metric 3: Calculated average value per record
  const averageValue = totalItems > 0 ? (totalValue / totalItems).toFixed(2) : 0;

  // Extract unique category names dynamically from dataset for dropdown list
  const categories = [
    "All",
    ...new Set(data.map((item) => item.category).filter(Boolean)),
  ];


  // CONDITIONAL RENDERING (Loading / Error States)
  
  if (loading) return <div>Loading visuals...</div>;
  if (error) return <div style={{ color: "red" }}>{error}</div>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>Dashboard Visuals</h2>


      <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
        {/* Total Records Card */}
        <div style={cardStyle}>
          <h4>Total Records</h4>
          <p style={metricStyle}>{totalItems}</p>
        </div>

        {/* Sum Value Card */}
        <div style={cardStyle}>
          <h4>Total Sum</h4>
          <p style={metricStyle}>${totalValue.toLocaleString()}</p>
        </div>

        {/* Average Value Card */}
        <div style={cardStyle}>
          <h4>Average Value</h4>
          <p style={metricStyle}>${averageValue}</p>
        </div>
      </div>

      <div style={{ display: "flex", gap: "15px", marginBottom: "20px" }}>
        {/* Keyword Search Input */}
        <input
          type="text"
          placeholder="Search records..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={inputStyle}
        />

        {/* Category Dropdown Filter */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={inputStyle}
        >
          {categories.map((cat, idx) => (
            <option key={idx} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div style={{ overflowX: "auto" }}>
        {filteredData.length === 0 ? (
          <p>No data available matching your criteria.</p>
        ) : (
          <table style={tableStyle}>
            {/* Table Header: Dynamically generated from object keys */}
            <thead>
              <tr style={{ backgroundColor: "#f2f2f2" }}>
                {Object.keys(filteredData[0]).map((key) => (
                  <th key={key} style={cellStyle}>
                    {key.toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>

            {/* Table Body: Renders filtered record rows */}
            <tbody>
              {filteredData.map((row, index) => (
                <tr key={index}>
                  {Object.values(row).map((val, i) => (
                    <td key={i} style={cellStyle}>
                      {typeof val === "object"
                        ? JSON.stringify(val)
                        : String(val)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

const cardStyle = {
  flex: "1",
  padding: "15px",
  borderRadius: "8px",
  backgroundColor: "#f8f9fa",
  border: "1px solid #e9ecef",
  textAlign: "center",
};

const metricStyle = {
  fontSize: "24px",
  fontWeight: "bold",
  color: "#007bff",
  margin: "10px 0 0 0",
};

const inputStyle = {
  padding: "8px 12px",
  borderRadius: "4px",
  border: "1px solid #ccc",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  marginTop: "10px",
};

const cellStyle = {
  border: "1px solid #ddd",
  padding: "8px",
  textAlign: "left",
};

export default Visuals;
