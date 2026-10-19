import React from 'react';
import VolunteerApplicationsView from '../../admin/components/VolunteerApplicationsView';

export default function SupervisorVolunteersPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <VolunteerApplicationsView />
      </div>
    </div>
  );
}
