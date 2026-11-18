import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { get } from "../../api";

function Profile() {

  const { user } = useAuth();

  const [records, setRecords] = useState([]);
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {

    async function loadOverview() {

      try {

        setLoading(true);
        setError("");

        const [dataResult, uploadResult] = await Promise.all([
          get("/data"),
          get("/data/uploads")
        ]);

        setRecords(dataResult.data || []);
        setUploads(uploadResult.uploads || []);

      }

      catch (err) {

        console.log("Error loading overview:", err);
        setError(err.message);

      }

      finally {
        setLoading(false);
      }
    }

    loadOverview();

  }, []);


  const totalRecords = records.length;

  const totalQuantity = records.reduce(
    (total, record) => total + (Number(record.quantity) || 0),
    0
  );

  const totalUploads = uploads.length;

  const averageQuantity =
    totalRecords > 0
      ? (totalQuantity / totalRecords).toFixed(1)
      : 0;


  // Count how many records belong to each activity type.
  const activityCounts = records.reduce((counts, record) => {

    const activity = record.activity_type || "Other";

    counts[activity] = (counts[activity] || 0) + 1;

    return counts;

  }, {});


  const topActivities = Object.entries(activityCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);


  const latestUpload = uploads[0];


  if (loading) {
    return <p>Loading overview...</p>;
  }

  if (error) {
    return (
      <div>
        <h2>Unable to load overview</h2>
        <p>{error}</p>
      </div>
    );
  }


  return (
    <div>

      <div className="overview-header">

        <h1>
          {user?.organization?.name || "Organization Overview"}
        </h1>

        <p>
          Logged in as {user?.email}
        </p>

        <p>
          Overview of your organization's Retriever Essentials activity.
        </p>

      </div>


      <div className="analytics-grid">

        <div className="analytics-card">
          <h4>Total Records</h4>
          <p className="analytics-number">
            {totalRecords}
          </p>
        </div>


        <div className="analytics-card">
          <h4>Total Quantity Distributed</h4>
          <p className="analytics-number">
            {totalQuantity.toLocaleString()}
          </p>
        </div>


        <div className="analytics-card">
          <h4>Total Uploads</h4>
          <p className="analytics-number">
            {totalUploads}
          </p>
        </div>


        <div className="analytics-card">
          <h4>Average / Record</h4>
          <p className="analytics-number">
            {averageQuantity}
          </p>
        </div>

      </div>


      <div className="overview-sections">

        <div className="dashboard-card">

          <h2>Recent Upload</h2>

          {!latestUpload ? (

            <p>No files have been uploaded yet.</p>

          ) : (

            <div>

              <h3>{latestUpload.fileName}</h3>

              <p>
                {latestUpload.recordsUploaded} records
              </p>

              <p>
                Uploaded by{" "}
                {latestUpload.uploadedBy?.email || "Unknown"}
              </p>

              <p>
                {new Date(
                  latestUpload.createdAt
                ).toLocaleString()}
              </p>

            </div>

          )}

        </div>


        <div className="dashboard-card">

          <h2>Top Activity Types</h2>

          {topActivities.length === 0 ? (

            <p>No activity data available.</p>

          ) : (

            topActivities.map(([activity, count]) => (

              <div
                className="activity-row"
                key={activity}
              >

                <span>{activity}</span>

                <span className="activity-count">
                  {count}
                </span>

              </div>

            ))

          )}

        </div>

      </div>

    </div>
  );
}

export default Profile;