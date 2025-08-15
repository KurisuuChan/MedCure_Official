import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { X, UserPlus } from "lucide-react";

const AddEditContactModal = ({
  isOpen,
  onClose,
  onSave,
  contact,
  contactType,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    phone: "",
    email: "",
    bloodGroup: "N/A",
  });

  useEffect(() => {
    if (contact) {
      setFormData({
        name: contact.name || "",
        role: contact.role || "",
        phone: contact.phone || "",
        email: contact.email || "",
        bloodGroup: contact.bloodGroup || "N/A",
      });
    } else {
      setFormData({
        name: "",
        role: "",
        phone: "",
        email: "",
        bloodGroup: "N/A",
      });
    }
  }, [contact, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  const title = `${contact ? "Edit" : "Add"} ${contactType}`;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between mb-6 pb-4 border-b">
          <div className="flex items-center gap-3">
            <UserPlus className="text-blue-600" size={24} />
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Full Name"
              className="w-full p-3 border rounded-lg"
              required
            />
            <input
              name="role"
              value={formData.role}
              onChange={handleChange}
              placeholder="Role (e.g., Representative)"
              className="w-full p-3 border rounded-lg"
            />
          </div>
          <input
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email Address"
            className="w-full p-3 border rounded-lg"
            required
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Phone Number"
              className="w-full p-3 border rounded-lg"
            />
            <input
              name="bloodGroup"
              value={formData.bloodGroup}
              onChange={handleChange}
              placeholder="Blood Group"
              className="w-full p-3 border rounded-lg"
            />
          </div>
          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 rounded-lg font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold"
            >
              Save Contact
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

AddEditContactModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  contact: PropTypes.object,
  contactType: PropTypes.string.isRequired,
};

export default AddEditContactModal;
