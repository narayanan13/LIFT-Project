import React, { useEffect, useState } from 'react';
import api from '../../api';
import { FaUser, FaEdit, FaPlus, FaBriefcase, FaTrash, FaLinkedin, FaGraduationCap } from 'react-icons/fa';
import ToastNotification from '../../components/ToastNotification';

export default function AlumniProfile() {
  const [profile, setProfile] = useState(null);
  const [hasProfile, setHasProfile] = useState(true);
  const [loading, setLoading] = useState(true);

  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('error');
  const [toastVisible, setToastVisible] = useState(false);

  // Profile form state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [profileForm, setProfileForm] = useState({
    degree: '',
    institution: '',
    graduationYear: '',
    dateOfBirth: '',
    contactNumber: '',
    currentResidence: '',
    profession: '',
    linkedinProfile: ''
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Job form state
  const [showJobModal, setShowJobModal] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [jobForm, setJobForm] = useState({
    companyName: '',
    role: '',
    startDate: '',
    companyWebsite: '',
    endDate: '',
    isCurrent: false
  });
  const [savingJob, setSavingJob] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      setLoading(true);
      const res = await api.get('/alumni/profile');
      setProfile(res.data);
      setHasProfile(true);
    } catch (err) {
      if (err.response?.status === 404) {
        setHasProfile(false);
        setProfile(null);
      } else {
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  }

  function showToast(message, type = 'info') {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  }

  function openCreateProfile() {
    setIsCreating(true);
    setProfileForm({
      degree: '',
      institution: '',
      graduationYear: '',
      dateOfBirth: '',
      contactNumber: '',
      currentResidence: '',
      profession: '',
      linkedinProfile: ''
    });
    setShowProfileModal(true);
  }

  function openEditProfile() {
    setIsCreating(false);
    setProfileForm({
      degree: profile.degree || '',
      institution: profile.institution || '',
      graduationYear: profile.graduationYear || '',
      dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.split('T')[0] : '',
      contactNumber: profile.contactNumber || '',
      currentResidence: profile.currentResidence || '',
      profession: profile.profession || '',
      linkedinProfile: profile.linkedinProfile || ''
    });
    setShowProfileModal(true);
  }

  async function handleProfileSubmit(e) {
    e.preventDefault();
    if (!profileForm.degree.trim() || !profileForm.institution.trim() || !profileForm.graduationYear || !profileForm.dateOfBirth) {
      showToast('Please fill in all required fields', 'error');
      return;
    }
    setSavingProfile(true);
    try {
      if (isCreating) {
        await api.post('/alumni/profile', {
          ...profileForm,
          graduationYear: parseInt(profileForm.graduationYear)
        });
        showToast('Profile created successfully!', 'success');
      } else {
        await api.put('/alumni/profile', {
          ...profileForm,
          graduationYear: parseInt(profileForm.graduationYear)
        });
        showToast('Profile updated successfully!', 'success');
      }
      setShowProfileModal(false);
      await fetchProfile();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to save profile', 'error');
    } finally {
      setSavingProfile(false);
    }
  }

  function openAddJob() {
    setEditingJob(null);
    setJobForm({
      companyName: '',
      role: '',
      startDate: '',
      companyWebsite: '',
      endDate: '',
      isCurrent: false
    });
    setShowJobModal(true);
  }

  function openEditJob(job) {
    setEditingJob(job);
    setJobForm({
      companyName: job.companyName || '',
      role: job.role || '',
      startDate: job.startDate ? job.startDate.split('T')[0] : '',
      companyWebsite: job.companyWebsite || '',
      endDate: job.endDate ? job.endDate.split('T')[0] : '',
      isCurrent: !job.endDate
    });
    setShowJobModal(true);
  }

  async function handleJobSubmit(e) {
    e.preventDefault();
    if (!jobForm.companyName.trim() || !jobForm.role.trim() || !jobForm.startDate) {
      showToast('Please fill in all required fields', 'error');
      return;
    }
    setSavingJob(true);
    try {
      const payload = {
        companyName: jobForm.companyName,
        role: jobForm.role,
        startDate: jobForm.startDate,
        companyWebsite: jobForm.companyWebsite || null,
        endDate: jobForm.isCurrent ? null : (jobForm.endDate || null)
      };

      if (editingJob) {
        await api.put(`/alumni/profile/jobs/${editingJob.id}`, payload);
        showToast('Job updated successfully!', 'success');
      } else {
        await api.post('/alumni/profile/jobs', payload);
        showToast('Job added successfully!', 'success');
      }
      setShowJobModal(false);
      await fetchProfile();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to save job', 'error');
    } finally {
      setSavingJob(false);
    }
  }

  async function handleDeleteJob(jobId) {
    if (!confirm('Are you sure you want to delete this job entry?')) return;
    try {
      await api.delete(`/alumni/profile/jobs/${jobId}`);
      showToast('Job deleted successfully!', 'success');
      await fetchProfile();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to delete job', 'error');
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return 'Present';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }

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
          <h1 className="text-4xl font-bold text-gradient mb-2">My Profile</h1>
          <p className="text-soft-peach">Manage your alumni profile and career history</p>
        </div>

        {!hasProfile ? (
          // No profile - show create prompt
          <div className="bg-white rounded-2xl shadow-sm p-8 max-w-2xl text-center">
            <FaUser className="text-6xl text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-700 mb-2">Complete Your Profile</h2>
            <p className="text-gray-500 mb-6">
              Set up your alumni profile to connect with other members and share your career journey.
            </p>
            <button
              onClick={openCreateProfile}
              className="bg-deep-red hover:bg-warm-red text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center"
            >
              <FaPlus className="mr-2" /> Create Profile
            </button>
          </div>
        ) : (
          <>
            {/* Profile Card */}
            <div className="bg-white rounded-2xl shadow-sm p-6 mb-8 max-w-2xl">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center">
                  <div className="w-16 h-16 bg-deep-red rounded-full flex items-center justify-center text-white text-2xl font-bold mr-4">
                    {profile.user?.name?.charAt(0).toUpperCase() || 'A'}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">{profile.user?.name}</h2>
                    <p className="text-gray-500">{profile.user?.email}</p>
                    {profile.profession && (
                      <p className="text-deep-red font-medium">{profile.profession}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={openEditProfile}
                  className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                  title="Edit profile"
                >
                  <FaEdit className="text-lg" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start">
                  <FaGraduationCap className="text-deep-red mt-1 mr-3" />
                  <div>
                    <div className="text-sm text-gray-500">Education</div>
                    <div className="font-medium">{profile.degree}</div>
                    <div className="text-gray-600">{profile.institution}, {profile.graduationYear}</div>
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-500">Date of Birth</div>
                  <div className="font-medium">{new Date(profile.dateOfBirth).toLocaleDateString()}</div>
                </div>

                {profile.contactNumber && (
                  <div>
                    <div className="text-sm text-gray-500">Contact Number</div>
                    <div className="font-medium">{profile.contactNumber}</div>
                  </div>
                )}

                {profile.currentResidence && (
                  <div>
                    <div className="text-sm text-gray-500">Current Residence</div>
                    <div className="font-medium">{profile.currentResidence}</div>
                  </div>
                )}

                {profile.linkedinProfile && (
                  <div className="md:col-span-2">
                    <div className="text-sm text-gray-500">LinkedIn</div>
                    <a
                      href={profile.linkedinProfile}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline inline-flex items-center"
                    >
                      <FaLinkedin className="mr-1" /> View Profile
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Job History Section */}
            <div className="bg-white rounded-2xl shadow-sm p-6 max-w-2xl">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center">
                  <FaBriefcase className="text-warm-red mr-2 text-xl" />
                  <h2 className="text-xl font-semibold text-deep-red">Career History</h2>
                </div>
                <button
                  onClick={openAddJob}
                  className="bg-deep-red hover:bg-warm-red text-white px-4 py-2 rounded-lg font-medium transition-colors inline-flex items-center text-sm"
                >
                  <FaPlus className="mr-1" /> Add Job
                </button>
              </div>

              {profile.jobHistory?.length > 0 ? (
                <div className="space-y-4">
                  {profile.jobHistory.map((job, index) => (
                    <div
                      key={job.id}
                      className={`p-4 border rounded-lg hover:bg-gray-50 transition-colors ${
                        !job.endDate ? 'border-l-4 border-l-green-500' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-semibold text-gray-800">{job.role}</div>
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
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditJob(job)}
                            className="p-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
                            title="Edit job"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDeleteJob(job.id)}
                            className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
                            title="Delete job"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  No career history added yet. Add your first job to showcase your journey!
                </p>
              )}
            </div>
          </>
        )}

        {/* Profile Modal */}
        {showProfileModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto mx-4">
              <div className="flex items-center mb-4">
                <FaUser className="text-deep-red mr-2" />
                <h2 className="text-xl font-semibold">{isCreating ? 'Create Profile' : 'Edit Profile'}</h2>
              </div>
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="border-b pb-4 mb-4">
                  <h3 className="font-medium text-gray-700 mb-3">Education (Required)</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Degree *</label>
                      <input
                        type="text"
                        placeholder="e.g., B.Tech in Computer Science"
                        value={profileForm.degree}
                        onChange={e => setProfileForm({ ...profileForm, degree: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-deep-red focus:border-transparent"
                        disabled={savingProfile}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Institution *</label>
                      <input
                        type="text"
                        placeholder="e.g., Anna University"
                        value={profileForm.institution}
                        onChange={e => setProfileForm({ ...profileForm, institution: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-deep-red focus:border-transparent"
                        disabled={savingProfile}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Graduation Year *</label>
                      <input
                        type="number"
                        placeholder="e.g., 2020"
                        value={profileForm.graduationYear}
                        min="1950"
                        max={new Date().getFullYear() + 5}
                        onChange={e => setProfileForm({ ...profileForm, graduationYear: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-deep-red focus:border-transparent"
                        disabled={savingProfile}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
                  <input
                    type="date"
                    value={profileForm.dateOfBirth}
                    onChange={e => setProfileForm({ ...profileForm, dateOfBirth: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-deep-red focus:border-transparent"
                    disabled={savingProfile}
                    required
                  />
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-medium text-gray-700 mb-3">Additional Info (Optional)</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                      <input
                        type="tel"
                        placeholder="e.g., +91 9876543210"
                        value={profileForm.contactNumber}
                        onChange={e => setProfileForm({ ...profileForm, contactNumber: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-deep-red focus:border-transparent"
                        disabled={savingProfile}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Current Residence</label>
                      <input
                        type="text"
                        placeholder="e.g., Chennai, Tamil Nadu"
                        value={profileForm.currentResidence}
                        onChange={e => setProfileForm({ ...profileForm, currentResidence: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-deep-red focus:border-transparent"
                        disabled={savingProfile}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Profession</label>
                      <input
                        type="text"
                        placeholder="e.g., Software Engineer"
                        value={profileForm.profession}
                        onChange={e => setProfileForm({ ...profileForm, profession: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-deep-red focus:border-transparent"
                        disabled={savingProfile}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn Profile</label>
                      <input
                        type="url"
                        placeholder="https://linkedin.com/in/yourprofile"
                        value={profileForm.linkedinProfile}
                        onChange={e => setProfileForm({ ...profileForm, linkedinProfile: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-deep-red focus:border-transparent"
                        disabled={savingProfile}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowProfileModal(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    disabled={savingProfile}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="px-4 py-2 bg-deep-red text-white rounded-lg hover:bg-warm-red transition-colors disabled:opacity-50"
                  >
                    {savingProfile ? 'Saving...' : (isCreating ? 'Create Profile' : 'Save Changes')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Job Modal */}
        {showJobModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto mx-4">
              <div className="flex items-center mb-4">
                <FaBriefcase className="text-deep-red mr-2" />
                <h2 className="text-xl font-semibold">{editingJob ? 'Edit Job' : 'Add Job'}</h2>
              </div>
              <form onSubmit={handleJobSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                  <input
                    type="text"
                    placeholder="e.g., Google"
                    value={jobForm.companyName}
                    onChange={e => setJobForm({ ...jobForm, companyName: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-deep-red focus:border-transparent"
                    disabled={savingJob}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                  <input
                    type="text"
                    placeholder="e.g., Senior Software Engineer"
                    value={jobForm.role}
                    onChange={e => setJobForm({ ...jobForm, role: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-deep-red focus:border-transparent"
                    disabled={savingJob}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Website</label>
                  <input
                    type="url"
                    placeholder="https://company.com"
                    value={jobForm.companyWebsite}
                    onChange={e => setJobForm({ ...jobForm, companyWebsite: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-deep-red focus:border-transparent"
                    disabled={savingJob}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                    <input
                      type="date"
                      value={jobForm.startDate}
                      onChange={e => setJobForm({ ...jobForm, startDate: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-deep-red focus:border-transparent"
                      disabled={savingJob}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      value={jobForm.endDate}
                      onChange={e => setJobForm({ ...jobForm, endDate: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-deep-red focus:border-transparent disabled:bg-gray-100"
                      disabled={savingJob || jobForm.isCurrent}
                    />
                  </div>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isCurrent"
                    checked={jobForm.isCurrent}
                    onChange={e => setJobForm({ ...jobForm, isCurrent: e.target.checked, endDate: '' })}
                    className="w-4 h-4 text-deep-red focus:ring-deep-red border-gray-300 rounded"
                    disabled={savingJob}
                  />
                  <label htmlFor="isCurrent" className="ml-2 text-sm text-gray-700">
                    I currently work here
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowJobModal(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    disabled={savingJob}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingJob}
                    className="px-4 py-2 bg-deep-red text-white rounded-lg hover:bg-warm-red transition-colors disabled:opacity-50"
                  >
                    {savingJob ? 'Saving...' : (editingJob ? 'Save Changes' : 'Add Job')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <ToastNotification
          message={toastMessage}
          type={toastType}
          visible={toastVisible}
          onClose={() => setToastVisible(false)}
        />
      </div>
    </div>
  );
}
