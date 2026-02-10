"use client";

import { VendorProspect } from "@/types/database";
import Modal from "@/components/ui/Modal";
import Loading from "@/components/ui/Loading";
import { showToast } from "@/components/ui/Toast";
import {
    Search,
    MapPin,
    Phone,
    Mail,
    Building2,
    Zap,
    ArrowDownToLine,
    ChevronLeft,
    ChevronRight,
    Filter,
    X,
    ArrowUpDown,
} from "lucide-react";
import { useEffect, useState, useCallback } from "react";

interface VendorProspectsPanelProps {
    isOpen: boolean;
    onClose: () => void;
    brand: string;
    employeeId?: string;
    employeeUsername?: string;
    onImported: () => void;
}

const INSTALLATION_TIERS = [
    { label: "500+", min: 500, max: undefined, color: "bg-green/15 text-green border-green/30" },
    { label: "200–499", min: 200, max: 499, color: "bg-sky/15 text-sky border-sky/30" },
    { label: "100–199", min: 100, max: 199, color: "bg-purple/15 text-purple border-purple/30" },
    { label: "10–99", min: 10, max: 99, color: "bg-yellow/15 text-yellow border-yellow/30" },
    { label: "<10", min: 0, max: 9, color: "bg-pink/15 text-pink border-pink/30" },
];

const SORT_OPTIONS = [
    { label: "Installations ↓", value: "installations_desc" },
    { label: "Installations ↑", value: "installations_asc" },
    { label: "Capacity ↓", value: "capacity_desc" },
    { label: "Capacity ↑", value: "capacity_asc" },
    { label: "Company A–Z", value: "company_asc" },
    { label: "Company Z–A", value: "company_desc" },
];

export default function VendorProspectsPanel({
    isOpen,
    onClose,
    brand,
    employeeId,
    employeeUsername,
    onImported,
}: VendorProspectsPanelProps) {
    const [vendors, setVendors] = useState<VendorProspect[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [importingId, setImportingId] = useState<string | null>(null);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const limit = 30;

    // Filter states
    const [states, setStates] = useState<string[]>([]);
    const [districts, setDistricts] = useState<string[]>([]);
    const [selectedState, setSelectedState] = useState("MAHARASHTRA");
    const [selectedDistrict, setSelectedDistrict] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedTier, setSelectedTier] = useState<number | null>(null);
    const [sortBy, setSortBy] = useState("installations_desc");
    const [showFilters, setShowFilters] = useState(false);

    const activeTier = selectedTier !== null ? INSTALLATION_TIERS[selectedTier] : null;

    const fetchVendors = useCallback(async () => {
        if (!isOpen) return;
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                state: selectedState,
                page: String(page),
                limit: String(limit),
                sort: sortBy,
            });

            if (selectedDistrict) params.set("district", selectedDistrict);
            if (searchQuery) params.set("search", searchQuery);
            if (activeTier) {
                params.set("minInstallations", String(activeTier.min));
                if (activeTier.max !== undefined) {
                    params.set("maxInstallations", String(activeTier.max));
                }
            }

            const res = await fetch(`/api/vendor-prospects?${params.toString()}`);
            const json = await res.json();

            if (res.ok) {
                setVendors(json.data || []);
                setTotal(json.total || 0);
                setStates(json.states || []);
                setDistricts(json.districts || []);
            } else {
                showToast(json.error || "Failed to fetch vendors", "error");
            }
        } catch {
            showToast("Failed to fetch vendor prospects", "error");
        } finally {
            setIsLoading(false);
        }
    }, [isOpen, selectedState, selectedDistrict, searchQuery, activeTier, sortBy, page]);

    useEffect(() => {
        fetchVendors();
    }, [fetchVendors]);

    // Reset page when filters change
    useEffect(() => {
        setPage(1);
    }, [selectedState, selectedDistrict, searchQuery, selectedTier, sortBy]);

    // Reset district when state changes
    useEffect(() => {
        setSelectedDistrict("");
    }, [selectedState]);

    const handleImport = async (vendor: VendorProspect) => {
        if (!employeeId) {
            showToast("Please log in to import vendors", "error");
            return;
        }

        setImportingId(vendor.id);
        try {
            const res = await fetch("/api/vendor-prospects/import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    vendorId: vendor.id,
                    employeeId,
                    employeeUsername,
                }),
            });

            const json = await res.json();

            if (res.ok) {
                showToast(`"${vendor.company_name}" imported as lead!`, "success");
                setVendors((prev) => prev.filter((v) => v.id !== vendor.id));
                setTotal((prev) => prev - 1);
                onImported();
            } else {
                showToast(json.error || "Failed to import vendor", "error");
            }
        } catch {
            showToast("Failed to import vendor", "error");
        } finally {
            setImportingId(null);
        }
    };

    const totalPages = Math.ceil(total / limit);
    const clearFilters = () => {
        setSelectedDistrict("");
        setSearchQuery("");
        setSelectedTier(null);
        setSortBy("installations_desc");
    };

    const hasActiveFilters = selectedDistrict || searchQuery || selectedTier !== null || sortBy !== "installations_desc";

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Vendor Prospects" size="xl" color="green">
            <div className="space-y-4">
                {/* State Selector + Search Row */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <select
                        value={selectedState}
                        onChange={(e) => setSelectedState(e.target.value)}
                        className="px-3 py-2.5 bg-background border border-border/50 rounded-xl text-sm font-medium focus:border-green/50 outline-none transition-all sm:w-48"
                    >
                        {states.length > 0 ? (
                            states.map((s) => (
                                <option key={s} value={s}>
                                    {s}
                                </option>
                            ))
                        ) : (
                            <option value="MAHARASHTRA">MAHARASHTRA</option>
                        )}
                    </select>

                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                        <input
                            type="text"
                            placeholder="Search company name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-background border border-border/50 rounded-xl text-sm focus:border-green/50 outline-none transition-all"
                        />
                    </div>

                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${showFilters || hasActiveFilters
                                ? "bg-green/10 text-green border border-green/30"
                                : "bg-background border border-border/50 text-text-secondary hover:text-text-primary"
                            }`}
                    >
                        <Filter className="w-4 h-4" />
                        Filters
                        {hasActiveFilters && (
                            <span className="w-2 h-2 rounded-full bg-green" />
                        )}
                    </button>
                </div>

                {/* Installation Tier Boxes */}
                <div className="flex flex-wrap gap-2">
                    {INSTALLATION_TIERS.map((tier, i) => (
                        <button
                            key={tier.label}
                            onClick={() => setSelectedTier(selectedTier === i ? null : i)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${selectedTier === i
                                    ? tier.color + " shadow-sm scale-105"
                                    : "bg-background border-border/30 text-text-secondary hover:text-text-primary"
                                }`}
                        >
                            {tier.label} installs
                        </button>
                    ))}
                </div>

                {/* Extended Filters */}
                {showFilters && (
                    <div className="flex flex-wrap gap-3 p-4 bg-background rounded-xl border border-border/30">
                        <select
                            value={selectedDistrict}
                            onChange={(e) => setSelectedDistrict(e.target.value)}
                            className="px-3 py-2 bg-background-card border border-border/50 rounded-lg text-sm focus:border-green/50 outline-none transition-all"
                        >
                            <option value="">All Districts</option>
                            {districts.map((d) => (
                                <option key={d} value={d}>
                                    {d}
                                </option>
                            ))}
                        </select>

                        <div className="flex items-center gap-2">
                            <ArrowUpDown className="w-4 h-4 text-text-secondary" />
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="px-3 py-2 bg-background-card border border-border/50 rounded-lg text-sm focus:border-green/50 outline-none transition-all"
                            >
                                {SORT_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {hasActiveFilters && (
                            <button
                                onClick={clearFilters}
                                className="flex items-center gap-1 px-3 py-2 text-xs text-pink hover:text-pink/80 transition-colors"
                            >
                                <X className="w-3 h-3" /> Clear All
                            </button>
                        )}
                    </div>
                )}

                {/* Results Summary */}
                <div className="flex items-center justify-between text-sm">
                    <span className="text-text-secondary">
                        {total} vendor{total !== 1 ? "s" : ""} found
                        {selectedState && <span className="text-green"> in {selectedState}</span>}
                        {activeTier && <span className="text-text-primary"> • {activeTier.label} installations</span>}
                    </span>
                    {totalPages > 1 && (
                        <span className="text-text-secondary text-xs">
                            Page {page} of {totalPages}
                        </span>
                    )}
                </div>

                {/* Vendors List */}
                {isLoading ? (
                    <div className="py-12 flex justify-center">
                        <Loading text="Fetching vendor prospects..." />
                    </div>
                ) : vendors.length === 0 ? (
                    <div className="py-12 text-center space-y-3">
                        <Building2 className="w-12 h-12 mx-auto text-border" />
                        <p className="text-text-secondary">No vendor prospects found</p>
                        <p className="text-xs text-text-secondary">Try adjusting your filters or select a different state</p>
                    </div>
                ) : (
                    <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                        {vendors.map((vendor) => (
                            <div
                                key={vendor.id}
                                className="p-4 bg-background rounded-xl border border-border/30 hover:border-green/20 transition-all group"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Building2 className="w-4 h-4 text-green flex-shrink-0" />
                                            <h4 className="font-bold text-text-primary text-sm truncate">
                                                {vendor.company_name}
                                            </h4>
                                        </div>

                                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-secondary">
                                            <span className="flex items-center gap-1">
                                                <MapPin className="w-3 h-3" />
                                                {vendor.district}
                                            </span>
                                            {vendor.phone && (
                                                <span className="flex items-center gap-1">
                                                    <Phone className="w-3 h-3" />
                                                    {vendor.phone}
                                                </span>
                                            )}
                                            {vendor.email && (
                                                <span className="flex items-center gap-1 truncate max-w-[200px]">
                                                    <Mail className="w-3 h-3 flex-shrink-0" />
                                                    {vendor.email}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex gap-3">
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-sky/10 text-sky rounded-md text-xs font-medium">
                                                <Zap className="w-3 h-3" />
                                                {vendor.installations} installations
                                            </span>
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow/10 text-yellow rounded-md text-xs font-medium">
                                                {vendor.capacity_kwp} kWp
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleImport(vendor)}
                                        disabled={importingId === vendor.id}
                                        className="flex items-center gap-1.5 px-3 py-2 bg-green/10 text-green border border-green/30 rounded-lg text-xs font-bold hover:bg-green/20 transition-all disabled:opacity-50 flex-shrink-0"
                                    >
                                        <ArrowDownToLine className="w-3.5 h-3.5" />
                                        {importingId === vendor.id ? "Importing..." : "Import as Lead"}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 pt-2">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="p-2 rounded-lg bg-background border border-border/30 hover:bg-border/10 transition-colors disabled:opacity-30"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum: number;
                            if (totalPages <= 5) {
                                pageNum = i + 1;
                            } else if (page <= 3) {
                                pageNum = i + 1;
                            } else if (page >= totalPages - 2) {
                                pageNum = totalPages - 4 + i;
                            } else {
                                pageNum = page - 2 + i;
                            }
                            return (
                                <button
                                    key={pageNum}
                                    onClick={() => setPage(pageNum)}
                                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${page === pageNum
                                            ? "bg-green text-white"
                                            : "bg-background border border-border/30 hover:bg-border/10"
                                        }`}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="p-2 rounded-lg bg-background border border-border/30 hover:bg-border/10 transition-colors disabled:opacity-30"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        </Modal>
    );
}
