import React, { useState, useEffect } from "react";
import {
  ComposedChart,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
// import { mockVisualsData } from "../../mockData"; // Adjust path as needed
import { get } from "../../api";

const Visuals = () => {
  // STATE MANAGEMENT
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedChart, setSelectedChart] = useState("college");

  // LOAD MOCK DATA
  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     setData(mockVisualsData);
  //     setFilteredData(mockVisualsData);
  //     setLoading(false);
  //   }, 300);

  //   return () => clearTimeout(timer);
  // }, []);

  //load real data from mongoDB through the backend
  useEffect(() => {

      async function loadData() {

          try {

              setLoading(true);
              setError("");

              const result = await get("/data");

              setData(result.data);
              setFilteredData(result.data);

          }

          catch (err) {

              console.log("Error loading visualization data:", err);
              setError(err.message);

          }

          finally {

              setLoading(false);
          }
      }

      loadData();

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

  // ================================
// PIE CHART - ACTIVITY TYPE SHARE
// ================================

  const activityMap = filteredData.reduce((acc, curr) => {

    const activity = curr.activity_type || "Other";

    if (!acc[activity]) {
      acc[activity] = {
        name: activity,
        value: 0
      };
    }

    acc[activity].value += 1;

    return acc;

  }, {});

const activityPieData = Object.values(activityMap);


// ================================
// HISTOGRAM - QUANTITY DISTRIBUTION
// ================================

const histogramMap = {};

filteredData.forEach((record) => {

  const quantity = Number(record.quantity);

  if (Number.isNaN(quantity)) {
    return;
  }

  // Groups values into ranges such as 0-9, 10-19, 20-29
  const bucketStart = Math.floor(quantity / 10) * 10;
  const bucketEnd = bucketStart + 9;

  const label = `${bucketStart}-${bucketEnd}`;

  if (!histogramMap[label]) {
    histogramMap[label] = {
      range: label,
      start: bucketStart,
      count: 0
    };
  }

  histogramMap[label].count += 1;

});

const histogramData = Object.values(histogramMap)
  .sort((a, b) => a.start - b.start);


// ================================
// LINE CHART - ACTIVITY OVER TIME
// ================================

const trendMap = {};

filteredData.forEach((record) => {

  const date = new Date(record.activity_date);

  if (Number.isNaN(date.getTime())) {
    return;
  }

  const dateKey = date.toLocaleDateString();

  if (!trendMap[dateKey]) {
    trendMap[dateKey] = {
      date: dateKey,
      dateValue: date.getTime(),
      quantity: 0,
      visits: 0
    };
  }

  trendMap[dateKey].quantity += Number(record.quantity) || 0;
  trendMap[dateKey].visits += 1;

});

const trendData = Object.values(trendMap)
  .sort((a, b) => a.dateValue - b.dateValue);


// ================================
// SCATTERPLOT - DATE VS QUANTITY
// ================================

const scatterData = filteredData
  .map((record) => {

    const date = new Date(record.activity_date);
    const quantity = Number(record.quantity);

    if (
      Number.isNaN(date.getTime()) ||
      Number.isNaN(quantity)
    ) {
      return null;
    }

    return {
      date: date.toLocaleDateString(),
      dateValue: date.getTime(),
      quantity,
      activity: record.activity_type || "Other"
    };

  })
  .filter(Boolean);

  // HELPER: Exclude internal Mongo metadata keys
  // const getDisplayKeys = (obj) => {
  //   if (!obj) return [];
  //   return Object.keys(obj).filter(
  //     (key) => !["_id", "__v", "createdAt", "updatedAt"].includes(key)
  //   );
  // };

  const getDisplayKeys = (obj) => {

    if (!obj) return [];

    const hiddenFields = [
        "_id",
        "__v",
        "createdAt",
        "updatedAt",
        "organization",
        "uploadedBy",
        "fileName",
        "fileType"
    ];

    return Object.keys(obj).filter(
        (key) => !hiddenFields.includes(key)
    );
  };

  //loading + error states
  if (loading) return <div style={{ padding: "20px" }}>Loading visuals...</div>;
  if (error) {
    return (
        <div style={{ padding: "20px" }}>
            <h2>Unable to load dashboard data</h2>
            <p>{error}</p>
        </div>
    );
  }

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

      <div
        style={{
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          gap: "12px"
        }}
      >

        <label style={{ fontWeight: "bold" }}>
          Visualization Type:
        </label>

        <select
          value={selectedChart}
          onChange={(e) => setSelectedChart(e.target.value)}
          style={inputStyle}
        >

          <option value="college">
            College Comparison
          </option>

          <option value="pie">
            Activity Type Pie Chart
          </option>

          <option value="histogram">
            Quantity Histogram
          </option>

          <option value="trend">
            Activity Over Time
          </option>

          <option value="scatter">
            Quantity by Date Scatterplot
          </option>

        </select>

      </div>

      <div style={chartCardStyle}>

        {/* COLLEGE BAR + LINE CHART */}

        {selectedChart === "college" && (
          <>
            <h3>Impact by College</h3>

            <p style={chartDescriptionStyle}>
              Compare total quantity distributed and student activity across colleges.
            </p>

            <div style={{ width: "100%", height: 350 }}>

              <ResponsiveContainer>

                <ComposedChart data={chartData}>

                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                  />

                  <XAxis dataKey="college" />

                  <YAxis yAxisId="left" />

                  <YAxis
                    yAxisId="right"
                    orientation="right"
                  />

                  <Tooltip />

                  <Legend />

                  <Bar
                    yAxisId="left"
                    dataKey="totalQuantity"
                    name="Total Quantity"
                    fill="#FFC20E"
                    radius={[6, 6, 0, 0]}
                  />

                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="totalVisits"
                    name="Student Visits"
                    stroke="#111111"
                    strokeWidth={3}
                  />

                </ComposedChart>

              </ResponsiveContainer>

            </div>
          </>
        )}


        {/* PIE CHART */}

        {selectedChart === "pie" && (
          <>
            <h3>Activity Type Distribution</h3>

            <p style={chartDescriptionStyle}>
              Shows what percentage of recorded activity belongs to each service type.
            </p>

            <div style={{ width: "100%", height: 350 }}>

              <ResponsiveContainer>

                <PieChart>

                  <Pie
                    data={activityPieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    label
                  >

                    {activityPieData.map((entry, index) => (

                      <Cell
                        key={entry.name}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />

                    ))}

                  </Pie>

                  <Tooltip />

                  <Legend />

                </PieChart>

              </ResponsiveContainer>

            </div>
          </>
        )}


        {/* HISTOGRAM */}

        {selectedChart === "histogram" && (
          <>
            <h3>Quantity Distribution</h3>

            <p style={chartDescriptionStyle}>
              Shows how frequently different quantity ranges appear in uploaded records.
            </p>

            <div style={{ width: "100%", height: 350 }}>

              <ResponsiveContainer>

                <BarChart data={histogramData}>

                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="range"
                    label={{
                      value: "Quantity Range",
                      position: "insideBottom",
                      offset: -5
                    }}
                  />

                  <YAxis />

                  <Tooltip />

                  <Bar
                    dataKey="count"
                    name="Number of Records"
                    fill="#FFC20E"
                  />

                </BarChart>

              </ResponsiveContainer>

            </div>
          </>
        )}


        {/* LINE CHART */}

        {selectedChart === "trend" && (
          <>
            <h3>Activity Over Time</h3>

            <p style={chartDescriptionStyle}>
              Shows how service quantity and visits change over time.
            </p>

            <div style={{ width: "100%", height: 350 }}>

              <ResponsiveContainer>

                <LineChart data={trendData}>

                  <CartesianGrid
                    strokeDasharray="3 3"
                  />

                  <XAxis dataKey="date" />

                  <YAxis />

                  <Tooltip />

                  <Legend />

                  <Line
                    type="monotone"
                    dataKey="quantity"
                    name="Quantity"
                    stroke="#FFC20E"
                    strokeWidth={3}
                  />

                  <Line
                    type="monotone"
                    dataKey="visits"
                    name="Visits"
                    stroke="#111111"
                    strokeWidth={3}
                  />

                </LineChart>

              </ResponsiveContainer>

            </div>
          </>
        )}


        {/* SCATTERPLOT */}

        {selectedChart === "scatter" && (
          <>
            <h3>Quantity by Date</h3>

            <p style={chartDescriptionStyle}>
              Each point represents one activity record and the quantity associated with it.
            </p>

            <div style={{ width: "100%", height: 350 }}>

              <ResponsiveContainer>

                <ScatterChart>

                  <CartesianGrid />

                  <XAxis
                    type="number"
                    dataKey="dateValue"
                    name="Date"
                    domain={["dataMin", "dataMax"]}
                    tickFormatter={(value) =>
                      new Date(value).toLocaleDateString()
                    }
                  />

                  <YAxis
                    type="number"
                    dataKey="quantity"
                    name="Quantity"
                  />

                  <Tooltip
                    cursor={{ strokeDasharray: "3 3" }}
                    labelFormatter={(value) =>
                      new Date(value).toLocaleDateString()
                    }
                  />

                  <Scatter
                    name="Activities"
                    data={scatterData}
                    fill="#FFC20E"
                  />

                </ScatterChart>

              </ResponsiveContainer>

            </div>
          </>
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
  color: "#111111",
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

const chartDescriptionStyle = {
  color: "#6c757d",
  fontSize: "14px",
  marginBottom: "20px"
};

const PIE_COLORS = [
  "#FFC20E",
  "#111111",
  "#E0A900",
  "#666666",
  "#FFD54F",
  "#999999"
];

export default Visuals;
