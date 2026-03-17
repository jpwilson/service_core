export { supabase, getSupabaseClient } from './client';

export {
  fetchEmployees,
  fetchEmployeeById,
} from './queries/employees';

export {
  fetchTimeEntries,
  fetchTimeEntriesByEmployee,
  createTimeEntry,
  updateTimeEntry,
  clockIn,
  clockOut,
  approveTimesheet,
  rejectTimesheet,
} from './queries/timeEntries';

export {
  fetchProjects,
  fetchProjectById,
} from './queries/projects';

export {
  fetchSettings,
  updateSettings,
} from './queries/settings';
