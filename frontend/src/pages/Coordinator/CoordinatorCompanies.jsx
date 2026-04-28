import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const CoordinatorCompanies = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showDetails, setShowDetails] = useState(null);

  useEffect(() => {
    if (user?.role !== 'coordinator') {
      navigate('/dashboard');
      return;
    }
    fetchCompanies();
  }, [user, navigate]);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/companies/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      const data = await response.json();
      setCompanies(data.results || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (companyId, action) => {
    try {
      await fetch(`/api/companies/${companyId}/approve/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action })
      });
      
      fetchCompanies();
    } catch (error) {
      console.error('Error updating company status:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredCompanies = companies.filter(company => {
    if (filter === 'all') return true;
    return company.verification_status === filter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Company Management</h1>
        <p className="text-gray-600">Review and approve company registrations</p>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex flex-wrap gap-2">
          {[
            { value: 'all', label: 'All Companies' },
            { value: 'pending', label: 'Pending Approval' },
            { value: 'approved', label: 'Approved' },
            { value: 'rejected', label: 'Rejected' }
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setFilter(option.value)}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                filter === option.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Companies List */}
      <div className="bg-white shadow overflow-hidden rounded-lg">
        {filteredCompanies.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {filteredCompanies.map((company) => (
              <div key={company.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-medium text-gray-900">
                        {company.company_name}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(company.verification_status)}`}>
                        {company.verification_status}
                      </span>
                    </div>
                    
                    <p className="mt-1 text-sm text-gray-600">
                      {company.industry} • {company.address}
                    </p>
                    
                    {company.website && (
                      <p className="mt-1 text-sm text-blue-600">
                        <a href={company.website} target="_blank" rel="noopener noreferrer">
                          {company.website}
                        </a>
                      </p>
                    )}
                    
                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-900">Contact Information</p>
                      <p className="text-sm text-gray-600">
                        {company.user?.first_name} {company.user?.last_name}
                      </p>
                      <p className="text-sm text-gray-600">{company.user?.email}</p>
                      {company.user?.phone && (
                        <p className="text-sm text-gray-600">{company.user?.phone}</p>
                      )}
                    </div>
                    
                    <div className="mt-3 text-sm text-gray-500">
                      Registered: {new Date(company.user?.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div className="ml-4 flex flex-col space-y-2">
                    <button
                      onClick={() => setShowDetails(showDetails === company.id ? null : company.id)}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                      {showDetails === company.id ? 'Hide Details' : 'View Details'}
                    </button>
                    
                    {company.verification_status === 'pending' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleApproval(company.id, 'approve')}
                          className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleApproval(company.id, 'reject')}
                          className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Detailed Information */}
                {showDetails === company.id && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Company Information</h4>
                        <dl className="space-y-2">
                          <div>
                            <dt className="text-sm text-gray-500">Company Name</dt>
                            <dd className="text-sm text-gray-900">{company.company_name}</dd>
                          </div>
                          <div>
                            <dt className="text-sm text-gray-500">Industry</dt>
                            <dd className="text-sm text-gray-900">{company.industry}</dd>
                          </div>
                          <div>
                            <dt className="text-sm text-gray-500">Address</dt>
                            <dd className="text-sm text-gray-900">{company.address}</dd>
                          </div>
                          {company.website && (
                            <div>
                              <dt className="text-sm text-gray-500">Website</dt>
                              <dd className="text-sm text-gray-900">
                                <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-blue-600">
                                  {company.website}
                                </a>
                              </dd>
                            </div>
                          )}
                        </dl>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-3">User Account</h4>
                        <dl className="space-y-2">
                          <div>
                            <dt className="text-sm text-gray-500">Name</dt>
                            <dd className="text-sm text-gray-900">
                              {company.user?.first_name} {company.user?.last_name}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm text-gray-500">Email</dt>
                            <dd className="text-sm text-gray-900">{company.user?.email}</dd>
                          </div>
                          {company.user?.phone && (
                            <div>
                              <dt className="text-sm text-gray-500">Phone</dt>
                              <dd className="text-sm text-gray-900">{company.user?.phone}</dd>
                            </div>
                          )}
                          <div>
                            <dt className="text-sm text-gray-500">Registration Date</dt>
                            <dd className="text-sm text-gray-900">
                              {new Date(company.user?.created_at).toLocaleDateString()}
                            </dd>
                          </div>
                        </dl>
                      </div>
                    </div>
                    
                    {/* Internships Posted */}
                    <div className="mt-6">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Posted Internships</h4>
                      <div className="text-sm text-gray-600">
                        {company.internships?.length > 0 ? (
                          <ul className="space-y-1">
                            {company.internships.map((internship) => (
                              <li key={internship.id}>
                                • {internship.title} ({internship.status})
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p>No internships posted yet.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No companies found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filter === 'all' ? 'No companies have registered yet.' : `No ${filter} companies found.`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoordinatorCompanies;
