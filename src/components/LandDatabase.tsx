import React, { useState, useEffect } from "react";
import {
  Search,
  MapPin,
  Home,
  Plus,
  Eye,
  CheckCircle,
  ShoppingCart,
  User,
  Shield,
} from "lucide-react";
import { Land } from "../types";
import { useAuth } from "../hooks/useAuth";
import apiService from "../services/api";
import AddLandForm from "./AddLandForm";

const LandDatabase: React.FC = () => {
  const { auth } = useAuth();
  const [lands, setLands] = useState<Land[]>([]);
  const [filteredLands, setFilteredLands] = useState<Land[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    district: "",
    state: "",
    landType: "",
    status: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedLand, setSelectedLand] = useState<Land | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadLands();
  }, []);

  useEffect(() => {
    filterLands();
  }, [lands, searchTerm, filters]);

  const loadLands = async () => {
    try {
      setLoading(true);
      const response = await apiService.getLands({ limit: 100 });
      setLands(response.lands);
    } catch (error: any) {
      setError(error.message || "Failed to load lands");
    } finally {
      setLoading(false);
    }
  };

  const filterLands = () => {
    let filtered = [...lands];

    if (searchTerm) {
      filtered = filtered.filter(
        (land) =>
          land.assetId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          land.village.toLowerCase().includes(searchTerm.toLowerCase()) ||
          land.district.toLowerCase().includes(searchTerm.toLowerCase()) ||
          land.surveyNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        filtered = filtered.filter((land) =>
          (land as any)[key]?.toLowerCase().includes(value.toLowerCase())
        );
      }
    });

    setFilteredLands(filtered);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleClaimOwnership = async (landId: string) => {
    try {
      if (auth.user?.verificationStatus !== "VERIFIED") {
        setError(
          "You must be verified to claim land ownership. Please complete your verification first."
        );
        return;
      }

      await apiService.claimLandOwnership(landId);
      loadLands();
    } catch (error: any) {
      setError(error.message || "Failed to claim ownership");
    }
  };

  const handleDigitalize = async (landId: string) => {
    try {
      console.log("Digitalizing land with ID:", landId);
      await apiService.digitalizeLand(landId);
      loadLands();
    } catch (error: any) {
      setError(error.message || "Failed to digitalize land");
    }
  };

  const handleDownloadOriginalDocument = async (landId: string, assetId: string) => {
    try {
      // Check document status first
      const status = await apiService.checkDocumentStatus(landId);
      
      if (!status.data.originalDocument || !status.data.originalDocument.exists) {
        setError("Original document not found or not available for download");
        return;
      }

      const blob = await apiService.downloadOriginalDocument(landId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `land-document-${assetId}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      setError(error.message || "Failed to download original document");
    }
  };

  const handleDownloadCertificate = async (landId: string, assetId: string) => {
    try {
      // Check document status first
      const status = await apiService.checkDocumentStatus(landId);
      
      if (!status.data.digitalDocument || !status.data.digitalDocument.exists || !status.data.digitalDocument.isDigitalized) {
        setError("Digital certificate not found or land is not digitalized");
        return;
      }

      const blob = await apiService.downloadCertificate(landId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `land-certificate-${assetId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      setError(error.message || "Failed to download certificate");
    }
  };

  const handleListForSale = async (landId: string, saleData: any) => {
    try {
      await apiService.listLandForSale(landId, saleData);
      loadLands();
    } catch (error: any) {
      setError(error.message || "Failed to list land for sale");
    }
  };

  const handleSearchById = async (assetId: string) => {
    try {
      setLoading(true);
      const response = await apiService.searchLand(assetId);
      setLands([response.land]);
      setFilteredLands([response.land]);
    } catch (error: any) {
      setError(error.message || "Land not found");
      setLands([]);
      setFilteredLands([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30";
      case "FOR_SALE":
        return "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30";
      case "UNDER_TRANSACTION":
        return "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30";
      case "SOLD":
        return "bg-slate-800/50 text-slate-400 border border-slate-700";
      case "DISPUTED":
        return "bg-red-500/20 text-red-400 border border-red-500/30";
      default:
        return "bg-slate-800/50 text-slate-400 border border-slate-700";
    }
  };

  const getVerificationColor = (status: string) => {
    switch (status) {
      case "VERIFIED":
        return "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30";
      case "PENDING":
        return "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30";
      case "REJECTED":
        return "bg-red-500/20 text-red-400 border border-red-500/30";
      default:
        return "bg-slate-800/50 text-slate-400 border border-slate-700";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Land Database</h1>
          <p className="mt-1 text-sm text-slate-400">
            Comprehensive database of all registered lands
          </p>
        </div>
        {auth.user?.role === "ADMIN" && (
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-2xl shadow-lg shadow-emerald-500/40 text-sm font-semibold text-slate-950 bg-emerald-500 hover:bg-emerald-400 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Land
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg">
          {error}
          <button
            onClick={() => setError("")}
            className="ml-2 text-red-300 hover:text-red-200 transition-colors"
          >
            ×
          </button>
        </div>
      )}

      {/* Search and Filters */}
      <div className="rounded-lg border border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-sm p-6">
        {/* Asset ID Search */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Search by Asset ID
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Enter Asset ID (e.g., KA001123456)"
              className="flex-1 px-3 py-2 border border-slate-700 bg-slate-900/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 placeholder-slate-500"
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  const target = e.target as HTMLInputElement;
                  if (target.value.trim()) {
                    handleSearchById(target.value.trim());
                  }
                }
              }}
            />
            <button
              onClick={() => {
                const input = document.querySelector(
                  'input[placeholder*="Asset ID"]'
                ) as HTMLInputElement;
                if (input?.value.trim()) {
                  handleSearchById(input.value.trim());
                }
              }}
              className="px-4 py-2 bg-emerald-500 text-slate-950 rounded-lg hover:bg-emerald-400 font-semibold shadow-md shadow-emerald-500/40 transition-colors"
            >
              Search
            </button>
            <button
              onClick={() => {
                const input = document.querySelector(
                  'input[placeholder*="Asset ID"]'
                ) as HTMLInputElement;
                if (input) input.value = "";
                setSearchTerm("");
                setFilters({
                  district: "",
                  state: "",
                  landType: "",
                  status: "",
                });
                loadLands();
              }}
              className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-500" />
              </div>
              <input
                type="text"
                placeholder="Search by Village, District, Survey Number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-slate-700 bg-slate-900/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 placeholder-slate-500"
              />
            </div>
          </div>

          <select
            value={filters.state}
            onChange={(e) => handleFilterChange("state", e.target.value)}
            className="px-3 py-2 border border-slate-700 bg-slate-900/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="">All States</option>
            <option value="Karnataka">Karnataka</option>
            <option value="Maharashtra">Maharashtra</option>
            <option value="Tamil Nadu">Tamil Nadu</option>
            <option value="Gujarat">Gujarat</option>
            <option value="Rajasthan">Rajasthan</option>
            <option value="Uttar Pradesh">Uttar Pradesh</option>
          </select>

          <select
            value={filters.landType}
            onChange={(e) => handleFilterChange("landType", e.target.value)}
            className="px-3 py-2 border border-slate-700 bg-slate-900/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="">All Types</option>
            <option value="AGRICULTURAL">Agricultural</option>
            <option value="RESIDENTIAL">Residential</option>
            <option value="COMMERCIAL">Commercial</option>
            <option value="INDUSTRIAL">Industrial</option>
            <option value="GOVERNMENT">Government</option>
          </select>

          <select
            value={filters.status}
            onChange={(e) => handleFilterChange("status", e.target.value)}
            className="px-3 py-2 border border-slate-700 bg-slate-900/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="">All Status</option>
            <option value="AVAILABLE">Available</option>
            <option value="FOR_SALE">For Sale</option>
            <option value="UNDER_TRANSACTION">Under Transaction</option>
            <option value="SOLD">Sold</option>
            <option value="DISPUTED">Disputed</option>
          </select>
        </div>
      </div>

      {/* Lands Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        </div>
      ) : filteredLands.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-slate-400 text-lg">No lands found</div>
          <p className="text-slate-500 mt-2">
            {lands.length === 0
              ? "No lands have been added to the database yet."
              : "Try adjusting your search or filter criteria."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLands.map((land) => (
            <div
              key={land._id || land.id}
              className="group rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-sm overflow-hidden hover:shadow-xl hover:shadow-emerald-500/20 hover:border-emerald-500/40 transition-all duration-300 hover:-translate-y-1 flex flex-col h-full"
            >
              <div className="p-6 flex flex-col flex-1">
                {/* Header Section */}
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-white mb-2">
                    {land.assetId}
                  </h3>
                  <p className="text-sm text-slate-400 mb-3">
                    Survey No: {land.surveyNumber}
                  </p>
                  
                  {/* Status Badges - Horizontal */}
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                        land.status
                      )}`}
                    >
                      {land.status.replace("_", " ")}
                    </span>
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getVerificationColor(
                        land.verificationStatus
                      )}`}
                    >
                      {land.verificationStatus}
                    </span>
                    {land.digitalDocument?.isDigitalized && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        ✓ Digitalized
                      </span>
                    )}
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-slate-800/50 mb-4"></div>

                {/* Location */}
                <div className="flex items-start gap-2 mb-4">
                  <MapPin className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-slate-300 line-clamp-2">
                    {land.village} • {land.taluka} • {land.district}
                  </span>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Type</p>
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4 text-slate-400" />
                      <p className="text-sm text-white font-medium">{land.landType}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Area</p>
                    <p className="text-sm text-white font-medium">{land.area.acres || 0} Acres</p>
                  </div>
                </div>

                {/* Market Info - If For Sale */}
                {land.marketInfo.isForSale && (
                  <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-lg p-4 border border-emerald-500/30 mb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-emerald-400 mb-1">Listed for Sale</p>
                        <p className="text-xl font-bold text-emerald-300">
                          ₹{land.marketInfo.askingPrice?.toLocaleString()}
                        </p>
                      </div>
                      <ShoppingCart className="h-6 w-6 text-emerald-400/50" />
                    </div>
                  </div>
                )}

                {/* Owner Section */}
                {land.currentOwner ? (
                  <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700 mb-4">
                    <p className="text-xs text-slate-400 mb-1">Current Owner</p>
                    <p className="text-sm font-semibold text-white truncate">
                      {land.currentOwner.fullName}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {land.currentOwner.email}
                    </p>
                  </div>
                ) : (
                  <div className="bg-yellow-500/10 rounded-lg p-3 border border-yellow-500/30 mb-4">
                    <p className="text-sm font-semibold text-yellow-400">
                      No current owner
                    </p>
                    {auth.user?.verificationStatus !== "VERIFIED" && (
                      <p className="text-xs text-yellow-500/80 mt-1">
                        Complete verification to claim
                      </p>
                    )}
                  </div>
                )}

                {/* Spacer to push buttons to bottom */}
                <div className="flex-grow"></div>

                {/* Divider */}
                <div className="border-t border-slate-800/50 mb-4"></div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedLand(land);
                        setShowModal(true);
                      }}
                      className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-slate-700 rounded-lg text-sm font-medium text-white bg-slate-800/50 hover:bg-slate-800 transition-colors"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Details
                    </button>

                  {!land.currentOwner &&
                    auth.user?.verificationStatus === "VERIFIED" && (
                      <button
                        onClick={() => handleClaimOwnership(land._id || land.id)}
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent rounded-lg text-sm font-semibold text-slate-950 bg-emerald-500 hover:bg-emerald-400 shadow-md shadow-emerald-500/40 transition-colors"
                      >
                        Claim
                      </button>
                    )}

                  {land.currentOwner?.id === auth.user?.id &&
                    !land.marketInfo.isForSale &&
                    auth.user?.role === "USER" && (
                      <button
                        onClick={() => {
                          const askingPrice = prompt("Enter asking price (₹):");
                          const description = prompt(
                            "Enter description (optional):"
                          );

                          if (askingPrice) {
                            handleListForSale(land._id || land.id, {
                              askingPrice: parseFloat(askingPrice),
                              description: description || "",
                            });
                          }
                        }}
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent rounded-lg text-sm font-semibold text-slate-950 bg-emerald-500 hover:bg-emerald-400 shadow-md shadow-emerald-500/40 transition-colors"
                      >
                        List for Sale
                      </button>
                    )}

                    {auth.user?.role === "ADMIN" &&
                      !land.digitalDocument?.isDigitalized && (
                        <button
                          onClick={() => handleDigitalize(land._id || land.id)}
                          className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent rounded-lg text-sm font-semibold text-slate-950 bg-blue-500 hover:bg-blue-400 shadow-md shadow-blue-500/40 transition-colors"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Digitalize
                        </button>
                      )}
                  </div>

                  {land.digitalDocument?.isDigitalized && (
                    <button
                      onClick={() => handleDownloadCertificate(land._id || land.id, land.assetId)}
                      className="w-full text-sm text-emerald-400 hover:text-emerald-300 font-medium transition-colors py-2"
                    >
                      📄 Download Digital Certificate
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {showModal && selectedLand && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900/95 backdrop-blur-xl rounded-xl border border-slate-800 w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="sticky top-0 bg-slate-900/95 backdrop-blur-xl border-b border-slate-800 p-6 flex items-center justify-between z-10">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">
                  Land Details
                </h2>
                <p className="text-sm text-slate-400">Asset ID: {selectedLand.assetId}</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="bg-slate-800/40 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6">
                <h3 className="text-xl font-semibold text-white mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-400">Survey Number</label>
                    <p className="text-white mt-1">{selectedLand.surveyNumber}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-400">Land Type</label>
                    <p className="text-white mt-1">{selectedLand.landType}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-400">Area</label>
                    <p className="text-white mt-1">{selectedLand.area.acres || 0} Acres</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-400">Classification</label>
                    <p className="text-white mt-1">{selectedLand.classification || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-400">Sub Division</label>
                    <p className="text-white mt-1">{selectedLand.subDivision || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-400">Status</label>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold mt-1 ${getStatusColor(selectedLand.status)}`}>
                      {selectedLand.status.replace("_", " ")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="bg-slate-800/40 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-emerald-400" />
                  Location
                </h3>
                <div className="space-y-2">
                  <p className="text-white">{selectedLand.village}</p>
                  <p className="text-white">{selectedLand.taluka}, {selectedLand.district}</p>
                  <p className="text-white">{selectedLand.state}</p>
                </div>
              </div>

              {/* Owner Information */}
              {selectedLand.currentOwner ? (
                <div className="bg-slate-800/40 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6">
                  <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-emerald-400" />
                    Owner Information
                  </h3>
                  <div className="space-y-2">
                    <p className="text-white font-medium">{selectedLand.currentOwner.fullName}</p>
                    <p className="text-slate-400 text-sm">{selectedLand.currentOwner.email}</p>
                    <div className="flex items-center gap-2 mt-3">
                      <Shield className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm text-emerald-400 font-medium">
                        {selectedLand.currentOwner.verificationStatus === 'VERIFIED' ? 'Verified Owner' : 'Unverified'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-500/10 backdrop-blur-xl rounded-xl border border-yellow-500/30 p-6">
                  <p className="text-yellow-400 font-medium">No current owner assigned</p>
                </div>
              )}

              {/* Market Information */}
              {selectedLand.marketInfo.isForSale && (
                <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 backdrop-blur-xl rounded-xl border border-emerald-500/30 p-6">
                  <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-emerald-400" />
                    Market Information
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <label className="text-sm font-medium text-emerald-400">Asking Price</label>
                      <p className="text-2xl font-bold text-emerald-300 mt-1">
                        ₹{selectedLand.marketInfo.askingPrice?.toLocaleString()}
                      </p>
                    </div>
                    {selectedLand.marketInfo.listedDate && (
                      <div>
                        <label className="text-sm font-medium text-emerald-400">Listed Date</label>
                        <p className="text-white mt-1">
                          {new Date(selectedLand.marketInfo.listedDate).toLocaleDateString('en-IN', { 
                            day: 'numeric', 
                            month: 'short', 
                            year: 'numeric' 
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Verification Status */}
              <div className="bg-slate-800/40 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  Verification Status
                </h3>
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${getVerificationColor(selectedLand.verificationStatus)}`}>
                    {selectedLand.verificationStatus}
                  </span>
                  {selectedLand.digitalDocument?.isDigitalized && (
                    <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      ✓ Digitalized
                    </span>
                  )}
                </div>
              </div>

              {/* Documents Section */}
              <div className="bg-slate-800/40 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6">
                <h3 className="text-xl font-semibold text-white mb-4">📄 Land Documents</h3>
                
                <div className="space-y-3">
                  {selectedLand.originalDocument?.url && (
                    <button 
                      onClick={() => handleDownloadOriginalDocument(selectedLand._id || selectedLand.id, selectedLand.assetId)}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 border border-slate-700 rounded-lg text-sm font-medium text-white bg-slate-800/50 hover:bg-slate-800 transition-colors"
                    >
                      📄 Download Original Land Document
                      {selectedLand.originalDocument.filename && (
                        <span className="text-xs text-slate-400">
                          ({selectedLand.originalDocument.filename})
                        </span>
                      )}
                    </button>
                  )}

                  {selectedLand.digitalDocument?.url && selectedLand.digitalDocument.isDigitalized && (
                    <button 
                      onClick={() => handleDownloadCertificate(selectedLand._id || selectedLand.id, selectedLand.assetId)}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 border border-transparent rounded-lg text-sm font-semibold text-slate-950 bg-emerald-500 hover:bg-emerald-400 shadow-md shadow-emerald-500/40 transition-colors"
                    >
                      🔒 Download Digitalized Certificate
                    </button>
                  )}
                  
                  {!selectedLand.originalDocument?.url && !selectedLand.digitalDocument?.url && (
                    <p className="text-slate-400 text-center py-4">
                      No documents available for this land.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddForm && (
        <AddLandForm
          onClose={() => setShowAddForm(false)}
          onSuccess={() => {
            setShowAddForm(false);
            loadLands();
          }}
        />
      )}
    </div>
  );
};

export default LandDatabase;
