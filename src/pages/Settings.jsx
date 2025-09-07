import { useState, useEffect } from "react";
import {
  User,
  Shield,
  Database,
  Bell,
  Eye,
  EyeOff,
  Save,
  UserPlus,
  Edit,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";

export const Settings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [profile, setProfile] = useState({
    full_name: "",
    phone: "",
    address: "",
  });

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    fetchUserProfile();
    if (isAdmin) {
      fetchUsers();
      fetchCategories();
    }
  }, [isAdmin]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      if (data) {
        setProfile({
          full_name: data.full_name || "",
          phone: data.phone || "",
          address: data.address || "",
        });
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");

      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  const updateProfile = async () => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from("user_profiles")
        .update(profile)
        .eq("id", user.id);

      if (error) throw error;
      alert("Profile updated successfully");
    } catch (err) {
      console.error("Error updating profile:", err);
      alert("Error updating profile: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({ is_active: !currentStatus })
        .eq("id", userId);

      if (error) throw error;
      alert("User status updated successfully");
      fetchUsers();
    } catch (err) {
      console.error("Error updating user status:", err);
      alert("Error updating user status: " + err.message);
    }
  };

  const deleteCategory = async (categoryId) => {
    if (!window.confirm("Are you sure you want to delete this category?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", categoryId);

      if (error) throw error;
      alert("Category deleted successfully");
      fetchCategories();
    } catch (err) {
      console.error("Error deleting category:", err);
      alert("Error deleting category: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">
            Configure system settings and user management
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="px-4 py-2">
            <Shield className="h-4 w-4 mr-2" />
            {user?.role}
          </Badge>
        </div>
      </div>

      {/* Profile Settings */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <User className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">
            Profile Settings
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Full Name"
            value={profile.full_name}
            onChange={(e) =>
              setProfile((prev) => ({ ...prev, full_name: e.target.value }))
            }
          />
          <Input
            label="Email"
            value={user?.email || ""}
            disabled
            className="bg-muted"
          />
          <Input
            label="Phone"
            value={profile.phone}
            onChange={(e) =>
              setProfile((prev) => ({ ...prev, phone: e.target.value }))
            }
          />
          <Input
            label="Role"
            value={user?.role || ""}
            disabled
            className="bg-muted"
          />
        </div>

        <div className="mt-4">
          <Input
            label="Address"
            value={profile.address}
            onChange={(e) =>
              setProfile((prev) => ({ ...prev, address: e.target.value }))
            }
          />
        </div>

        <div className="flex justify-end mt-6">
          <Button onClick={updateProfile} disabled={loading}>
            {loading ? (
              <LoadingSpinner size="sm" className="mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Update Profile
          </Button>
        </div>
      </Card>

      {/* Admin Only Sections */}
      {isAdmin && (
        <>
          {/* User Management */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">
                  User Management
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={fetchUsers} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-4 font-medium text-foreground">
                      User
                    </th>
                    <th className="text-left p-4 font-medium text-foreground">
                      Role
                    </th>
                    <th className="text-left p-4 font-medium text-foreground">
                      Status
                    </th>
                    <th className="text-left p-4 font-medium text-foreground">
                      Last Login
                    </th>
                    <th className="text-left p-4 font-medium text-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((userItem) => (
                    <tr
                      key={userItem.id}
                      className="border-t border-border hover:bg-muted/30"
                    >
                      <td className="p-4">
                        <div>
                          <p className="font-medium text-foreground">
                            {userItem.full_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {userItem.email}
                          </p>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge
                          variant={
                            userItem.role === "admin"
                              ? "destructive"
                              : userItem.role === "pharmacist"
                              ? "warning"
                              : "secondary"
                          }
                          size="sm"
                        >
                          {userItem.role}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge
                          variant={userItem.is_active ? "success" : "secondary"}
                          size="sm"
                        >
                          {userItem.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm text-foreground">
                        {userItem.last_login
                          ? new Date(userItem.last_login).toLocaleDateString()
                          : "Never"}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              toggleUserStatus(userItem.id, userItem.is_active)
                            }
                            disabled={userItem.id === user.id}
                          >
                            {userItem.is_active ? (
                              <EyeOff className="h-3 w-3" />
                            ) : (
                              <Eye className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Category Management */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Database className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">
                  Category Management
                </h2>
              </div>
              <Button onClick={() => setShowAddCategory(true)} size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="p-4 border border-border rounded-lg"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-foreground">
                        {category.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {category.description}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteCategory(category.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* System Information */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Bell className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">
                System Information
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-foreground mb-2">
                    Database Status
                  </h3>
                  <Badge variant="success" size="sm">
                    Connected
                  </Badge>
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-2">
                    Total Users
                  </h3>
                  <p className="text-2xl font-bold text-foreground">
                    {users.length}
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-foreground mb-2">
                    System Version
                  </h3>
                  <p className="text-foreground">Medcure Pharmacy v1.0.0</p>
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-2">
                    Last Updated
                  </h3>
                  <p className="text-foreground">
                    {new Date().toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </>
      )}

      {/* Add Category Modal */}
      {showAddCategory && (
        <CategoryModal
          onSave={fetchCategories}
          onCancel={() => setShowAddCategory(false)}
        />
      )}
    </div>
  );
};

// Category Modal Component
const CategoryModal = ({ onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from("categories").insert([formData]);

      if (error) throw error;
      alert("Category created successfully");
      onSave();
      onCancel();
    } catch (err) {
      console.error("Error creating category:", err);
      alert("Error creating category: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg p-6 w-full max-w-md m-4">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Add New Category
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Category Name"
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            required
          />
          <textarea
            placeholder="Description (optional)"
            value={formData.description}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, description: e.target.value }))
            }
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
            rows={3}
          />
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <LoadingSpinner size="sm" className="mr-2" /> : null}
              Create Category
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
