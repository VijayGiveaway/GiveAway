// lib/admin-service.ts
export interface AdminStats {
  totalUsers: number;
  todayUsers: number;
  pendingEntries: number;
  verifiedEntries: number;
  completedEntries: number;
  recentEntries: any[];
}

export interface GiveawayEntry {
  id: string;
  name: string;
  email: string;
  phone: string;
  upiId: string;
  otp: string;
  date: string;
  timestamp: Date;
  status: 'pending' | 'verified' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

// Fetch all entries with optional filters
export const fetchEntries = async (filters?: {
  date?: string;
  status?: string;
  limit?: number;
}): Promise<{ success: boolean; entries: GiveawayEntry[]; error?: string }> => {
  try {
    const params = new URLSearchParams();
    if (filters?.date) params.append('date', filters.date);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await fetch(`/api/admin/entries?${params.toString()}`);
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch entries');
    }

    return { success: true, entries: data.entries };
  } catch (error) {
    console.error('Error fetching entries:', error);
    return { success: false, entries: [], error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Fetch dashboard statistics
export const fetchStats = async (): Promise<{ success: boolean; stats?: AdminStats; error?: string }> => {
  try {
    const response = await fetch('/api/admin/stats');
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch statistics');
    }

    return { success: true, stats: data.stats };
  } catch (error) {
    console.error('Error fetching stats:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Update entry status
export const updateEntryStatus = async (
  entryId: string,
  status: 'pending' | 'verified' | 'completed'
): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await fetch(`/api/admin/entries/${entryId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to update entry');
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating entry:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Delete an entry
export const deleteEntry = async (entryId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await fetch(`/api/admin/entries/${entryId}`, {
      method: 'DELETE',
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to delete entry');
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting entry:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Get a specific entry
export const getEntry = async (entryId: string): Promise<{ success: boolean; entry?: GiveawayEntry; error?: string }> => {
  try {
    const response = await fetch(`/api/admin/entries/${entryId}`);
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch entry');
    }

    return { success: true, entry: data.entry };
  } catch (error) {
    console.error('Error fetching entry:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Bulk delete entries
export const bulkDeleteEntries = async (entryIds: string[]): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await fetch('/api/admin/entries/bulk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        operation: 'delete',
        entryIds,
      }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to delete entries');
    }

    return { success: true };
  } catch (error) {
    console.error('Error bulk deleting entries:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Bulk update entry status
export const bulkUpdateEntryStatus = async (
  entryIds: string[],
  status: 'pending' | 'verified' | 'completed'
): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await fetch('/api/admin/entries/bulk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        operation: 'updateStatus',
        entryIds,
        status,
      }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to update entries');
    }

    return { success: true };
  } catch (error) {
    console.error('Error bulk updating entries:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}; 