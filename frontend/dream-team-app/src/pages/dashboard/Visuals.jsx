import React, { useState, useEffect, useMemo } from "react";
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
import { get } from "../../api";

const Visuals = () => {
  // STATE MANAGEMENT
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Chart Selector State
  const [selectedChart, setSelectedChart] = useState("college");

  // Advanced Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrg, setSelectedOrg] = useState("All");
  const [selectedActivityType, setSelectedActivityType] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [minQuantity, setMinQuantity] = useState("");
  const [maxQuantity, setMaxQuantity] = useState("");

  // Load real data from MongoDB through the backend
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const result = await get("/data");
        setData(Array.isArray(result.data) ? result.data : []);
      } catch (err) {
        console.log("Error loading visualization data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Helper to consistently extract organization code from a record
  const getOrgCode = (item) => {
    const code =
      item?.organization_code ||
      item?.organizationCode ||
      item?.org_code ||
      item?.orgCode ||
      (typeof item?.organization === "string"
        ? item.organization
        : item?.organization?.code || item?.organization?.organization_code);

    return code && String(code).trim() !== ""
      ? String(code).trim()
      : "Unassigned";
  };

  // Helper to normalize a record's date into YYYY-MM-DD for range comparisons
  const getNormalizedDateStr = (item) => {
    const raw = item?.activity_date || item?.date || item?.createdAt;
    if (!raw) return "";
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) return "";
    return parsed.toISOString().split("T")[0];
  };

  // Unique dropdown options derived from loaded data
  const organizationOptions = useMemo(() => {
    const codes = new Set(data.map((item) => getOrgCode(item)));
    return ["All", ...Array.from(codes).sort()];
  }, [data]);

  const activityTypeOptions = useMemo(() => {
    const types = new Set(
      data
        .map((item) => item.activity_type || item.category)
        .filter(Boolean)
    );
    return ["All", ...Array.from(types).sort()];
  }, [data]);

  // ADVANCED FILTERING LOGIC (applies to metric cards, charts, and org tables)
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      // 1. Keyword Search
      if (searchTerm.trim() !== "") {
        const matchesSearch = JSON.stringify(item)
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
        if (!matchesSearch) return false;
      }

      // 2. Organization Code Filter
      if (selectedOrg !== "All") {
        if (getOrgCode(item) !== selectedOrg) return false;
      }

      // 3. Activity Type Filter
      if (selectedActivityType !== "All") {
        const itemType = (
          item.activity_type ||
          item.category ||
          ""
        ).toLowerCase();
        if (itemType !== selectedActivityType.toLowerCase()) return false;
      }

      // 4. Date Range Filter (inclusive)
      if (startDate || endDate) {
        const recordDate = getNormalizedDateStr(item);
        if (!recordDate) return false;
        if (startDate && recordDate < startDate) return false;
        if (endDate && recordDate > endDate) return false;
      }

      // 5. Quantity Range Filter (inclusive)
      const qty = Number(item.quantity ?? item.value);
      if (minQuantity !== "") {
        if (Number.isNaN(qty) || qty < Number(minQuantity)) return false;
      }
      if (maxQuantity !== "") {
        if (Number.isNaN(qty) || qty > Number(maxQuantity)) return false;
      }

      return true;
    });
  }, [
    data,
    searchTerm,
    selectedOrg,
    selectedActivityType,
    startDate,
    endDate,
    minQuantity,
    maxQuantity,
  ]);

  // Count active filters for badge & reset button state
  const activeFilterCount = [
    searchTerm.trim() !== "",
    selectedOrg !== "All",
    selectedActivityType !== "All",
    startDate !== "",
    endDate !== "",
    minQuantity !== "",
    maxQuantity !== "",
  ].filter(Boolean).length;

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedOrg("All");
    setSelectedActivityType("All");
    setStartDate("");
    setEndDate("");
    setMinQuantity("");
    setMaxQuantity("");
  };

  // GROUP FILTERED DATA INTO SEPARATE TABLES BY ORGANIZATION CODE
  const groupedByOrg = useMemo(() => {
    const groups = filteredData.reduce((acc, row) => {
      const orgCode = getOrgCode(row);
      const qty = Number(row.quantity ?? row.value) || 0;

      if (!acc[orgCode]) {
        acc[orgCode] = {
          orgCode,
          rows: [],
          totalQuantity: 0,
        };
      }

      acc[orgCode].rows.push(row);
      acc[orgCode].totalQuantity += qty;
      return acc;
    }, {});

    return Object.values(groups).sort((a, b) =>
      a.orgCode.localeCompare(b.orgCode)
    );
  }, [filteredData]);

  // CALCULATIONS FOR METRIC CARDS
  const totalItems = filteredData.length;
  const totalValue = filteredData.reduce(
    (acc, curr) => acc + (Number(curr.quantity ?? curr.value) || 0),
    0
  );
  const averageValue = totalItems > 0 ? (totalValue / totalItems).toFixed(2) : 0;

  // TRANSFORM DATA FOR RECHARTS COMBO CHART
  const chartDataMap = filteredData.reduce((acc, curr) => {
    const college = curr.college || "Other";
    const qty = Number(curr.quantity ?? curr.value) || 0;

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
        value: 0,
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
    if (Number.isNaN(quantity)) return;

    const bucketStart = Math.floor(quantity / 10) * 10;
    const bucketEnd = bucketStart + 9;
    const label = `${bucketStart}-${bucketEnd}`;

    if (!histogramMap[label]) {
      histogramMap[label] = {
        range: label,
        start: bucketStart,
        count: 0,
      };
    }

    histogramMap[label].count += 1;
  });

  const histogramData = Object.values(histogramMap).sort(
    (a, b) => a.start - b.start
  );

  // ================================
  // LINE CHART - ACTIVITY OVER TIME
  // ================================
  const trendMap = {};

  filteredData.forEach((record) => {
    const date = new Date(record.activity_date);
    if (Number.isNaN(date.getTime())) return;

    const dateKey = date.toLocaleDateString();

    if (!trendMap[dateKey]) {
      trendMap[dateKey] = {
        date: dateKey,
        dateValue: date.getTime(),
        quantity: 0,
        visits: 0,
      };
    }

    trendMap[dateKey].quantity += Number(record.quantity) || 0;
    trendMap[dateKey].visits += 1;
  });

  const trendData = Object.values(trendMap).sort(
    (a, b) => a.dateValue - b.dateValue
  );

  // ================================
  // SCATTERPLOT - DATE VS QUANTITY
  // ================================
  const scatterData = filteredData
    .map((record) => {
      const date = new Date(record.activity_date);
      const quantity = Number(record.quantity);

      if (Number.isNaN(date.getTime()) || Number.isNaN(quantity)) {
        return null;
      }

      return {
        date: date.toLocaleDateString(),
        dateValue: date.getTime(),
        quantity,
        activity: record.activity_type || "Other",
      };
    })
    .filter(Boolean);

  // HELPER: Exclude internal Mongo metadata keys (and organization_code since each table is already grouped by it)
  const getDisplayKeys = (obj) => {
    if (!obj) return [];

    const hiddenFields = [
      "_id",
      "__v",
      "createdAt",
      "updatedAt",
      "organization",
      "organization_code",
      "organizationCode",
      "uploadedBy",
      "fileName",
      "fileType",
    ];

    return Object.keys(obj).filter((key) => !hiddenFields.includes(key));
  };

  // Format cell values cleanly (including ISO dates)
  const formatCellValue = (key, value) => {
    if (value === null || value === undefined || value === "") return "—";
    if (typeof value === "object") return JSON.stringify(value);
    if (key.toLowerCase().includes("date")) {
      const d = new Date(value);
      if (!Number.isNaN(d.getTime())) return d.toLocaleDateString();
    }
    return String(value);
  };

  // Loading + Error States
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

      {/* ADVANCED FILTER PANEL */}
      <div style={filterPanelStyle}>
        <div style={filterHeaderStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h3 style={{ margin: 0, fontSize: "16px" }}>Advanced Filters</h3>
            {activeFilterCount > 0 && (
              <span style={activeBadgeStyle}>{activeFilterCount} active</span>
            )}
          </div>
          <button
            type="button"
            onClick={handleResetFilters}
            disabled={activeFilterCount === 0}
            style={{
              ...resetButtonStyle,
              opacity: activeFilterCount === 0 ? 0.5 : 1,
              cursor: activeFilterCount === 0 ? "not-allowed" : "pointer",
            }}
          >
            Reset Filters
          </button>
        </div>

        <div style={filterGridStyle}>
          {/* Keyword Search */}
          <div style={filterGroupStyle}>
            <label style={labelStyle}>Keyword Search</label>
            <input
              type="text"
              placeholder="Search any field..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Organization Code */}
          <div style={filterGroupStyle}>
            <label style={labelStyle}>Organization Code</label>
            <select
              value={selectedOrg}
              onChange={(e) => setSelectedOrg(e.target.value)}
              style={inputStyle}
            >
              {organizationOptions.map((code) => (
                <option key={code} value={code}>
                  {code === "All" ? "All Organizations" : code}
                </option>
              ))}
            </select>
          </div>

          {/* Activity Type */}
          <div style={filterGroupStyle}>
            <label style={labelStyle}>Activity Type</label>
            <select
              value={selectedActivityType}
              onChange={(e) => setSelectedActivityType(e.target.value)}
              style={inputStyle}
            >
              {activityTypeOptions.map((type) => (
                <option key={type} value={type}>
                  {type === "All" ? "All Activity Types" : type}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div style={filterGroupStyle}>
            <label style={labelStyle}>Date Range</label>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <input
                type="date"
                aria-label="Start Date"
                value={startDate}
                max={endDate || undefined}
                onChange={(e) => setStartDate(e.target.value)}
                style={{ ...inputStyle, flex: 1, minWidth: 0 }}
              />
              <span style={{ color: "#6c757d", fontSize: "13px" }}>to</span>
              <input
                type="date"
                aria-label="End Date"
                value={endDate}
                min={startDate || undefined}
                onChange={(e) => setEndDate(e.target.value)}
                style={{ ...inputStyle, flex: 1, minWidth: 0 }}
              />
            </div>
          </div>

          {/* Quantity Range */}
          <div style={filterGroupStyle}>
            <label style={labelStyle}>Quantity Range</label>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <input
                type="number"
                aria-label="Minimum Quantity"
                placeholder="Min"
                min="0"
                value={minQuantity}
                onChange={(e) => setMinQuantity(e.target.value)}
                style={{ ...inputStyle, flex: 1, minWidth: 0 }}
              />
              <span style={{ color: "#6c757d", fontSize: "13px" }}>–</span>
              <input
                type="number"
                aria-label="Maximum Quantity"
                placeholder="Max"
                min="0"
                value={maxQuantity}
                onChange={(e) => setMaxQuantity(e.target.value)}
                style={{ ...inputStyle, flex: 1, minWidth: 0 }}
              />
            </div>
          </div>
        </div>
      </div>

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
        <div style={cardStyle}>
          <h4>Organizations Shown</h4>
          <p style={metricStyle}>{groupedByOrg.length}</p>
        </div>
      </div>

      {/* VISUALIZATION TYPE SELECTOR */}
      <div
        style={{
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <label style={{ fontWeight: "bold" }}>Visualization Type:</label>

        <select
          value={selectedChart}
          onChange={(e) => setSelectedChart(e.target.value)}
          style={inputStyle}
        >
          <option value="college">College Comparison</option>
          <option value="pie">Activity Type Pie Chart</option>
          <option value="histogram">Quantity Histogram</option>
          <option value="trend">Activity Over Time</option>
          <option value="scatter">Quantity by Date Scatterplot</option>
        </select>
      </div>

      {/* CHARTS CONTAINER */}
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
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="college" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
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
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="range"
                    label={{
                      value: "Quantity Range",
                      position: "insideBottom",
                      offset: -5,
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
                  <CartesianGrid strokeDasharray="3 3" />
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
                  <YAxis type="number" dataKey="quantity" name="Quantity" />
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

      {/* SEPARATE DATA TABLES PER ORGANIZATION CODE */}
      <div style={{ marginTop: "30px" }}>
        <h3 style={{ marginBottom: "15px" }}>
          Records by Organization Code ({groupedByOrg.length})
        </h3>

        {groupedByOrg.length === 0 ? (
          <div style={emptyStateStyle}>
            <p style={{ margin: "0 0 10px 0" }}>
              No data available matching your filter criteria.
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              style={resetButtonStyle}
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          groupedByOrg.map((group) => {
            const displayKeys = getDisplayKeys(group.rows[0]);

            return (
              <div key={group.orgCode} style={orgSectionCardStyle}>
                <div style={orgSectionHeaderStyle}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={orgBadgeStyle}>{group.orgCode}</span>
                    <h4 style={{ margin: 0, fontSize: "16px", color: "#111111" }}>
                      Organization Code: {group.orgCode}
                    </h4>
                  </div>

                  <div style={{ display: "flex", gap: "16px", fontSize: "14px", color: "#495057" }}>
                    <span>
                      <strong>{group.rows.length}</strong>{" "}
                      {group.rows.length === 1 ? "Record" : "Records"}
                    </span>
                    <span>
                      Total Quantity:{" "}
                      <strong>{group.totalQuantity.toLocaleString()}</strong>
                    </span>
                  </div>
                </div>

                <div style={{ overflowX: "auto" }}>
                  <table style={tableStyle}>
                    <thead>
                      <tr style={{ backgroundColor: "#f8f9fa" }}>
                        {displayKeys.map((key) => (
                          <th key={key} style={cellStyle}>
                            {key.replace(/_/g, " ").toUpperCase()}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {group.rows.map((row, index) => (
                        <tr key={row._id || index}>
                          {displayKeys.map((key) => (
                            <td key={key} style={cellStyle}>
                              {formatCellValue(key, row[key])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })
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

const filterPanelStyle = {
  padding: "18px 20px",
  borderRadius: "8px",
  backgroundColor: "#ffffff",
  border: "1px solid #e9ecef",
  boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
  marginBottom: "20px",
};

const filterHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "14px",
  paddingBottom: "10px",
  borderBottom: "1px solid #f1f3f5",
};

const filterGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: "14px",
};

const filterGroupStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "5px",
};

const labelStyle = {
  fontSize: "12px",
  fontWeight: "bold",
  color: "#495057",
  textTransform: "uppercase",
};

const activeBadgeStyle = {
  backgroundColor: "#FFC20E",
  color: "#111111",
  fontSize: "12px",
  fontWeight: "bold",
  padding: "2px 8px",
  borderRadius: "12px",
};

const resetButtonStyle = {
  padding: "6px 12px",
  borderRadius: "4px",
  border: "1px solid #ced4da",
  backgroundColor: "#f8f9fa",
  color: "#111111",
  fontSize: "13px",
  fontWeight: "600",
};

const orgSectionCardStyle = {
  backgroundColor: "#ffffff",
  border: "1px solid #dee2e6",
  borderRadius: "8px",
  boxShadow: "0 2px 4px rgba(0,0,0,0.04)",
  marginBottom: "24px",
  overflow: "hidden",
};

const orgSectionHeaderStyle = {
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "10px",
  padding: "12px 16px",
  backgroundColor: "#f8f9fa",
  borderBottom: "2px solid #FFC20E",
};

const orgBadgeStyle = {
  backgroundColor: "#111111",
  color: "#FFC20E",
  fontWeight: "bold",
  fontSize: "13px",
  padding: "4px 10px",
  borderRadius: "4px",
  fontFamily: "monospace",
};

const emptyStateStyle = {
  padding: "30px",
  textAlign: "center",
  backgroundColor: "#f8f9fa",
  borderRadius: "8px",
  border: "1px dashed #ced4da",
  color: "#6c757d",
};

const metricStyle = {
  fontSize: "24px",
  fontWeight: "bold",
  color: "#111111",
  margin: "10px 0 0 0",
};

const inputStyle = {
  padding: "8px 10px",
  borderRadius: "4px",
  border: "1px solid #ccc",
  fontSize: "14px",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
};

const cellStyle = {
  borderBottom: "1px solid #e9ecef",
  borderRight: "1px solid #f1f3f5",
  padding: "10px 12px",
  textAlign: "left",
  fontSize: "14px",
};

const chartDescriptionStyle = {
  color: "#6c757d",
  fontSize: "14px",
  marginBottom: "20px",
};

const PIE_COLORS = [
  "#FFC20E",
  "#111111",
  "#E0A900",
  "#666666",
  "#FFD54F",
  "#999999",
];

export default Visuals;
