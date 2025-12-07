import { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { Client, ClientStatus, PaymentFrequency } from "@/types/database";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/Toast";

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  client?: Client | null;
}

export default function ClientModal({
  isOpen,
  onClose,
  onSuccess,
  client,
}: ClientModalProps) {
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    product_service: "",
    setup_fee: "",
    contract_value: "",
    payment_frequency: "monthly" as PaymentFrequency,
    next_payment_date: "",
    status: "active" as ClientStatus,
    notes: "",
  });

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name,
        company: client.company || "",
        email: client.email || "",
        phone: client.phone || "",
        product_service: client.product_service || "",
        setup_fee: client.setup_fee?.toString() || "",
        contract_value: client.contract_value?.toString() || "",
        payment_frequency: client.payment_frequency,
        next_payment_date: client.next_payment_date || "",
        status: client.status,
        notes: client.notes || "",
      });
    } else {
      // Reset form for new client
      setFormData({
        name: "",
        company: "",
        email: "",
        phone: "",
        product_service: "",
        setup_fee: "",
        contract_value: "",
        payment_frequency: "monthly",
        next_payment_date: "",
        status: "active",
        notes: "",
      });
    }
  }, [client, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      showToast("Client name is required", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      // Helper function to convert empty strings to null
      const toNullIfEmpty = (value: string) => {
        const trimmed = value.trim();
        return trimmed === "" ? null : trimmed;
      };

      // Build data object - only include setup_fee if it has a value
      const dataToSubmit: any = {
        name: formData.name.trim(),
        company: toNullIfEmpty(formData.company),
        email: toNullIfEmpty(formData.email),
        phone: toNullIfEmpty(formData.phone),
        product_service: toNullIfEmpty(formData.product_service),
        contract_value: formData.contract_value && formData.contract_value.trim() !== ""
          ? parseFloat(formData.contract_value)
          : null,
        payment_frequency: formData.payment_frequency,
        next_payment_date: formData.next_payment_date && formData.next_payment_date.trim() !== ""
          ? formData.next_payment_date
          : null,
        status: formData.status,
        notes: toNullIfEmpty(formData.notes),
      };

      // Only add setup_fee if user entered a value (prevents error if column doesn't exist)
      if (formData.setup_fee && formData.setup_fee.trim() !== "") {
        dataToSubmit.setup_fee = parseFloat(formData.setup_fee);
      }

      console.log('Submitting data:', dataToSubmit);
      console.log('Data types:', {
        contract_value: typeof dataToSubmit.contract_value,
        payment_frequency: typeof dataToSubmit.payment_frequency,
        status: typeof dataToSubmit.status,
        setup_fee: typeof dataToSubmit.setup_fee,
      });

      if (client) {
        // Update existing client
        const { error } = await supabase
          .from("clients")
          .update(dataToSubmit)
          .eq("id", client.id);

        if (error) {
          console.error('Update error details:', error);
          throw error;
        }
        showToast("Client updated successfully", "success");
      } else {
        // Create new client
        const { error } = await supabase
          .from("clients")
          .insert([dataToSubmit]);

        if (error) {
          console.error('Insert error details:', error);
          throw error;
        }
        showToast("Client added successfully", "success");
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error saving client:", error);
      const errorMessage = error?.message || "Failed to save client";
      showToast(errorMessage, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!client) return;

    if (!confirm(`Are you sure you want to delete ${client.name}?`)) {
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("clients").delete().eq("id", client.id);

      if (error) throw error;

      showToast("Client deleted successfully", "success");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error deleting client:", error);
      showToast("Failed to delete client", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={client ? "Edit Client" : "Add New Client"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name - Required */}
        <div>
          <label className="block text-text-primary text-sm font-medium mb-2">
            Client Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 bg-background text-text-primary rounded-lg border border-gray-700 focus:border-accent-secondary focus:outline-none"
            placeholder="John Doe"
            required
          />
        </div>

        {/* Company */}
        <div>
          <label className="block text-text-primary text-sm font-medium mb-2">
            Company Name
          </label>
          <input
            type="text"
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            className="w-full px-4 py-2 bg-background text-text-primary rounded-lg border border-gray-700 focus:border-accent-secondary focus:outline-none"
            placeholder="ABC Solar Pvt Ltd"
          />
        </div>

        {/* Email & Phone */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-text-primary text-sm font-medium mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 bg-background text-text-primary rounded-lg border border-gray-700 focus:border-accent-secondary focus:outline-none"
              placeholder="client@example.com"
            />
          </div>

          <div>
            <label className="block text-text-primary text-sm font-medium mb-2">
              Phone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2 bg-background text-text-primary rounded-lg border border-gray-700 focus:border-accent-secondary focus:outline-none"
              placeholder="+91 98123 45678"
            />
          </div>
        </div>

        {/* Product/Service */}
        <div>
          <label className="block text-text-primary text-sm font-medium mb-2">
            Product/Service
          </label>
          <select
            value={formData.product_service}
            onChange={(e) => setFormData({ ...formData, product_service: e.target.value })}
            className="w-full px-4 py-2 bg-background text-text-primary rounded-lg border border-gray-700 focus:border-accent-secondary focus:outline-none cursor-pointer"
          >
            <option value="">Select product...</option>
            <option value="Solar App">Solar App</option>
            <option value="Factory App">Factory App</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Setup Fee (One-time) */}
        <div>
          <label className="block text-text-primary text-sm font-medium mb-2">
            Setup Fee (₹) <span className="text-text-secondary text-xs">- One-time payment</span>
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.setup_fee}
            onChange={(e) => setFormData({ ...formData, setup_fee: e.target.value })}
            className="w-full px-4 py-2 bg-background text-text-primary rounded-lg border border-gray-700 focus:border-accent-secondary focus:outline-none"
            placeholder="30000"
          />
        </div>

        {/* Recurring Payment & Frequency */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-text-primary text-sm font-medium mb-2">
              Recurring Payment (₹)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.contract_value}
              onChange={(e) => setFormData({ ...formData, contract_value: e.target.value })}
              className="w-full px-4 py-2 bg-background text-text-primary rounded-lg border border-gray-700 focus:border-accent-secondary focus:outline-none"
              placeholder="12000"
            />
          </div>

          <div>
            <label className="block text-text-primary text-sm font-medium mb-2">
              Payment Frequency
            </label>
            <select
              value={formData.payment_frequency}
              onChange={(e) =>
                setFormData({ ...formData, payment_frequency: e.target.value as PaymentFrequency })
              }
              className="w-full px-4 py-2 bg-background text-text-primary rounded-lg border border-gray-700 focus:border-accent-secondary focus:outline-none cursor-pointer"
            >
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="annual">Annual</option>
            </select>
          </div>
        </div>

        {/* Next Payment Date & Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-text-primary text-sm font-medium mb-2">
              Next Payment Date
            </label>
            <input
              type="date"
              value={formData.next_payment_date}
              onChange={(e) => setFormData({ ...formData, next_payment_date: e.target.value })}
              className="w-full px-4 py-2 bg-background text-text-primary rounded-lg border border-gray-700 focus:border-accent-secondary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-text-primary text-sm font-medium mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as ClientStatus })}
              className="w-full px-4 py-2 bg-background text-text-primary rounded-lg border border-gray-700 focus:border-accent-secondary focus:outline-none cursor-pointer"
            >
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-text-primary text-sm font-medium mb-2">
            Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-4 py-2 bg-background text-text-primary rounded-lg border border-gray-700 focus:border-accent-secondary focus:outline-none"
            rows={4}
            placeholder="Additional notes about this client..."
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            {isSubmitting ? "Saving..." : client ? "Update Client" : "Add Client"}
          </Button>

          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>

          {client && (
            <Button
              type="button"
              variant="danger"
              onClick={handleDelete}
              disabled={isSubmitting}
            >
              Delete
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
}
