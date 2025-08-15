import React, { useState, useMemo } from "react";
import PropTypes from "prop-types";
import {
  Search,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Users,
  Loader2,
} from "lucide-react";
import { useSuppliers } from "@/hooks/useSuppliers.jsx";
import AddEditContactModal from "@/dialogs/AddEditContactModal.jsx";

// Contact Card Component
const ContactCard = ({ contact, onEdit, onDelete }) => (
  <div className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-lg hover:border-blue-500 transition-all duration-300 flex flex-col">
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-4">
        <img
          src={`https://i.pravatar.cc/150?u=${contact.email}`}
          alt={contact.name}
          className="w-14 h-14 rounded-full object-cover"
        />
        <div>
          <h3 className="font-bold text-lg text-gray-800">{contact.name}</h3>
          <span className="text-xs font-medium bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
            {contact.role}
          </span>
        </div>
      </div>
      {/* Dropdown can be added here if needed */}
    </div>
    <div className="grid grid-cols-2 gap-y-4 gap-x-2 mt-6 text-sm flex-grow">
      <div>
        <p className="text-gray-500">Phone</p>
        <p className="font-medium text-gray-700 break-words">
          {contact.phone || "N/A"}
        </p>
      </div>
      <div>
        <p className="text-gray-500">Blood Group</p>
        <p className="font-medium text-gray-700">
          {contact.bloodGroup || "N/A"}
        </p>
      </div>
      <div className="col-span-2">
        <p className="text-gray-500">Email</p>
        <p className="font-medium text-gray-700 break-words">{contact.email}</p>
      </div>
    </div>
    <div className="flex justify-end gap-2 mt-4 border-t pt-4">
      <button
        onClick={() => onEdit(contact)}
        className="p-2 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-100"
        title="Edit"
      >
        <Edit size={16} />
      </button>
      <button
        onClick={() => onDelete(contact.id)}
        className="p-2 text-gray-500 hover:text-red-600 rounded-full hover:bg-gray-100"
        title="Delete"
      >
        <Trash2 size={16} />
      </button>
    </div>
  </div>
);

ContactCard.propTypes = {
  contact: PropTypes.object.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

// Main Contacts Component
const Contacts = () => {
  const [activeTab, setActiveTab] = useState("Suppliers");
  const { suppliers, isLoading, addSupplier, updateSupplier, deleteSupplier } =
    useSuppliers();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const handleOpenModal = (contact = null) => {
    setEditingContact(contact);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingContact(null);
    setIsModalOpen(false);
  };

  const handleSaveContact = (data) => {
    if (editingContact) {
      updateSupplier({ id: editingContact.id, data });
    } else {
      addSupplier(data);
    }
    handleCloseModal();
  };

  const filteredSuppliers = useMemo(
    () =>
      suppliers.filter(
        (s) =>
          s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.email.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [suppliers, searchTerm]
  );

  const employees = []; // Placeholder for employees feature
  const dataToShow = activeTab === "Suppliers" ? filteredSuppliers : employees;
  const addButtonText =
    activeTab === "Suppliers" ? "Add New Supplier" : "Add New Employee";

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="animate-spin text-blue-500" size={40} />
        </div>
      );
    }
    if (dataToShow.length === 0) {
      return (
        <div className="text-center py-20 text-gray-500">
          <Users size={48} className="mx-auto mb-4" />
          <h2 className="text-2xl font-semibold">No Contacts Found</h2>
          <p>
            {searchTerm
              ? `No results for "${searchTerm}".`
              : `Click "Add New ${activeTab.slice(0, -1)}" to get started.`}
          </p>
        </div>
      );
    }
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {dataToShow.map((contact) => (
          <ContactCard
            key={contact.id}
            contact={contact}
            onEdit={handleOpenModal}
            onDelete={deleteSupplier}
          />
        ))}
      </div>
    );
  };

  return (
    <>
      <AddEditContactModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveContact}
        contact={editingContact}
        contactType={activeTab === "Suppliers" ? "Supplier" : "Employee"}
      />
      <div className="bg-white p-6 rounded-xl shadow-sm">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          {/* Tabs */}
          <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-full">
            <button
              onClick={() => setActiveTab("Suppliers")}
              className={`px-6 py-2 rounded-full text-sm font-semibold ${
                activeTab === "Suppliers"
                  ? "bg-blue-600 text-white shadow"
                  : "text-gray-600"
              }`}
            >
              Suppliers
            </button>
            <button
              onClick={() => setActiveTab("Employees")}
              disabled
              className={`px-6 py-2 rounded-full text-sm font-semibold ${
                activeTab === "Employees"
                  ? "bg-blue-600 text-white shadow"
                  : "text-gray-600 opacity-50 cursor-not-allowed"
              }`}
            >
              Employees
            </button>
          </div>

          {/* Search and Add Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Search by name or email"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search
                size={16}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
              />
            </div>
            <button
              onClick={() => handleOpenModal()}
              disabled={activeTab !== "Suppliers"}
              className="flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-blue-700 shadow disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
            >
              <Plus size={18} />
              {addButtonText}
            </button>
          </div>
        </div>
        {renderContent()}
      </div>
    </>
  );
};

export default Contacts;
