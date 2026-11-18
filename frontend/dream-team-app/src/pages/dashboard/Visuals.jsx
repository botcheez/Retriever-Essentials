import React, { useState, useEffect, useMemo, useRef } from "react";
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

const VISUALIZATION_OPTIONS = [
  { id: "college", label: "Impact by College (Bar & Line)" },
  { id: "unitCode", label: "Organization / Unit Code Comparison" },
  { id: "pie", label: "Activity Type Distribution (Pie)" },
  { id: "histogram", label: "Quantity Distribution (Histogram)" },
  { id: "trend", label: "Activity Over Time (Line)" },
  { id: "scatter", label: "Quantity by Date (Scatterplot)" },
  { id: "classStanding", label: "Class Standing Breakdown (Bar)" },
  { id: "housing", label: "Housing Status Share (Donut)" },
  {
    id: "demographics",
    label: "Student Support Indicators (Pell / First-Gen / Transfer)",
  },
];

const Visuals = () => {
  // STATE MANAGEMENT
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [orgName, setOrgName] = useState("");

  // Multi-Select Visualization State (select one or more)
  const [selectedCharts, setSelectedCharts] = useState(["college"]);
  const [isChartDropdownOpen, setIsChartDropdownOpen] = useState(false);
  const chartDropdownRef = useRef(null);

  // Advanced Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUnitCode, setSelectedUnitCode] = useState("All");
  const [selectedActivityType, setSelectedActivityType] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [minQuantity, setMinQuantity] = useState("");
  const [maxQuantity, setMaxQuantity] = useState("");

  // Close multi-select dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        chartDropdownRef.current &&
        !chartDropdownRef.current.contains(event.target)
      ) {
        setIsChartDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Load real data from MongoDB through the backend
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const result = await get("/data");
        setData(Array.isArray(result.data) ? result.data : []);
        setIsAdmin(Boolean(result.isAdmin));
        setOrgName(result.organizationName || "");
      } catch (err) {
        console.log("Error loading visualization data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Toggle a chart in the multi-select list
  const toggleChartSelection = (chartId) => {
    setSelectedCharts((prev) =>
      prev.includes(chartId)
        ? prev.filter((id) => id !== chartId)
        : [...prev, chartId]
    );
  };

  // Helper to consistently extract unit_code (organization code)
  const getUnitCode = (item) => {
    return item?.unit_code && String(item.unit_code).trim() !== ""
      ? String(item.unit_code).trim()
      : "Unassigned";
  };

  // Helper to normalize activity_date into YYYY-MM-DD for range comparisons
  const getNormalizedDateStr = (item) => {
    if (!item?.activity_date) return "";
    const parsed = new Date(item.activity_date);
    if (Number.isNaN(parsed.getTime())) return "";
    return parsed.toISOString().split("T")[0];
  };

  // Unique dropdown options derived from loaded data
  const unitCodeOptions = useMemo(() => {
    const codes = new Set(data.map((item) => getUnitCode(item)));
    return ["All", ...Array.from(codes).sort()];
  }, [data]);

  const activityTypeOptions = useMemo(() => {
    const types = new Set(
      data.map((item) => item.activity_type).filter(Boolean)
    );
    return ["All", ...Array.from(types).sort()];
  }, [data]);

  // ADVANCED FILTERING LOGIC (applies to metric cards, charts, and unit_code tables)
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      // 1. Keyword Search
      if (searchTerm.trim() !== "") {
        const matchesSearch = JSON.stringify(item)
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
        if (!matchesSearch) return false;
      }

      // 2. Organization / Unit Code Filter
      if (selectedUnitCode !== "All") {
        if (getUnitCode(item) !== selectedUnitCode) return false;
      }

      // 3. Activity Type Filter
      if (selectedActivityType !== "All") {
        const itemType = (item.activity_type || "").toLowerCase();
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
      const qty = Number(item.quantity);
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
    selectedUnitCode,
    selectedActivityType,
    startDate,
    endDate,
    minQuantity,
    maxQuantity,
  ]);

  // Count active data filters for badge & reset button state
  const activeFilterCount = [
    searchTerm.trim() !== "",
    selectedUnitCode !== "All",
    selectedActivityType !== "All",
    startDate !== "",
    endDate !== "",
    minQuantity !== "",
    maxQuantity !== "",
  ].filter(Boolean).length;

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedUnitCode("All");
    setSelectedActivityType("All");
    setStartDate("");
    setEndDate("");
    setMinQuantity("");
    setMaxQuantity("");
  };

  // GROUP FILTERED DATA INTO SEPARATE TABLES BY UNIT_CODE
  const groupedByUnitCode = useMemo(() => {
    const groups = filteredData.reduce((acc, row) => {
      const unitCode = getUnitCode(row);
      const qty = Number(row.quantity) || 0;

      if (!acc[unitCode]) {
        acc[unitCode] = {
          unitCode,
          rows: [],
          totalQuantity: 0,
        };
      }

      acc[unitCode].rows.push(row);
      acc[unitCode].totalQuantity += qty;
      return acc;
    }, {});

    return Object.values(groups).sort((a, b) =>
      a.unitCode.localeCompare(b.unitCode)
    );
  }, [filteredData]);

  // CALCULATIONS FOR METRIC CARDS
  const totalItems = filteredData.length;
  const totalValue = filteredData.reduce(
    (acc, curr) => acc + (Number(curr.quantity) || 0),
    0
  );
  const averageValue = totalItems > 0 ? (totalValue / totalItems).toFixed(2) : 0;

  // 1. COLLEGE COMBO CHART DATA
  const chartData = useMemo(() => {
    const map = filteredData.reduce((acc, curr) => {
      const college = curr.college || "Other";
      const qty = Number(curr.quantity) || 0;

      if (!acc[college]) {
        acc[college] = { college, totalQuantity: 0, totalVisits: 0 };
      }

      acc[college].totalQuantity += qty;
      acc[college].totalVisits += 1;
      return acc;
    }, {});
    return Object.values(map);
  }, [filteredData]);

  // 2. UNIT CODE COMPARISON DATA
  const unitCodeChartData = useMemo(() => {
    return groupedByUnitCode.map((g) => ({
      unitCode: g.unitCode,
      totalQuantity: g.totalQuantity,
      totalVisits: g.rows.length,
    }));
  }, [groupedByUnitCode]);

  // 3. PIE CHART - ACTIVITY TYPE SHARE
  const activityPieData = useMemo(() => {
    const map = filteredData.reduce((acc, curr) => {
      const activity = curr.activity_type || "Other";
      if (!acc[activity]) {
        acc[activity] = { name: activity, value: 0 };
      }
      acc[activity].value += 1;
      return acc;
    }, {});
    return Object.values(map);
  }, [filteredData]);

  // 4. HISTOGRAM - QUANTITY DISTRIBUTION
  const histogramData = useMemo(() => {
    const map = {};
    filteredData.forEach((record) => {
      const quantity = Number(record.quantity);
      if (Number.isNaN(quantity)) return;

      const bucketStart = Math.floor(quantity / 10) * 10;
      const bucketEnd = bucketStart + 9;
      const label = `${bucketStart}-${bucketEnd}`;

      if (!map[label]) {
        map[label] = { range: label, start: bucketStart, count: 0 };
      }
      map[label].count += 1;
    });
    return Object.values(map).sort((a, b) => a.start - b.start);
  }, [filteredData]);

  // 5. LINE CHART - ACTIVITY OVER TIME
  const trendData = useMemo(() => {
    const map = {};
    filteredData.forEach((record) => {
      const date = new Date(record.activity_date);
      if (Number.isNaN(date.getTime())) return;

      const dateKey = date.toLocaleDateString();
      if (!map[dateKey]) {
        map[dateKey] = {
          date: dateKey,
          dateValue: date.getTime(),
          quantity: 0,
          visits: 0,
        };
      }
      map[dateKey].quantity += Number(record.quantity) || 0;
      map[dateKey].visits += 1;
    });
    return Object.values(map).sort((a, b) => a.dateValue - b.dateValue);
  }, [filteredData]);

  // 6. SCATTERPLOT - QUANTITY BY DATE
  const scatterData = useMemo(() => {
    return filteredData
      .map((record) => {
        const date = new Date(record.activity_date);
        const quantity = Number(record.quantity);
        if (Number.isNaN(date.getTime()) || Number.isNaN(quantity)) return null;

        return {
          date: date.toLocaleDateString(),
          dateValue: date.getTime(),
          quantity,
          activity: record.activity_type || "Other",
        };
      })
      .filter(Boolean);
  }, [filteredData]);

  // 7. CLASS STANDING BREAKDOWN DATA
  const classStandingData = useMemo(() => {
    const order = [
      "Freshman",
      "Sophomore",
      "Junior",
      "Senior",
      "Masters",
      "Doctoral",
    ];
    const map = filteredData.reduce((acc, curr) => {
      const standing = curr.class_standing || "Unspecified";
      if (!acc[standing]) {
        acc[standing] = { standing, visits: 0, quantity: 0 };
      }
      acc[standing].visits += 1;
      acc[standing].quantity += Number(curr.quantity) || 0;
      return acc;
    }, {});

    return Object.values(map).sort((a, b) => {
      const idxA = order.indexOf(a.standing);
      const idxB = order.indexOf(b.standing);
      if (idxA === -1 && idxB === -1) return a.standing.localeCompare(b.standing);
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });
  }, [filteredData]);

  // 8. HOUSING STATUS SHARE DATA
  const housingPieData = useMemo(() => {
    const map = filteredData.reduce((acc, curr) => {
      const housing = curr.housing || "Unspecified";
      if (!acc[housing]) {
        acc[housing] = { name: housing, value: 0 };
      }
      acc[housing].value += 1;
      return acc;
    }, {});
    return Object.values(map);
  }, [filteredData]);

  // 9. STUDENT SUPPORT INDICATORS (PELL / FIRST-GEN / TRANSFER)
  const supportIndicatorsData = useMemo(() => {
    let pellCount = 0;
    let firstGenCount = 0;
    let transferCount = 0;

    filteredData.forEach((row) => {
      if (row.pell_eligible) pellCount += 1;
      if (row.first_gen) firstGenCount += 1;
      if (row.transfer || row.transfer_student) transferCount += 1;
    });

    return [
      { indicator: "Pell Eligible", count: pellCount },
      { indicator: "First-Generation", count: firstGenCount },
      { indicator: "Transfer Student", count: transferCount },
    ];
  }, [filteredData]);

  // HELPER: Exclude internal Mongo metadata keys & unit_code (already shown in each table header)
  const getDisplayKeys = (obj) => {
    if (!obj) return [];

    const hiddenFields = [
      "_id",
      "__v",
      "createdAt",
      "updatedAt",
      "unit_code",
      "uploadedBy",
      "fileName",
      "fileType",
    ];

    // Hide parent organization column for non-admin users since all rows belong to their org
    if (!isAdmin) {
      hiddenFields.push("organization");
    }

    return Object.keys(obj).filter((key) => !hiddenFields.includes(key));
  };

  // Format cell values cleanly (dates, booleans, populated org objects, empty strings)
  const formatCellValue = (key, value) => {
    if (value === null || value === undefined || value === "") return "—";
    if (key === "organization" && typeof value === "object") {
      return value.name ? value.name.toUpperCase() : "—";
    }
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (typeof value === "object") return JSON.stringify(value);
    if (key === "activity_date") {
      const d = new Date(value);
      if (!Number.isNaN(d.getTime())) return d.toLocaleDateString();
    }
    return String(value);
  };

  // Dropdown summary label
  const visualizationDropdownLabel = useMemo(() => {
    if (selectedCharts.length === 0) return "Select one or more charts...";
    if (selectedCharts.length === VISUALIZATION_OPTIONS.length) {
      return `All Visualizations (${selectedCharts.length})`;
    }
    if (selectedCharts.length === 1) {
      const found = VISUALIZATION_OPTIONS.find(
        (opt) => opt.id === selectedCharts[0]
      );
      return found ? found.label : "1 selected";
    }
    return `${selectedCharts.length} visualizations selected`;
  }, [selectedCharts]);

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

      {/* ACCESS SCOPE BADGE */}
      <div style={{ marginBottom: "18px" }}>
        {isAdmin ? (
          <span
            style={{
              display: "inline-block",
              backgroundColor: "#111111",
              color: "#FFC20E",
              fontWeight: "bold",
              fontSize: "13px",
              padding: "5px 12px",
              borderRadius: "6px",
            }}
          >
            ADMIN VIEW — Showing records across all organizations
          </span>
        ) : (
          <span
            style={{
              display: "inline-block",
              backgroundColor: "#f8f9fa",
              border: "1px solid #dee2e6",
              color: "#111111",
              fontWeight: "600",
              fontSize: "13px",
              padding: "5px 12px",
              borderRadius: "6px",
            }}
          >
            Organization Scope:{" "}
            {orgName ? orgName.toUpperCase() : "Your Organization"}
          </span>
        )}
      </div>

      {/* 1. METRIC CARDS */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "20px",
          marginBottom: "24px",
        }}
      >
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
          <p style={metricStyle}>{groupedByUnitCode.length}</p>
        </div>
      </div>

      {/* 2. VISUALIZATIONS SECTION (RENDERS ONE OR MORE SELECTED CHARTS) */}
      <div style={{ marginBottom: "28px" }}>
        {selectedCharts.length === 0 ? (
          <div style={emptyStateStyle}>
            <p style={{ margin: "0 0 10px 0" }}>
              No visualizations selected. Choose one or more charts in the{" "}
              <strong>Visualization Type</strong> filter below.
            </p>
            <button
              type="button"
              onClick={() => setSelectedCharts(["college"])}
              style={resetButtonStyle}
            >
              Show Default Chart
            </button>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                selectedCharts.length > 1
                  ? "repeat(auto-fit, minmax(460px, 1fr))"
                  : "1fr",
              gap: "20px",
            }}
          >
            {/* 1. COLLEGE BAR + LINE CHART */}
            {selectedCharts.includes("college") && (
              <div style={chartCardStyle}>
                <h3>Impact by College</h3>
                <p style={chartDescriptionStyle}>
                  Compare total quantity distributed and student activity across
                  colleges.
                </p>
                <div style={{ width: "100%", height: 340 }}>
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
              </div>
            )}

            {/* 2. UNIT CODE / ORGANIZATION COMPARISON */}
            {selectedCharts.includes("unitCode") && (
              <div style={chartCardStyle}>
                <h3>Impact by Organization / Unit Code</h3>
                <p style={chartDescriptionStyle}>
                  Compare total quantity distributed and visit counts across
                  unit codes.
                </p>
                <div style={{ width: "100%", height: 340 }}>
                  <ResponsiveContainer>
                    <ComposedChart data={unitCodeChartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="unitCode" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Bar
                        yAxisId="left"
                        dataKey="totalQuantity"
                        name="Total Quantity"
                        fill="#111111"
                        radius={[6, 6, 0, 0]}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="totalVisits"
                        name="Events / Visits"
                        stroke="#FFC20E"
                        strokeWidth={3}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* 3. PIE CHART - ACTIVITY TYPE */}
            {selectedCharts.includes("pie") && (
              <div style={chartCardStyle}>
                <h3>Activity Type Distribution</h3>
                <p style={chartDescriptionStyle}>
                  Shows what percentage of recorded activity belongs to each
                  service type.
                </p>
                <div style={{ width: "100%", height: 340 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={activityPieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={115}
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
              </div>
            )}

            {/* 4. HISTOGRAM - QUANTITY DISTRIBUTION */}
            {selectedCharts.includes("histogram") && (
              <div style={chartCardStyle}>
                <h3>Quantity Distribution</h3>
                <p style={chartDescriptionStyle}>
                  Shows how frequently different quantity ranges appear in
                  uploaded records.
                </p>
                <div style={{ width: "100%", height: 340 }}>
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
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* 5. LINE CHART - ACTIVITY OVER TIME */}
            {selectedCharts.includes("trend") && (
              <div style={chartCardStyle}>
                <h3>Activity Over Time</h3>
                <p style={chartDescriptionStyle}>
                  Shows how service quantity and visits change over time.
                </p>
                <div style={{ width: "100%", height: 340 }}>
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
              </div>
            )}

            {/* 6. SCATTERPLOT - QUANTITY BY DATE */}
            {selectedCharts.includes("scatter") && (
              <div style={chartCardStyle}>
                <h3>Quantity by Date</h3>
                <p style={chartDescriptionStyle}>
                  Each point represents one activity record and the quantity
                  associated with it.
                </p>
                <div style={{ width: "100%", height: 340 }}>
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
              </div>
            )}

            {/* 7. CLASS STANDING BREAKDOWN */}
            {selectedCharts.includes("classStanding") && (
              <div style={chartCardStyle}>
                <h3>Class Standing Breakdown</h3>
                <p style={chartDescriptionStyle}>
                  Distribution of total quantity and visits across academic
                  class standings.
                </p>
                <div style={{ width: "100%", height: 340 }}>
                  <ResponsiveContainer>
                    <BarChart data={classStandingData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="standing" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="quantity"
                        name="Total Quantity"
                        fill="#FFC20E"
                        radius={[6, 6, 0, 0]}
                      />
                      <Bar
                        dataKey="visits"
                        name="Visits"
                        fill="#111111"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* 8. HOUSING STATUS SHARE (DONUT CHART) */}
            {selectedCharts.includes("housing") && (
              <div style={chartCardStyle}>
                <h3>Housing Status Share</h3>
                <p style={chartDescriptionStyle}>
                  Breakdown of student visits by On-Campus, Commuter, and
                  Off-Campus housing.
                </p>
                <div style={{ width: "100%", height: 340 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={housingPieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={115}
                        label
                      >
                        {housingPieData.map((entry, index) => (
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
              </div>
            )}

            {/* 9. STUDENT SUPPORT INDICATORS */}
            {selectedCharts.includes("demographics") && (
              <div style={chartCardStyle}>
                <h3>Student Support Indicators</h3>
                <p style={chartDescriptionStyle}>
                  Counts of records flagged as Pell Eligible, First-Generation,
                  or Transfer students.
                </p>
                <div style={{ width: "100%", height: 340 }}>
                  <ResponsiveContainer>
                    <BarChart data={supportIndicatorsData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" allowDecimals={false} />
                      <YAxis type="category" dataKey="indicator" width={130} />
                      <Tooltip />
                      <Bar
                        dataKey="count"
                        name="Student Records"
                        fill="#FFC20E"
                        radius={[0, 6, 6, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. ADVANCED FILTER PANEL (BELOW VISUALIZATIONS, ABOVE RECORDS) */}
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
          {/* Multi-Select Visualization Type Dropdown */}
          <div
            style={{ ...filterGroupStyle, position: "relative" }}
            ref={chartDropdownRef}
          >
            <label style={labelStyle}>
              Visualization Type (Select 1 or More)
            </label>
            <button
              type="button"
              onClick={() => setIsChartDropdownOpen((prev) => !prev)}
              style={multiSelectTriggerStyle}
            >
              <span
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {visualizationDropdownLabel}
              </span>
              <span style={{ fontSize: "11px", marginLeft: "8px" }}>
                {isChartDropdownOpen ? "▲" : "▼"}
              </span>
            </button>

            {isChartDropdownOpen && (
              <div style={multiSelectMenuStyle}>
                <div style={multiSelectActionsStyle}>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedCharts(VISUALIZATION_OPTIONS.map((o) => o.id))
                    }
                    style={miniLinkButtonStyle}
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedCharts([])}
                    style={miniLinkButtonStyle}
                  >
                    Clear
                  </button>
                </div>

                {VISUALIZATION_OPTIONS.map((opt) => {
                  const checked = selectedCharts.includes(opt.id);
                  return (
                    <label key={opt.id} style={multiSelectOptionStyle}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleChartSelection(opt.id)}
                        style={{ accentColor: "#FFC20E", cursor: "pointer" }}
                      />
                      <span>{opt.label}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Keyword Search */}
          <div style={filterGroupStyle}>
            <label style={labelStyle}>Keyword Search</label>
            <input
              type="text"
              placeholder="Search event, college, term..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Organization / Unit Code */}
          <div style={filterGroupStyle}>
            <label style={labelStyle}>Organization (Unit Code)</label>
            <select
              value={selectedUnitCode}
              onChange={(e) => setSelectedUnitCode(e.target.value)}
              style={inputStyle}
            >
              {unitCodeOptions.map((code) => (
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

      {/* 4. SEPARATE DATA TABLES PER UNIT_CODE (ORGANIZATION CODE) */}
      <div style={{ marginTop: "30px" }}>
        <h3 style={{ marginBottom: "15px" }}>
          Records by Organization Code ({groupedByUnitCode.length})
        </h3>

        {groupedByUnitCode.length === 0 ? (
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
          groupedByUnitCode.map((group) => {
            const displayKeys = getDisplayKeys(group.rows[0]);

            return (
              <div key={group.unitCode} style={orgSectionCardStyle}>
                <div style={orgSectionHeaderStyle}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <span style={orgBadgeStyle}>{group.unitCode}</span>
                    <h4
                      style={{
                        margin: 0,
                        fontSize: "16px",
                        color: "#111111",
                      }}
                    >
                      Unit / Organization Code: {group.unitCode}
                    </h4>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "16px",
                      fontSize: "14px",
                      color: "#495057",
                    }}
                  >
                    <span>
                      <strong>Records:</strong> {group.rows.length}
                    </span>
                    <span>
                      <strong>Total Quantity:</strong>{" "}
                      {group.totalQuantity.toLocaleString()}
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
                      {group.rows.map((row, idx) => (
                        <tr key={row._id || idx}>
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

// STYLES
const cardStyle = {
  flex: "1 1 200px",
  backgroundColor: "#ffffff",
  border: "1px solid #dee2e6",
  borderTop: "4px solid #FFC20E",
  borderRadius: "8px",
  padding: "16px 20px",
  boxShadow: "0 2px 4px rgba(0,0,0,0.04)",
};

const chartCardStyle = {
  backgroundColor: "#ffffff",
  border: "1px solid #dee2e6",
  borderRadius: "8px",
  padding: "20px",
  boxShadow: "0 2px 4px rgba(0,0,0,0.04)",
};

const filterPanelStyle = {
  backgroundColor: "#ffffff",
  border: "1px solid #dee2e6",
  borderRadius: "8px",
  padding: "18px 20px",
  marginBottom: "24px",
  boxShadow: "0 2px 4px rgba(0,0,0,0.04)",
};

const filterHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "14px",
  paddingBottom: "10px",
  borderBottom: "1px solid #e9ecef",
};

const filterGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
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

const multiSelectTriggerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "8px 10px",
  borderRadius: "4px",
  border: "1px solid #ccc",
  backgroundColor: "#ffffff",
  fontSize: "14px",
  cursor: "pointer",
  textAlign: "left",
};

const multiSelectMenuStyle = {
  position: "absolute",
  top: "100%",
  left: 0,
  right: 0,
  zIndex: 50,
  marginTop: "4px",
  backgroundColor: "#ffffff",
  border: "1px solid #ced4da",
  borderRadius: "6px",
  boxShadow: "0 6px 16px rgba(0,0,0,0.12)",
  maxHeight: "260px",
  overflowY: "auto",
  padding: "6px 0",
};

const multiSelectActionsStyle = {
  display: "flex",
  justifyContent: "space-between",
  padding: "4px 12px 8px",
  borderBottom: "1px solid #e9ecef",
  marginBottom: "4px",
};

const miniLinkButtonStyle = {
  background: "none",
  border: "none",
  color: "#111111",
  fontWeight: "bold",
  fontSize: "12px",
  cursor: "pointer",
  textDecoration: "underline",
  padding: 0,
};

const multiSelectOptionStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  padding: "6px 12px",
  fontSize: "13px",
  color: "#212529",
  cursor: "pointer",
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
