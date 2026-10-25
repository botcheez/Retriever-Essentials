// Reusable error box. Renders nothing when there is no message, so you can
// always drop it in and pass your error state:
//   <ErrorMessage message={error} />
function ErrorMessage({ message }) {
  if (!message) return null;

  return (
    <div className="error-message" role="alert">
      {message}
    </div>
  );
}

export default ErrorMessage;
