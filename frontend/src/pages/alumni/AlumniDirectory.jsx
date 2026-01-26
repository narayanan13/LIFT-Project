import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { FaUsers, FaUser, FaBriefcase, FaGraduationCap, FaLinkedin, FaSearch } from 'react-icons/fa';

export default function AlumniDirectory() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProfile, setSelectedProfile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfiles();
  }, []);

  async function fetchProfiles() {
    try {
      setLoading(true);
      const res = await api.get('/alumni/profiles');
      setProfiles(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function viewProfile(userId) {
    try {
      const res = await api.get(`/alumni/profiles/${userId}`);
      setSelectedProfile(res.data);
    } catch (err) {
      console.error(err);
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return 'Present';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }

  const filteredProfiles = profiles.filter(profile => {
    const search = searchTerm.toLowerCase();
    const addressParts = [profile.addressLine, profile.area, profile.city, profile.state, profile.country]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return (
      profile.user?.name?.toLowerCase().includes(search) ||
      profile.profession?.toLowerCase().includes(search) ||
      profile.institution?.toLowerCase().includes(search) ||
      addressParts.includes(search) ||
      profile.jobHistory?.[0]?.companyName?.toLowerCase().includes(search)
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-deep-red"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-6 py-8 bg-transparent">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gradient mb-2">Alumni Directory</h1>
          <p className="text-soft-peach">Connect with fellow alumni and explore their journeys</p>
        </div>

        {/* Search Bar */}
        <div className="mb-6 max-w-md">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, profession, company, or location..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-deep-red focus:border-transparent"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6">
          <span className="text-gray-600">
            <FaUsers className="inline mr-2" />
            {filteredProfiles.length} alumni {searchTerm && `matching "${searchTerm}"`}
          </span>
        </div>

        {/* Profiles Grid */}
        {filteredProfiles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProfiles.map(profile => {
              const currentJob = profile.jobHistory?.[0];
              return (
                <div
                  key={profile.id}
                  className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => viewProfile(profile.userId)}
                >
                  <div className="flex items-start mb-4">
                    <div className="w-12 h-12 bg-deep-red rounded-full flex items-center justify-center text-white text-xl font-bold mr-3 flex-shrink-0">
                      {profile.user?.name?.charAt(0).toUpperCase() || 'A'}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-800 truncate">{profile.user?.name}</h3>
                      {profile.profession && (
                        <p className="text-deep-red text-sm truncate">{profile.profession}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    {currentJob && (
                      <div className="flex items-center text-gray-600">
                        <FaBriefcase className="mr-2 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{currentJob.role} at {currentJob.companyName}</span>
                      </div>
                    )}
                    <div className="flex items-center text-gray-600">
                      <FaGraduationCap className="mr-2 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{profile.degree}, {profile.graduationYear}</span>
                    </div>
                    {(profile.addressLine || profile.area || profile.city || profile.state || profile.country) && profile.shareAddress && (
                      <div className="text-gray-500 truncate">
                        {[profile.addressLine, profile.area, profile.city, profile.state, profile.country]
                          .filter(Boolean)
                          .join(', ')}
                      </div>
                    )}
                  </div>

                  {profile.linkedinProfile && (
                    <a
                      href={profile.linkedinProfile}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="inline-flex items-center text-blue-600 text-sm mt-3 hover:underline"
                    >
                      <FaLinkedin className="mr-1" /> LinkedIn
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <FaUsers className="text-6xl text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              {searchTerm ? 'No Results Found' : 'No Profiles Yet'}
            </h2>
            <p className="text-gray-500">
              {searchTerm
                ? 'Try adjusting your search terms.'
                : 'Be the first to complete your profile!'}
            </p>
          </div>
        )}

        {/* Profile Detail Modal */}
        {selectedProfile && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start mb-6">
                  <div className="w-16 h-16 bg-deep-red rounded-full flex items-center justify-center text-white text-2xl font-bold mr-4 flex-shrink-0">
                    {selectedProfile.user?.name?.charAt(0).toUpperCase() || 'A'}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">{selectedProfile.user?.name}</h2>
                    <p className="text-gray-500">{selectedProfile.user?.email}</p>
                    {selectedProfile.profession && (
                      <p className="text-deep-red font-medium">{selectedProfile.profession}</p>
                    )}
                  </div>
                </div>

                {/* Profile Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="flex items-start">
                    <FaGraduationCap className="text-deep-red mt-1 mr-3" />
                    <div>
                      <div className="text-sm text-gray-500">Education</div>
                      <div className="font-medium">{selectedProfile.degree}</div>
                      <div className="text-gray-600">{selectedProfile.institution}, {selectedProfile.graduationYear}</div>
                    </div>
                  </div>

                  {(selectedProfile.addressLine || selectedProfile.area || selectedProfile.city || selectedProfile.state || selectedProfile.country) && selectedProfile.shareAddress && (
                    <div>
                      <div className="text-sm text-gray-500">Location</div>
                      <div className="font-medium">
                        {[selectedProfile.addressLine, selectedProfile.area, selectedProfile.city, selectedProfile.state, selectedProfile.country]
                          .filter(Boolean)
                          .join(', ')}
                      </div>
                    </div>
                  )}

                  {selectedProfile.contactNumber && (
                    <div>
                      <div className="text-sm text-gray-500">Contact</div>
                      <div className="font-medium">{selectedProfile.contactNumber}</div>
                    </div>
                  )}

                  {selectedProfile.linkedinProfile && (
                    <div>
                      <div className="text-sm text-gray-500">LinkedIn</div>
                      <a
                        href={selectedProfile.linkedinProfile}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline inline-flex items-center"
                      >
                        <FaLinkedin className="mr-1" /> View Profile
                      </a>
                    </div>
                  )}
                </div>

                {/* Career History */}
                {selectedProfile.jobHistory?.length > 0 && (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                      <FaBriefcase className="mr-2 text-warm-red" /> Career History
                    </h3>
                    <div className="space-y-3">
                      {selectedProfile.jobHistory.map(job => (
                        <div
                          key={job.id}
                          className={`p-3 border rounded-lg ${!job.endDate ? 'border-l-4 border-l-green-500' : ''}`}
                        >
                          <div className="font-medium text-gray-800">{job.role}</div>
                          <div className="text-deep-red">
                            {job.companyWebsite ? (
                              <a
                                href={job.companyWebsite}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:underline"
                              >
                                {job.companyName}
                              </a>
                            ) : (
                              job.companyName
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDate(job.startDate)} - {formatDate(job.endDate)}
                            {!job.endDate && (
                              <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
                                Current
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Close Button */}
                <div className="flex justify-end mt-6 pt-4 border-t">
                  <button
                    onClick={() => setSelectedProfile(null)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
