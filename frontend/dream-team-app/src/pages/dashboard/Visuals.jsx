import React, { useState, useEffect } from "react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { mockVisualsData } from "../../mockData"; // Adjust path as needed

const Visuals = () => {
  // STATE MANAGEMENT
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // LOAD MOCK DATA
  useEffect(() => {
    const timer = setTimeout(() => {
      setData(mockVisualsData);
      setFilteredData(mockVisualsData);
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  // FILTERING LOGIC
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

  // CALCULATIONS FOR METRIC CARDS
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

  // TRANSFORM DATA FOR RECHARTS COMBO CHART
  // Aggregates total quantity (Bars) and total count/visits (Line) grouped by College
  const chartDataMap = filteredData.reduce((acc, curr) => {
    const college = curr.college || "Other";
    const qty = Number(curr.quantity || curr.value) || 0;

    if (!acc[college]) {
      acc[college] = { college, totalQuantity: 0, totalVisits: 0 };
    }

    acc[college].totalQuantity += qty;
    acc[college].totalVisits += 1;
    return acc;
  }, {});

  const chartData = Object.values(chartDataMap);

  // HELPER: Exclude internal Mongo metadata keys
  const getDisplayKeys = (obj) => {
    if (!obj) return [];
    return Object.keys(obj).filter(
      (key) => !["_id", "__v", "createdAt", "updatedAt"].includes(key)
    );
  };

  if (loading) return <div style={{ padding: "20px" }}>Loading visuals...</div>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>Retriever Essentials - Analytics Dashboard</h2>

      {/* METRIC CARDS */}
      <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
        <div style={cardStyle}>
          <h4>Total Visits / Events</h4>
          <p style={metricStyle}>{totalItems}</p>
        </div>
        <div style={cardStyle}>
          <h4>Total Quantity Distributed</h4>
          <p style={metricStyle}>{totalValue.toLocaleString()}</p>
        </div>
        <div style={cardStyle}>
          <h4>Average / Activity</h4>
          <p style={metricStyle}>{averageValue}</p>
        </div>
      </div>

      {/* COMBO CHART (BAR + LINE CHART) */}
      <div style={chartCardStyle}>
        <h3>Impact Trends by College</h3>
        <p style={{ color: "#6c757d", fontSize: "14px", marginBottom: "20px" }}>
          Bars represent total item quantity distributed; line represents total student visits.
        </p>

        {chartData.length === 0 ? (
          <p>No chart data available for the current filters.</p>
        ) : (
          <div style={{ width: "100%", height: 350 }}>
            <ResponsiveContainer>
              <ComposedChart
                data={chartData}
                margin={{ top: 20, right: 30, bottom: 20, left: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                <XAxis dataKey="college" stroke="#555" />
                <YAxis yAxisId="left" stroke="#5c6ac4" />
                <YAxis yAxisId="right" orientation="right" stroke="#e67e22" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    borderRadius: "8px",
                    border: "1px solid #ccc",
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: "10px" }} />
                <Bar
                  yAxisId="left"
                  dataKey="totalQuantity"
                  name="Total Quantity"
                  fill="#5c6ac4"
                  radius={[6, 6, 0, 0]}
                  barSize={40}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="totalVisits"
                  name="Student Visits"
                  stroke="#e67e22"
                  strokeWidth={3}
                  dot={{ r: 5, fill: "#e67e22" }}
                  activeDot={{ r: 8 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
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

      {/* DATA TABLE */}
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

// INLINE STYLES
const cardStyle = {
  flex: "1",
  padding: "15px",
  borderRadius: "8px",
  backgroundColor: "#f8f9fa",
  border: "1px solid #e9ecef",
  textAlign: "center",
};

const chartCardStyle = {
  padding: "20px",
  borderRadius: "8px",
  backgroundColor: "#ffffff",
  border: "1px solid #e9ecef",
  boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
  marginBottom: "25px",
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
