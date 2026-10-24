// Reusable loading indicator. Show it while waiting on the backend.
// Usage: if (loading) return <Loading />;
//        <Loading message="Uploading..." />
function Loading({ message = "Loading..." }) {
  return (
    <div className="loading" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}

export default Loading;
