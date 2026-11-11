import { useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { post } from "../../api";
import Input from "../../components/Input";
import Button from "../../components/Button";
import ErrorMessage from "../../components/ErrorMessage";
import Modal from "../../components/Modal";
import "../../styles/Settings.css";

// for when connecting backend
const NOT_AVAILABLE = "Saving isn't available yet. The server doesn't support this change.";

function Settings() {
  const { user } = useAuth();

  // contact info
  const [contact, setContact] = useState({
    email: user?.email || "",
    phone: user?.phone || "",
  });
  const [contactError, setContactError] = useState("");
  const [contactNotice, setContactNotice] = useState("");

  // password popup
  const [passwordStep, setPasswordStep] = useState(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPasswords, setNewPasswords] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState("");
  const [passwordNotice, setPasswordNotice] = useState("");
  const [verifying, setVerifying] = useState(false);
  const verifyRequest = useRef(0);

  // delete account popup
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleteNotice, setDeleteNotice] = useState("");

  const contactChanged =
    contact.email.trim().toLowerCase() !== (user?.email || "") ||
    contact.phone.trim() !== (user?.phone || "");

  function handleContactChange(e) {
    setContact({ ...contact, [e.target.name]: e.target.value });
    setContactError("");
    setContactNotice("");
  }

  function handleContactSubmit(e) {
    e.preventDefault();

    if (!contact.email.trim() || !contact.phone.trim()) {
      setContactError("Email and phone are required.");
      return;
    }
    if (!/^[0-9()+\-\s]{7,}$/.test(contact.phone.trim())) {
      setContactError("Enter a valid phone number.");
      return;
    }

    setContactError("");
    // TODO: backend route for contacts
    setContactNotice(NOT_AVAILABLE);
  }

  function resetPasswordForm() {
    verifyRequest.current += 1;
    setCurrentPassword("");
    setNewPasswords({ newPassword: "", confirmPassword: "" });
    setPasswordError("");
    setPasswordNotice("");
    setVerifying(false);
  }

  function openPasswordModal() {
    resetPasswordForm();
    setPasswordStep("verify");
  }

  function closePasswordModal() {
    resetPasswordForm();
    setPasswordStep(null);
  }

  async function handleVerifySubmit(e) {
    e.preventDefault();

    if (!user?.email) {
      setPasswordError("Log in again to change your password.");
      return;
    }

    const requestId = ++verifyRequest.current;
    setVerifying(true);
    setPasswordError("");

    // filler for when we get an actual route to update password
    try {
      await post("/auth/login", { email: user.email, password: currentPassword });
      if (requestId !== verifyRequest.current) return;
      setPasswordStep("new");
    } catch (err) {
      if (requestId !== verifyRequest.current) return;
      setPasswordError(
        err.data?.message === "Invalid email or password" ? "Incorrect password." : err.message
      );
    } finally {
      if (requestId === verifyRequest.current) setVerifying(false);
    }
  }

  function handleNewPasswordChange(e) {
    setNewPasswords({ ...newPasswords, [e.target.name]: e.target.value });
    setPasswordError("");
    setPasswordNotice("");
  }

  function handleNewPasswordSubmit(e) {
    e.preventDefault();

    if (newPasswords.newPassword.length < 9) {
      setPasswordError("New password must be at least 9 characters.");
      return;
    }
    if (newPasswords.newPassword !== newPasswords.confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }
    if (newPasswords.newPassword === currentPassword) {
      setPasswordError("New password must be different from your current password.");
      return;
    }

    setPasswordError("");
    setPasswordNotice(NOT_AVAILABLE);
  }

  function openDeleteModal() {
    setDeleteConfirm("");
    setDeletePassword("");
    setDeleteError("");
    setDeleteNotice("");
    setDeleteOpen(true);
  }

  function closeDeleteModal() {
    setDeleteOpen(false);
    setDeleteConfirm("");
    setDeletePassword("");
    setDeleteError("");
    setDeleteNotice("");
  }

  function handleDeleteSubmit(e) {
    e.preventDefault();

    if (deleteConfirm !== "DELETE") {
      setDeleteError('Type DELETE in capital letters to confirm.');
      return;
    }
    if (!deletePassword) {
      setDeleteError("Enter your password.");
      return;
    }

    setDeleteError("");
    setDeleteNotice(NOT_AVAILABLE);
  }

  const canDelete = deleteConfirm === "DELETE" && deletePassword !== "";

  return (
    <div>
      <h1>Settings</h1>

      <div className="settings-page">
        <section className="dashboard-card settings-card">
          <h2>Contact info</h2>
          <p className="settings-hint">Update the email and phone number on your account.</p>

          <form className="settings-form" onSubmit={handleContactSubmit}>
            <Input
              id="settings-email"
              label="Email"
              type="email"
              name="email"
              autoComplete="email"
              value={contact.email}
              onChange={handleContactChange}
              required
            />
            <Input
              id="settings-phone"
              label="Phone"
              type="tel"
              name="phone"
              autoComplete="tel"
              value={contact.phone}
              onChange={handleContactChange}
              required
            />

            <ErrorMessage message={contactError} />
            {contactNotice && <p className="settings-notice">{contactNotice}</p>}

            <Button type="submit" disabled={!contactChanged}>
              Save contact info
            </Button>
          </form>
        </section>

        <section className="dashboard-card settings-card">
          <h2>Password</h2>
          <p className="settings-hint">You'll confirm your current password before choosing a new one.</p>
          <Button type="button" onClick={openPasswordModal}>
            Change password
          </Button>
        </section>

        <section className="dashboard-card settings-card settings-danger">
          <h2>Delete account</h2>
          <p className="settings-hint">
            Permanently delete your account. This can't be undone.
          </p>
          <button type="button" className="btn btn-danger" onClick={openDeleteModal}>
            Delete account
          </button>
        </section>
      </div>

      <Modal
        open={passwordStep !== null}
        title={passwordStep === "new" ? "Choose a new password" : "Confirm your password"}
        onClose={closePasswordModal}
      >
        {passwordStep === "verify" && (
          <form className="settings-form" onSubmit={handleVerifySubmit}>
            <p className="settings-hint">Enter your current password to continue.</p>
            <Input
              id="settings-current-password"
              label="Current password"
              type="password"
              name="currentPassword"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => {
                setCurrentPassword(e.target.value);
                setPasswordError("");
              }}
              autoFocus
              required
            />

            <ErrorMessage message={passwordError} />

            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={closePasswordModal}>
                Cancel
              </button>
              <Button type="submit" disabled={verifying || !currentPassword}>
                {verifying ? "Checking..." : "Continue"}
              </Button>
            </div>
          </form>
        )}

        {passwordStep === "new" && (
          <form className="settings-form" onSubmit={handleNewPasswordSubmit}>
            <p className="settings-hint">Use at least 9 characters.</p>
            <Input
              id="settings-new-password"
              label="New password"
              type="password"
              name="newPassword"
              autoComplete="new-password"
              value={newPasswords.newPassword}
              onChange={handleNewPasswordChange}
              autoFocus
              required
            />
            <Input
              id="settings-confirm-password"
              label="Confirm new password"
              type="password"
              name="confirmPassword"
              autoComplete="new-password"
              value={newPasswords.confirmPassword}
              onChange={handleNewPasswordChange}
              required
            />

            <ErrorMessage message={passwordError} />
            {passwordNotice && <p className="settings-notice">{passwordNotice}</p>}

            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={closePasswordModal}>
                Cancel
              </button>
              <Button type="submit">Save password</Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal open={deleteOpen} title="Delete your account?" onClose={closeDeleteModal}>
        <form className="settings-form" onSubmit={handleDeleteSubmit}>
          <p className="settings-warning">
            Your account ({user?.email}) will be permanently deleted and you'll be logged out.
            This can't be undone.
          </p>
          <Input
            id="settings-delete-confirm"
            label="Type DELETE to confirm"
            type="text"
            name="deleteConfirm"
            autoComplete="off"
            value={deleteConfirm}
            onChange={(e) => {
              setDeleteConfirm(e.target.value);
              setDeleteError("");
              setDeleteNotice("");
            }}
            autoFocus
            required
          />
          <Input
            id="settings-delete-password"
            label="Password"
            type="password"
            name="deletePassword"
            autoComplete="current-password"
            value={deletePassword}
            onChange={(e) => {
              setDeletePassword(e.target.value);
              setDeleteError("");
              setDeleteNotice("");
            }}
            required
          />

          <ErrorMessage message={deleteError} />
          {deleteNotice && <p className="settings-notice">{deleteNotice}</p>}

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={closeDeleteModal}>
              Cancel
            </button>
            <button type="submit" className="btn btn-danger" disabled={!canDelete}>
              Delete account
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Settings;
