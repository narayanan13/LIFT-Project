import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Contribution, Expense, Invitation, User } from '../types';
import { sendInvitationEmail } from '../services/emailService';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface DataContextType {
  // Data
  contributions: Contribution[];
  expenses: Expense[];
  invitations: Invitation[];
  users: User[];
  loading: boolean;
  
  // Actions
  addContribution: (contribution: Omit<Contribution, 'id' | 'created_at' | 'updated_at'>) => Promise<boolean>;
  addExpense: (expense: Omit<Expense, 'id' | 'created_at' | 'updated_at'>) => Promise<boolean>;
  addInvitation: (invitation: Omit<Invitation, 'id' | 'created_at'>, emailData?: { fullName?: string; personalMessage?: string }) => Promise<boolean>;
  updateContribution: (id: string, contribution: Partial<Contribution>) => Promise<boolean>;
  updateExpense: (id: string, expense: Partial<Expense>) => Promise<boolean>;
  deleteContribution: (id: string) => Promise<boolean>;
  deleteExpense: (id: string) => Promise<boolean>;
  deleteInvitation: (id: string) => Promise<boolean>;
  resendInvitation: (id: string, emailData?: { fullName?: string; personalMessage?: string }) => Promise<boolean>;
  markInvitationAsUsed: (token: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all data
  const fetchData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch users (profiles)
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;
      setUsers(profilesData || []);

      // Fetch contributions with user data
      const { data: contributionsData, error: contributionsError } = await supabase
        .from('contributions')
        .select(`
          *,
          user:profiles!contributions_user_id_fkey(*)
        `)
        .order('created_at', { ascending: false });

      if (contributionsError) throw contributionsError;
      setContributions(contributionsData || []);

      // Fetch expenses with creator data
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select(`
          *,
          created_by_user:profiles!expenses_created_by_fkey(*)
        `)
        .order('created_at', { ascending: false });

      if (expensesError) throw expensesError;
      setExpenses(expensesData || []);

      // Fetch invitations (only for admins)
      if (user.role === 'admin') {
        const { data: invitationsData, error: invitationsError } = await supabase
          .from('invitations')
          .select('*')
          .order('created_at', { ascending: false });

        if (invitationsError) throw invitationsError;
        setInvitations(invitationsData || []);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Refresh data function
  const refreshData = async () => {
    await fetchData();
  };

  // Load data when user changes
  useEffect(() => {
    if (user) {
      fetchData();
    } else {
      setContributions([]);
      setExpenses([]);
      setInvitations([]);
      setUsers([]);
      setLoading(false);
    }
  }, [user]);

  const addContribution = async (contributionData: Omit<Contribution, 'id' | 'created_at' | 'updated_at'>): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('contributions')
        .insert([contributionData])
        .select(`
          *,
          user:profiles!contributions_user_id_fkey(*)
        `)
        .single();

      if (error) throw error;

      setContributions(prev => [data, ...prev]);
      return true;
    } catch (error) {
      console.error('Error adding contribution:', error);
      return false;
    }
  };

  const addExpense = async (expenseData: Omit<Expense, 'id' | 'created_at' | 'updated_at'>): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .insert([expenseData])
        .select(`
          *,
          created_by_user:profiles!expenses_created_by_fkey(*)
        `)
        .single();

      if (error) throw error;

      setExpenses(prev => [data, ...prev]);
      return true;
    } catch (error) {
      console.error('Error adding expense:', error);
      return false;
    }
  };

  const addInvitation = async (
    invitationData: Omit<Invitation, 'id' | 'created_at'>, 
    emailData?: { fullName?: string; personalMessage?: string }
  ): Promise<boolean> => {
    try {
      // Check for existing user or invitation
      const { data: existingUser, error: userError } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', invitationData.email.toLowerCase())
        .single();
      
      if (userError && userError.code !== 'PGRST116') {
        throw userError;
      }
      
      if (existingUser) {
        console.error('❌ User already exists:', invitationData.email);
        return false;
      }

      const { data: existingInvite, error: inviteError } = await supabase
        .from('invitations')
        .select('*')
        .eq('email', invitationData.email.toLowerCase())
        .eq('used', false)
        .gt('expires_at', new Date().toISOString())
        .single();
      
      if (inviteError && inviteError.code !== 'PGRST116') {
        throw inviteError;
      }
      
      if (existingInvite) {
        console.error('❌ Active invitation already exists:', invitationData.email);
        return false;
      }

      // Generate unique token
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

      // Send email using the email service
      const emailSent = await sendInvitationEmail({
        email: invitationData.email,
        fullName: emailData?.fullName,
        personalMessage: emailData?.personalMessage,
        invitationToken: token
      });

      if (!emailSent) {
        console.error('❌ Failed to send email to:', invitationData.email);
        return false;
      }

      // Add invitation to database
      const { data, error } = await supabase
        .from('invitations')
        .insert([{
          ...invitationData,
          token,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
        }])
        .select()
        .single();

      if (error) throw error;

      setInvitations(prev => [data, ...prev]);
      console.log('✅ Invitation added successfully:', data);
      return true;
    } catch (error) {
      console.error('❌ Error in addInvitation:', error);
      return false;
    }
  };

  const updateContribution = async (id: string, updates: Partial<Contribution>): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('contributions')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          user:profiles!contributions_user_id_fkey(*)
        `)
        .single();

      if (error) throw error;

      setContributions(prev => prev.map(contribution => 
        contribution.id === id ? data : contribution
      ));
      return true;
    } catch (error) {
      console.error('Error updating contribution:', error);
      return false;
    }
  };

  const updateExpense = async (id: string, updates: Partial<Expense>): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          created_by_user:profiles!expenses_created_by_fkey(*)
        `)
        .single();

      if (error) throw error;

      setExpenses(prev => prev.map(expense => 
        expense.id === id ? data : expense
      ));
      return true;
    } catch (error) {
      console.error('Error updating expense:', error);
      return false;
    }
  };

  const deleteContribution = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('contributions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setContributions(prev => prev.filter(contribution => contribution.id !== id));
      return true;
    } catch (error) {
      console.error('Error deleting contribution:', error);
      return false;
    }
  };

  const deleteExpense = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setExpenses(prev => prev.filter(expense => expense.id !== id));
      return true;
    } catch (error) {
      console.error('Error deleting expense:', error);
      return false;
    }
  };

  const deleteInvitation = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('invitations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setInvitations(prev => prev.filter(invitation => invitation.id !== id));
      return true;
    } catch (error) {
      console.error('Error deleting invitation:', error);
      return false;
    }
  };

  const resendInvitation = async (
    id: string, 
    emailData?: { fullName?: string; personalMessage?: string }
  ): Promise<boolean> => {
    try {
      const invitation = invitations.find(i => i.id === id);
      if (!invitation) {
        console.error('❌ Invitation not found:', id);
        return false;
      }

      // Generate new token
      const newToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

      // Send email again
      const emailSent = await sendInvitationEmail({
        email: invitation.email,
        fullName: emailData?.fullName,
        personalMessage: emailData?.personalMessage,
        invitationToken: newToken
      });
      
      if (!emailSent) {
        console.error('❌ Failed to resend email to:', invitation.email);
        return false;
      }

      // Update invitation with new token and expiry
      const { data, error } = await supabase
        .from('invitations')
        .update({
          token: newToken,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setInvitations(prev => prev.map(inv => 
        inv.id === id ? data : inv
      ));
      
      console.log('✅ Invitation resent successfully to:', invitation.email);
      return true;
    } catch (error) {
      console.error('❌ Error resending invitation:', error);
      return false;
    }
  };

  const markInvitationAsUsed = async (token: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('invitations')
        .update({ used: true })
        .eq('token', token);

      if (error) throw error;

      setInvitations(prev => prev.map(inv => 
        inv.token === token ? { ...inv, used: true } : inv
      ));
      
      console.log('✅ Invitation marked as used:', token);
    } catch (error) {
      console.error('❌ Error marking invitation as used:', error);
      throw error;
    }
  };

  return (
    <DataContext.Provider value={{
      contributions,
      expenses,
      invitations,
      users,
      loading,
      addContribution,
      addExpense,
      addInvitation,
      updateContribution,
      updateExpense,
      deleteContribution,
      deleteExpense,
      deleteInvitation,
      resendInvitation,
      markInvitationAsUsed,
      refreshData
    }}>
      {children}
    </DataContext.Provider>
  );
};