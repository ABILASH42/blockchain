import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  Download, 
  User, 
  MapPin, 
  DollarSign,
  Calendar,
  FileText
} from 'lucide-react';
import apiService from '../services/api';

interface Transaction {
  _id: string;
  landId: {
    _id: string;
    assetId: string;
    surveyNumber: string;
    village: string;
    district: string;
    state: string;
    area: {
      acres?: number;
      guntas?: number;
      sqft?: number;
    };
    landType: string;
    marketInfo: {
      askingPrice?: number;
    };
    originalDocument?: {
      filename: string;
      url: string;
    };
    digitalDocument?: {
      url: string;
    };
  };
  seller: {
    _id: string;
    fullName: string;
    email: string;
    verificationStatus: string;
    verificationDocuments?: any;
  };
  buyer: {
    _id: string;
    fullName: string;
    email: string;
    verificationStatus: string;
    verificationDocuments?: any;
  };
  agreedPrice: number;
  status: string;
  createdAt: string;
  timeline: Array<{
    event: string;
    timestamp: string;
    performedBy: any;
    description: string;
  }>;
}

interface AdminTransactionDashboardProps {
  onClose?: () => void;
}

const AdminTransactionDashboard: React.FC<AdminTransactionDashboardProps> = ({ onClose }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [approvalComments, setApprovalComments] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    loadPendingTransactions();
  }, []);

  const loadPendingTransactions = async () => {
    try {
      setLoading(true);
      const response = await apiService.getPendingTransactions();
      setTransactions(response.transactions || []);
    } catch (error: any) {
      setError(error.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (transactionId: string) => {
    try {
      const response = await apiService.getTransactionDetails(transactionId);
      setSelectedTransaction(response.transaction);
      setShowDetails(true);
    } catch (error: any) {
      setError(error.message || 'Failed to load transaction details');
    }
  };

  const handleApprove = async (transactionId: string) => {
    try {
      await apiService.approveTransaction(transactionId);
      setShowDetails(false);
      setSelectedTransaction(null);
      setApprovalComments('');
      await loadPendingTransactions();
      alert('Transaction approved successfully');
    } catch (error: any) {
      setError(error.message || 'Failed to approve transaction');
    }
  };

  const handleReject = async (transactionId: string) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    try {
      await apiService.rejectTransaction(transactionId, rejectionReason);
      setShowDetails(false);
      setSelectedTransaction(null);
      setRejectionReason('');
      await loadPendingTransactions();
      alert('Transaction rejected');
    } catch (error: any) {
      setError(error.message || 'Failed to reject transaction');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-300 mb-4">{error}</p>
        <button 
          onClick={loadPendingTransactions}
          className="px-4 py-2 bg-emerald-500 text-slate-950 rounded hover:bg-emerald-400 font-semibold shadow-md shadow-emerald-500/40"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Pending Transactions</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <XCircle className="w-6 h-6" />
          </button>
        )}
      </div>

      {transactions.length === 0 ? (
        <div className="text-center py-12">
          <Clock className="w-16 h-16 text-slate-500 mx-auto mb-4" />
          <p className="text-slate-300 text-lg">No pending transactions</p>
        </div>
      ) : (
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <div key={transaction._id} className="bg-slate-900/60 rounded-lg shadow-lg border border-slate-800 p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Transaction #{transaction._id.slice(-8)}
                  </h3>
                  <p className="text-sm text-slate-400">
                    {formatDate(transaction.createdAt)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewDetails(transaction._id)}
                    className="px-4 py-2 bg-emerald-500 text-slate-950 rounded hover:bg-emerald-400 flex items-center gap-2 font-semibold shadow-md shadow-emerald-500/40 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    View Details
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Land Details */}
                <div className="bg-slate-800/40 p-4 rounded border border-slate-700/50">
                  <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    Land Details
                  </h4>
                  <p className="text-sm text-slate-300">Asset ID: {transaction.landId.assetId}</p>
                  <p className="text-sm text-slate-300">Survey: {transaction.landId.surveyNumber}</p>
                  <p className="text-sm text-slate-300">
                    {transaction.landId.village}, {transaction.landId.district}
                  </p>
                  <p className="text-sm text-slate-300">Type: {transaction.landId.landType}</p>
                </div>

                {/* Seller Details */}
                <div className="bg-slate-800/40 p-4 rounded border border-slate-700/50">
                  <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                    <User className="w-4 h-4 text-emerald-400" />
                    Seller
                  </h4>
                  <p className="text-sm text-white font-medium">{transaction.seller.fullName}</p>
                  <p className="text-sm text-slate-300">{transaction.seller.email}</p>
                  <p className="text-sm text-slate-300">
                    Status: <span className={`px-2 py-1 rounded text-xs ${
                      transaction.seller.verificationStatus === 'VERIFIED' 
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {transaction.seller.verificationStatus}
                    </span>
                  </p>
                </div>

                {/* Buyer Details */}
                <div className="bg-slate-800/40 p-4 rounded border border-slate-700/50">
                  <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                    <User className="w-4 h-4 text-emerald-400" />
                    Buyer
                  </h4>
                  <p className="text-sm text-white font-medium">{transaction.buyer.fullName}</p>
                  <p className="text-sm text-slate-300">{transaction.buyer.email}</p>
                  <p className="text-sm text-slate-300">
                    Status: <span className={`px-2 py-1 rounded text-xs ${
                      transaction.buyer.verificationStatus === 'VERIFIED' 
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {transaction.buyer.verificationStatus}
                    </span>
                  </p>
                </div>
              </div>

              <div className="mt-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <span className="text-lg font-bold text-emerald-400">
                    {formatPrice(transaction.agreedPrice)}
                  </span>
                </div>
                <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-sm font-medium">
                  Pending Approval
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Transaction Details Modal */}
      {showDetails && selectedTransaction && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">
                  Transaction Details
                </h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              {/* Detailed transaction information */}
              <div className="space-y-6">
                {/* Land Information */}
                <div className="bg-slate-800/40 p-4 rounded border border-slate-700/50">
                  <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-emerald-400" />
                    Land Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-400">Asset ID:</p>
                      <p className="font-medium text-white">{selectedTransaction.landId.assetId}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Survey Number:</p>
                      <p className="font-medium text-white">{selectedTransaction.landId.surveyNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Location:</p>
                      <p className="font-medium text-white">
                        {selectedTransaction.landId.village}, {selectedTransaction.landId.district}, {selectedTransaction.landId.state}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Land Type:</p>
                      <p className="font-medium text-white">{selectedTransaction.landId.landType}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Area:</p>
                      <p className="font-medium text-white">
                        {selectedTransaction.landId.area.acres && `${selectedTransaction.landId.area.acres} acres`}
                        {selectedTransaction.landId.area.guntas && ` ${selectedTransaction.landId.area.guntas} guntas`}
                        {selectedTransaction.landId.area.sqft && ` ${selectedTransaction.landId.area.sqft} sqft`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Documents */}
                {(selectedTransaction.landId.originalDocument || selectedTransaction.landId.digitalDocument) && (
                  <div className="bg-slate-800/40 p-4 rounded border border-slate-700/50">
                    <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-emerald-400" />
                      Documents
                    </h4>
                    <div className="flex gap-4">
                      {selectedTransaction.landId.originalDocument && (
                        <a
                          href={selectedTransaction.landId.originalDocument.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-slate-950 rounded hover:bg-emerald-400 font-semibold shadow-md shadow-emerald-500/40 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          Original Document
                        </a>
                      )}
                      {selectedTransaction.landId.digitalDocument && (
                        <a
                          href={selectedTransaction.landId.digitalDocument.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-slate-950 rounded hover:bg-teal-400 font-semibold shadow-md shadow-teal-500/40 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          Digital Document
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Transaction Actions */}
                <div className="bg-slate-800/40 p-4 rounded border border-slate-700/50">
                  <h4 className="font-semibold text-white mb-3">Admin Actions</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Approval Comments (Optional)
                      </label>
                      <textarea
                        value={approvalComments}
                        onChange={(e) => setApprovalComments(e.target.value)}
                        className="w-full p-3 border border-slate-700 bg-slate-800/60 text-white rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-slate-500"
                        rows={3}
                        placeholder="Add any comments for approval..."
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Rejection Reason (If rejecting)
                      </label>
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        className="w-full p-3 border border-slate-700 bg-slate-800/60 text-white rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent placeholder-slate-500"
                        rows={3}
                        placeholder="Provide reason for rejection..."
                      />
                    </div>

                    <div className="flex gap-4">
                      <button
                        onClick={() => handleApprove(selectedTransaction._id)}
                        className="flex items-center gap-2 px-6 py-2 bg-emerald-500 text-slate-950 rounded hover:bg-emerald-400 font-semibold shadow-md shadow-emerald-500/40 transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve Transaction
                      </button>
                      <button
                        onClick={() => handleReject(selectedTransaction._id)}
                        className="flex items-center gap-2 px-6 py-2 bg-red-500 text-white rounded hover:bg-red-400 font-semibold shadow-md shadow-red-500/40 transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject Transaction
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTransactionDashboard;
