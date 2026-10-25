import React, { useState, useEffect } from "react";
import { mockVisualsData } from "../../mockData"; // Adjust path to mockData as needed

const Visuals = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    const timer = setTimeout(() => {
      setData(mockVisualsData);
      setFilteredData(mockVisualsData);
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let updated = [...data];

    if (searchTerm.trim() !== "") {
      updated = updated.filter((item) =>
        JSON.stringify(item).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== "All") {
      updated = updated.filter(
        (item) =>
          item.activity_type?.toLowerCase() === selectedCategory.toLowerCase() ||
          item.category?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    setFilteredData(updated);
  }, [searchTerm, selectedCategory, data]);

  const totalItems = filteredData.length;
  const totalValue = filteredData.reduce(
    (acc, curr) => acc + (Number(curr.quantity || curr.value) || 0),
    0
  );
  const averageValue = totalItems > 0 ? (totalValue / totalItems).toFixed(2) : 0;

  const categories = [
    "All",
    ...new Set(
      data
        .map((item) => item.activity_type || item.category)
        .filter(Boolean)
    ),
  ];

  const getDisplayKeys = (obj) => {
    if (!obj) return [];
    return Object.keys(obj).filter(
      (key) => !["_id", "__v", "createdAt", "updatedAt"].includes(key)
    );
  };

  if (loading) return <div style={{ padding: "20px" }}>Loading visuals...</div>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>Dashboard Visuals</h2>

      {/* METRIC CARDS */}
      <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
        <div style={cardStyle}>
          <h4>Total Records</h4>
          <p style={metricStyle}>{totalItems}</p>
        </div>
        <div style={cardStyle}>
          <h4>Total Quantity Distributed</h4>
          <p style={metricStyle}>{totalValue.toLocaleString()}</p>
        </div>
        <div style={cardStyle}>
          <h4>Average / Record</h4>
          <p style={metricStyle}>{averageValue}</p>
        </div>
      </div>

      {/* CONTROLS */}
      <div style={{ display: "flex", gap: "15px", marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="Search records..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={inputStyle}
        />
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

      {/* TABLE */}
      <div style={{ overflowX: "auto" }}>
        {filteredData.length === 0 ? (
          <p>No data available matching your criteria.</p>
        ) : (
          <table style={tableStyle}>
            <thead>
              <tr style={{ backgroundColor: "#f2f2f2" }}>
                {getDisplayKeys(filteredData[0]).map((key) => (
                  <th key={key} style={cellStyle}>
                    {key.toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredData.map((row, index) => (
                <tr key={index}>
                  {getDisplayKeys(row).map((key) => (
                    <td key={key} style={cellStyle}>
                      {typeof row[key] === "object"
                        ? JSON.stringify(row[key])
                        : String(row[key])}
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

// ONLY ONE DEFAULT EXPORT HERE AT THE BOTTOM:
export default Visuals;
