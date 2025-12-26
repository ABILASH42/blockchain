import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  MapPin,
  MessageCircle,
  Eye,
  Heart,
  ShoppingCart,
  Camera,
  Star,
  X,
  Edit2,
  Trash2,
} from "lucide-react";
import { Land } from "../types";
import apiService from "../services/api";
import RealtimeChat from "./RealtimeChat";
import EditLandListingForm from "./EditLandListingForm";
import { useAuth } from "../hooks/useAuth";

interface MarketplaceFilters {
  minPrice: string;
  maxPrice: string;
  district: string;
  state: string;
  landType: string;
  minArea: string;
  maxArea: string;
}

interface LandMarketplaceProps {
  onNavigateToLand?: (landId: string) => void;
}

const LandMarketplace: React.FC<LandMarketplaceProps> = ({
  onNavigateToLand,
}) => {
  const [lands, setLands] = useState<Land[]>([]);
  const [myListings, setMyListings] = useState<Land[]>([]);
  const [likedLands, setLikedLands] = useState<Land[]>([]);
  const [filteredLands, setFilteredLands] = useState<Land[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLand, setSelectedLand] = useState<Land | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedLandForEdit, setSelectedLandForEdit] = useState<Land | null>(
    null
  );
  const [activeTab, setActiveTab] = useState<"browse" | "my-ads" | "liked">(
    "browse"
  );
  const [filters, setFilters] = useState<MarketplaceFilters>({
    minPrice: "",
    maxPrice: "",
    district: "",
    state: "",
    landType: "",
    minArea: "",
    maxArea: "",
  });

  useEffect(() => {
    if (activeTab === "browse") {
      loadMarketplaceLands();
    } else if (activeTab === "my-ads") {
      loadMyListings();
    } else if (activeTab === "liked") {
      loadLikedLands();
    }
  }, [activeTab]);

  useEffect(() => {
    filterLands();
  }, [lands, myListings, likedLands, searchTerm, filters, activeTab]);

  const loadMarketplaceLands = async () => {
    try {
      setLoading(true);
      const response = await apiService.getMarketplaceLands({ limit: 100 });
      setLands(response.lands || []);
    } catch (error: any) {
      setError(error.message || "Failed to load marketplace lands");
    } finally {
      setLoading(false);
    }
  };

  const loadMyListings = async () => {
    try {
      setLoading(true);
      const response = await apiService.getMyListings({ limit: 100 });
      setMyListings(response.lands || []);
    } catch (error: any) {
      setError(error.message || "Failed to load your listings");
    } finally {
      setLoading(false);
    }
  };

  const loadLikedLands = async () => {
    try {
      setLoading(true);
      const response = await apiService.getLikedLands({ limit: 100 });
      setLikedLands(response.lands || []);
    } catch (error: any) {
      setError(error.message || "Failed to load liked lands");
    } finally {
      setLoading(false);
    }
  };

  const filterLands = () => {
    const sourceLands =
      activeTab === "browse"
        ? lands
        : activeTab === "my-ads"
        ? myListings
        : likedLands;

    let filtered = sourceLands.filter((land) => {
      // Search term filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
          land.village?.toLowerCase().includes(searchLower) ||
          land.district?.toLowerCase().includes(searchLower) ||
          land.state?.toLowerCase().includes(searchLower) ||
          land.surveyNumber?.toLowerCase().includes(searchLower) ||
          land.marketInfo?.description?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Price filters
      if (filters.minPrice && land.marketInfo?.askingPrice) {
        if (land.marketInfo.askingPrice < parseFloat(filters.minPrice))
          return false;
      }
      if (filters.maxPrice && land.marketInfo?.askingPrice) {
        if (land.marketInfo.askingPrice > parseFloat(filters.maxPrice))
          return false;
      }

      // Location filters
      if (filters.district && land.district) {
        if (
          !land.district.toLowerCase().includes(filters.district.toLowerCase())
        )
          return false;
      }
      if (filters.state && land.state) {
        if (!land.state.toLowerCase().includes(filters.state.toLowerCase()))
          return false;
      }

      // Land type filter
      if (filters.landType && land.landType !== filters.landType) return false;

      // Area filters
      if (filters.minArea && land.area?.acres) {
        if (land.area.acres < parseFloat(filters.minArea)) return false;
      }
      if (filters.maxArea && land.area?.acres) {
        if (land.area.acres > parseFloat(filters.maxArea)) return false;
      }

      return true;
    });

    setFilteredLands(filtered);
  };

  const handleFilterChange = (key: keyof MarketplaceFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      minPrice: "",
      maxPrice: "",
      district: "",
      state: "",
      landType: "",
      minArea: "",
      maxArea: "",
    });
    setSearchTerm("");
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatArea = (land: Land) => {
    const { acres, guntas, sqft } = land.area || {};
    let areaStr = "";
    if (acres && acres > 0) areaStr += `${acres} acres`;
    if (guntas && guntas > 0) areaStr += ` ${guntas} guntas`;
    if (sqft && sqft > 0) areaStr += ` ${sqft} sqft`;
    return areaStr || "Area not specified";
  };

  const getImageUrl = (imageHash: string) => {
    if (!imageHash) return "/placeholder-land.svg";
    return `http://localhost:5000/api/images/${imageHash}`;
  };

  const handleChatWithSeller = (land: Land) => {
    setSelectedLand(land);
    setShowChat(true);
  };

  const handleBuyNow = (land: Land) => {
    // Implement buy now functionality
    console.log("Buy now clicked for land:", land.assetId);
    // You can redirect to a purchase flow or show a modal
  };

  const handleLikeLand = async (land: Land) => {
    try {
      if (land._id) {
        await apiService.toggleLandLike(land._id as string);
        // Refresh the current tab data
        if (activeTab === "browse") {
          loadMarketplaceLands();
        } else if (activeTab === "liked") {
          loadLikedLands();
        }
      }
    } catch (error: any) {
      setError(error.message || "Failed to update like status");
    }
  };

  const handleEditListing = (land: Land) => {
    setSelectedLandForEdit(land);
    setShowEditForm(true);
  };

  const handleRemoveListing = async (land: Land) => {
    if (window.confirm("Are you sure you want to remove this listing?")) {
      try {
        if (land._id) {
          await apiService.removeListing(land._id);
          loadMyListings(); // Refresh the list
        }
      } catch (error: any) {
        setError(error.message || "Failed to remove listing");
      }
    }
  };

  const handleViewDetails = (land: Land) => {
    // Navigate to detailed view page
    if (land._id && onNavigateToLand) {
      onNavigateToLand(land._id);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={loadMarketplaceLands}
          className="bg-emerald-500 text-slate-950 px-4 py-2 rounded-2xl hover:bg-emerald-400 font-semibold shadow-md shadow-emerald-500/40 transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-white mb-2">
          Land Marketplace
        </h1>
        <p className="text-slate-400">
          Discover verified lands for sale across India
        </p>

        {/* Tab Navigation */}
        <div className="mt-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab("browse")}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "browse"
                  ? "border-emerald-500 text-emerald-300"
                  : "border-transparent text-slate-400 hover:text-white hover:border-slate-700"
              }`}
            >
              Browse All
            </button>
            <button
              onClick={() => setActiveTab("my-ads")}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "my-ads"
                  ? "border-emerald-500 text-emerald-300"
                  : "border-transparent text-slate-400 hover:text-white hover:border-slate-700"
              }`}
            >
              My Ads
            </button>
            <button
              onClick={() => setActiveTab("liked")}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "liked"
                  ? "border-emerald-500 text-emerald-300"
                  : "border-transparent text-slate-400 hover:text-white hover:border-slate-700"
              }`}
            >
              Liked Ads
            </button>
          </nav>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="rounded-lg border border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-sm p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by location, survey number, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-700 bg-slate-900/50 text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 placeholder-slate-500"
              />
            </div>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-3 border border-slate-700 bg-slate-900/50 text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <Filter className="w-5 h-5" />
            Filters
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-6 pt-6 border-t border-slate-800/50">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Min Price (₹)
                </label>
                <input
                  type="number"
                  value={filters.minPrice}
                  onChange={(e) =>
                    handleFilterChange("minPrice", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-slate-700 bg-slate-900/50 text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 placeholder-slate-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Max Price (₹)
                </label>
                <input
                  type="number"
                  value={filters.maxPrice}
                  onChange={(e) =>
                    handleFilterChange("maxPrice", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-slate-700 bg-slate-900/50 text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 placeholder-slate-500"
                  placeholder="No limit"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  District
                </label>
                <input
                  type="text"
                  value={filters.district}
                  onChange={(e) =>
                    handleFilterChange("district", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-slate-700 bg-slate-900/50 text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 placeholder-slate-500"
                  placeholder="Any district"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  State
                </label>
                <input
                  type="text"
                  value={filters.state}
                  onChange={(e) => handleFilterChange("state", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-700 bg-slate-900/50 text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 placeholder-slate-500"
                  placeholder="Any state"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Land Type
                </label>
                <select
                  value={filters.landType}
                  onChange={(e) =>
                    handleFilterChange("landType", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-slate-700 bg-slate-900/50 text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">All Types</option>
                  <option value="AGRICULTURAL">Agricultural</option>
                  <option value="RESIDENTIAL">Residential</option>
                  <option value="COMMERCIAL">Commercial</option>
                  <option value="INDUSTRIAL">Industrial</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Area (acres)
                </label>
                <input
                  type="number"
                  value={filters.minArea}
                  onChange={(e) =>
                    handleFilterChange("minArea", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-slate-700 bg-slate-900/50 text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 placeholder-slate-500"
                  placeholder="0"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Max Area (acres)
                </label>
                <input
                  type="number"
                  value={filters.maxArea}
                  onChange={(e) =>
                    handleFilterChange("maxArea", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-slate-700 bg-slate-900/50 text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 placeholder-slate-500"
                  placeholder="No limit"
                  step="0.1"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="w-full px-4 py-2 text-slate-300 border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="mb-4">
        <p className="text-slate-400">
          Showing {filteredLands.length} of{" "}
          {activeTab === "browse"
            ? lands.length
            : activeTab === "my-ads"
            ? myListings.length
            : likedLands.length}{" "}
          {activeTab === "browse"
            ? "lands for sale"
            : activeTab === "my-ads"
            ? "your listings"
            : "liked lands"}
        </p>
      </div>

      {/* Land Cards Grid */}
      {filteredLands.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-slate-500 mb-4">
            <MapPin className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">
            No lands found
          </h3>
          <p className="text-slate-400">
            Try adjusting your search criteria or filters
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLands.map((land) => (
            <LandCard
              key={land._id}
              land={land}
              activeTab={activeTab}
              onChat={() => handleChatWithSeller(land)}
              onBuy={() => handleBuyNow(land)}
              onLike={handleLikeLand}
              onEdit={() => handleEditListing(land)}
              onRemove={() => handleRemoveListing(land)}
              onViewDetails={() => handleViewDetails(land)}
              getImageUrl={getImageUrl}
              formatPrice={formatPrice}
              formatArea={formatArea}
            />
          ))}
        </div>
      )}

      {/* Chat Modal */}
      {showChat && selectedLand && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="rounded-lg border border-slate-800 bg-slate-900/90 backdrop-blur-xl w-full max-w-4xl h-[80vh] flex flex-col shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-slate-800/50">
              <h3 className="text-lg font-semibold text-white">
                Chat with {selectedLand.currentOwner?.fullName || "Seller"}
              </h3>
              <button
                onClick={() => setShowChat(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <RealtimeChat
                landId={selectedLand._id}
                recipientId={selectedLand.currentOwner?.id}
                recipientName={selectedLand.currentOwner?.fullName}
                onClose={() => setShowChat(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit Listing Modal */}
      {showEditForm && selectedLandForEdit && (
        <EditLandListingForm
          land={selectedLandForEdit}
          onClose={() => {
            setShowEditForm(false);
            setSelectedLandForEdit(null);
          }}
          onSuccess={() => {
            setShowEditForm(false);
            setSelectedLandForEdit(null);
            // Refresh the listings
            if (activeTab === "my-ads") {
              loadMyListings();
            } else {
              loadMarketplaceLands();
            }
          }}
        />
      )}
    </div>
  );
};

// Land Card Component
interface LandCardProps {
  land: Land;
  activeTab: "browse" | "my-ads" | "liked";
  onChat: () => void;
  onBuy: () => void;
  onLike: (land: Land) => void;
  onEdit: (land: Land) => void;
  onRemove: (land: Land) => void;
  onViewDetails: (land: Land) => void;
  getImageUrl: (hash: string) => string;
  formatPrice: (price: number) => string;
  formatArea: (land: Land) => string;
}

const LandCard: React.FC<LandCardProps> = ({
  land,
  activeTab,
  onChat,
  onBuy,
  onLike,
  onEdit,
  onRemove,
  onViewDetails,
  getImageUrl,
  formatPrice,
  formatArea,
}) => {
  const { auth } = useAuth();
  const [imageError, setImageError] = useState(false);
  // Keep only isFavorited state (initialized from server-provided isLiked or user's likedLands)
  const [isFavorited, setIsFavorited] = useState<boolean>(
    Boolean(land.isLiked ?? false)
  );
  const [isProcessingLike, setIsProcessingLike] = useState<boolean>(false);

  useEffect(() => {
    // prefer server-provided flag, otherwise check current user's likedLands
    let initial = false;
    if (typeof land.isLiked !== "undefined") {
      initial = !!land.isLiked;
    } else if (auth.user && Array.isArray((auth.user as any).likedLands)) {
      initial = (auth.user as any).likedLands.some((id: any) => {
        try {
          return id.toString() === land._id.toString();
        } catch (e) {
          return id === land._id;
        }
      });
    }
    setIsFavorited(initial);
  }, [land._id, land.isLiked, auth.user]);

  // Handler for clicking the heart (stops propagation so parent card click doesn't fire)
  const handleToggleLike = async (e: React.MouseEvent) => {
    // stop navigation / card click bubbling
    e.preventDefault();
    e.stopPropagation();

    const previous = isFavorited;
    setIsFavorited(!previous);
    setIsProcessingLike(true);

    try {
      const res = await apiService.toggleLandLike(land._id as string);

      if (res && typeof res.liked === "boolean") {
        setIsFavorited(res.liked);
      } else {
        setIsFavorited(previous);
        console.error("Unexpected like response", res);
      }
    } catch (err) {
      setIsFavorited(previous);
      console.error("Failed to toggle like", err);
    } finally {
      setIsProcessingLike(false);
    }
  };

  // Prevent card navigation when clicking interactive elements like the heart
  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement | null;
    if (target?.closest("button, svg, path")) {
      // click came from the heart button or other interactive element; do NOT navigate
      return;
    }

    // existing navigation logic
    if (onViewDetails) {
      try {
        onViewDetails();
      } catch (err) {
        // ignore
      }
    }
  };

  const primaryImage = land.marketInfo?.images?.[0];
  const imageUrl = primaryImage
    ? getImageUrl(primaryImage)
    : "/placeholder-land.svg";

  const features = land.marketInfo?.features || [];
  const amenities = land.marketInfo?.nearbyAmenities || [];

  // Check if current user is the owner
  const isOwner =
    auth.user?.id === land?.currentOwner?.id ||
    auth.user?.id === land?.currentOwner?._id;

  return (
    <div
      className="rounded-lg border border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-sm hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-200 overflow-hidden cursor-pointer"
      onClick={handleCardClick}
    >
      {/* Image */}
      <div className="relative h-48 bg-slate-800">
        {!imageError && primaryImage ? (
          <img
            src={imageUrl}
            alt={`${land.village}, ${land.district}`}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-800">
            <Camera className="w-12 h-12 text-slate-600" />
          </div>
        )}

        {/* Favorite Button - only show in browse tab */}
        {activeTab === "browse" && (
          <button
            type="button"
            onClick={handleToggleLike}
            disabled={isProcessingLike}
            aria-pressed={isFavorited}
            aria-label={
              isFavorited ? "Remove from favorites" : "Add to favorites"
            }
            className="absolute top-3 right-3 p-2 bg-slate-900/80 backdrop-blur-sm rounded-full hover:bg-slate-900 transition-all"
          >
            {/* Use an inline SVG heart so we can control fill color without changing global styles */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="20"
              height="20"
              role="img"
              aria-hidden={false}
              focusable="false"
              className={
                isFavorited ? "heart-icon heart-icon--liked" : "heart-icon"
              }
              style={{ display: "block" }}
            >
              <path
                d="M12 21s-7.2-4.73-9.33-7.04C1.73 11.77 3.26 7.5 7.5 6.1 9.4 5.4 11.6 6 12 6s2.6-.6 4.5.1C20.74 7.5 22.27 11.77 21.33 13.96 19.2 16.27 12 21 12 21z"
                fill={isFavorited ? "#e53e3e" : "none"}
                stroke={isFavorited ? "#e53e3e" : "currentColor"}
                strokeWidth="1"
              />
            </svg>
          </button>
        )}

        {/* Price Badge */}
        {land.marketInfo?.askingPrice && (
          <div className="absolute bottom-3 left-3 bg-emerald-500 text-slate-950 px-3 py-1 rounded-full text-sm font-semibold shadow-md shadow-emerald-500/40">
            {formatPrice(land.marketInfo.askingPrice)}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Location */}
        <div className="flex items-center gap-1 text-slate-400 mb-2">
          <MapPin className="w-4 h-4" />
          <span className="text-sm">
            {land.village}, {land.district}, {land.state}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-white mb-2 line-clamp-2">
          {land.landType} Land - Survey No. {land.surveyNumber}
        </h3>

        {/* Area */}
        <p className="text-slate-400 text-sm mb-3">{formatArea(land)}</p>

        {/* Description */}
        {land.marketInfo?.description && (
          <p className="text-slate-300 text-sm mb-3 line-clamp-2">
            {land.marketInfo.description}
          </p>
        )}

        {/* Features */}
        {features.length > 0 && (
          <div className="mb-3">
            <ul className="text-xs text-slate-400 space-y-1">
              {features.slice(0, 3).map((feature, index) => (
                <li key={index} className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-yellow-400" />
                  {feature}
                </li>
              ))}
              {features.length > 3 && (
                <li className="text-slate-500">
                  +{features.length - 3} more features
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Amenities */}
        {amenities.length > 0 && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-1">
              {amenities.slice(0, 3).map((amenity, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-emerald-500/20 text-emerald-300 text-xs rounded-full border border-emerald-500/30"
                >
                  {amenity}
                </span>
              ))}
              {amenities.length > 3 && (
                <span className="px-2 py-1 bg-slate-800/50 text-slate-400 text-xs rounded-full">
                  +{amenities.length - 3}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4">
          {activeTab === "my-ads" || isOwner ? (
            // Owner actions
            <>
              {land.status === "FOR_SALE" && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(land);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-4 border border-emerald-500 text-emerald-300 rounded-lg hover:bg-emerald-500/10 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
              )}
              {land.status === "FOR_SALE" && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(land);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-4 border border-red-500 text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove
                </button>
              )}
            </>
          ) : (
            // Buyer actions - only show if user is not the owner
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onChat();
                }}
                className="flex-1 flex items-center justify-center gap-2 py-2 px-4 border border-emerald-500 text-emerald-300 rounded-lg hover:bg-emerald-500/10 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                Chat
              </button>
              {/* <button
                onClick={(e) => {
                  e.stopPropagation();
                  onBuy();
                }}
                className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <ShoppingCart className="w-4 h-4" />
                Buy Now
              </button> */}
            </>
          )}
        </div>

        {/* Additional Info */}
        <div className="mt-3 pt-3 border-t border-slate-800/50 flex items-center justify-between text-xs text-slate-500">
          <span>
            Listed{" "}
            {new Date(
              land.marketInfo?.listedDate || land.createdAt
            ).toLocaleDateString()}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            Verified
          </span>
        </div>
      </div>
    </div>
  );
};

// Scoped styles for heart icon (kept local to this file)
// If your project uses a different styling system, these can be moved accordingly.
// Note: In a TSX file without CSS-in-JS setup, this block is harmless but will be ignored by the bundler.
// If you prefer, add these classes to a CSS/SCSS file instead.

export default LandMarketplace;
