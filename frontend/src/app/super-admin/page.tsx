"use client";

import { Building2, Users, ArrowUpRight, Plus, ExternalLink, MoreVertical } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getTenants, getUsers } from "@/lib/api";
import { Role } from "@/lib/rbac";
import { AddHospitalModal } from "@/components/modals/AddHospitalModal";
import { AddUserModal } from "@/components/modals/AddUserModal";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export default function SuperAdminDashboard() {
  const { data: tenants, isLoading: loadingTenants } = useQuery({
    queryKey: ["tenants"],
    queryFn: getTenants
  });

  const { data: users, isLoading: loadingUsers } = useQuery({
    queryKey: ["users"],
    queryFn: getUsers
  });

  const totalHospitals = tenants?.length || 0;
  const activeTenants = tenants?.filter(t => t.is_active).length || 0;
  const totalUsers = users?.length || 0;
  
  // Calculate roles
  const superAdmins = users?.filter(u => u.role === Role.SUPER_ADMIN).length || 0;
  const hospitalAdmins = users?.filter(u => u.role === Role.HOSPITAL_ADMIN).length || 0;

  // Recent hospitals (top 5)
  const recentHospitals = tenants?.slice(0, 5) || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Dashboard Hero */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#111827]">Platform Overview</h1>
          <p className="text-[13px] text-[#6B7280] mt-1">
            Manage hospitals, subscriptions, platform health and global operations.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <AddUserModal tenants={tenants || []} fixedRole={Role.SUPER_ADMIN} triggerText="Invite Admin" />
          <AddHospitalModal />
          <button className="hidden sm:flex items-center justify-center px-3 py-1.5 border border-[#E5E7EB] bg-white text-[#111827] text-[13px] font-medium rounded-md hover:bg-[#F9FAFB] transition-colors shadow-sm">
            Export Analytics
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-3 md:p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2 md:mb-4">
            <h3 className="text-[12px] md:text-[13px] font-medium text-[#6B7280]">Total Hospitals</h3>
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-md bg-blue-50 flex items-center justify-center text-blue-600">
              <Building2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl md:text-2xl font-bold text-[#111827]">
                {loadingTenants ? "..." : totalHospitals}
              </span>
              <span className="text-[10px] md:text-[11px] font-medium text-green-600 flex items-center">
                <ArrowUpRight className="w-2.5 h-2.5 md:w-3 md:h-3 mr-0.5" /> {activeTenants}
              </span>
            </div>
            <p className="text-[10px] md:text-[11px] text-[#9CA3AF] mt-1 hidden sm:block">Registered organizations</p>
          </div>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-lg p-3 md:p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2 md:mb-4">
            <h3 className="text-[12px] md:text-[13px] font-medium text-[#6B7280]">Active Users</h3>
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-md bg-blue-50 flex items-center justify-center text-blue-600">
              <Users className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl md:text-2xl font-bold text-[#111827]">
                {loadingUsers ? "..." : totalUsers}
              </span>
            </div>
            <p className="text-[10px] md:text-[11px] text-[#9CA3AF] mt-1 hidden sm:block">Registered accounts</p>
          </div>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-lg p-3 md:p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2 md:mb-4">
            <h3 className="text-[12px] md:text-[13px] font-medium text-[#6B7280]">Hospital Admins</h3>
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-md bg-amber-50 flex items-center justify-center text-amber-600">
              <Users className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl md:text-2xl font-bold text-[#111827]">
                {loadingUsers ? "..." : hospitalAdmins}
              </span>
            </div>
            <p className="text-[10px] md:text-[11px] text-[#9CA3AF] mt-1 hidden sm:block">Tenant managers</p>
          </div>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-lg p-3 md:p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2 md:mb-4">
            <h3 className="text-[12px] md:text-[13px] font-medium text-[#6B7280]">Super Admins</h3>
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-md bg-purple-50 flex items-center justify-center text-purple-600">
              <Users className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl md:text-2xl font-bold text-[#111827]">
                {loadingUsers ? "..." : superAdmins}
              </span>
            </div>
            <p className="text-[10px] md:text-[11px] text-[#9CA3AF] mt-1 hidden sm:block">Platform administrators</p>
          </div>
        </div>
      </div>

      {/* Dashboard Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Recent Hospitals Table */}
        <div className="lg:col-span-2 bg-white border border-[#E5E7EB] rounded-lg shadow-sm flex flex-col overflow-hidden">
          <div className="px-4 md:px-5 py-3 md:py-4 border-b border-[#E5E7EB] flex items-center justify-between">
            <h2 className="text-[13px] md:text-[14px] font-semibold text-[#111827]">Recent Hospitals</h2>
            <Link href="/super-admin/hospitals" className="text-[11px] md:text-[12px] font-medium text-blue-600 hover:text-blue-700">
              View All
            </Link>
          </div>
          
          <div className="flex-1 overflow-x-auto scrollbar-hide">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-[#FAFAFA]">
                  <th className="px-4 md:px-5 py-2.5 md:py-3 text-[10px] md:text-[11px] font-medium text-[#6B7280] uppercase tracking-wider">Hospital</th>
                  <th className="px-4 md:px-5 py-2.5 md:py-3 text-[10px] md:text-[11px] font-medium text-[#6B7280] uppercase tracking-wider">Owner</th>
                  <th className="px-4 md:px-5 py-2.5 md:py-3 text-[10px] md:text-[11px] font-medium text-[#6B7280] uppercase tracking-wider">Status</th>
                  <th className="px-4 md:px-5 py-2.5 md:py-3 text-[10px] md:text-[11px] font-medium text-[#6B7280] uppercase tracking-wider">Created</th>
                  <th className="px-4 md:px-5 py-2.5 md:py-3 text-[10px] md:text-[11px] font-medium text-[#6B7280] uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {loadingTenants ? (
                  <tr>
                    <td colSpan={5} className="px-4 md:px-5 py-6 md:py-8 text-center text-[12px] md:text-[13px] text-[#6B7280]">
                      Loading hospitals...
                    </td>
                  </tr>
                ) : recentHospitals.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 md:px-5 py-6 md:py-8 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <Building2 className="w-6 h-6 md:w-8 md:h-8 text-[#D1D5DB] mb-2" />
                        <p className="text-[12px] md:text-[13px] font-medium text-[#111827]">No Hospitals Yet</p>
                        <p className="text-[11px] md:text-[12px] text-[#6B7280] mt-1 mb-2 md:mb-4">Create your first hospital to onboard customers.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  recentHospitals.map(hospital => (
                    <tr key={hospital.id} className="hover:bg-[#F9FAFB] transition-colors group">
                      <td className="px-4 md:px-5 py-2 md:py-3">
                        <p className="text-[12px] md:text-[13px] font-medium text-[#111827]">{hospital.hospital_name || hospital.name}</p>
                        <p className="text-[10px] md:text-[11px] text-[#6B7280] truncate max-w-[120px] md:max-w-[150px]" title={hospital.id}>{hospital.id.substring(0, 8)}...</p>
                      </td>
                      <td className="px-4 md:px-5 py-2 md:py-3">
                        <p className="text-[12px] md:text-[13px] text-[#111827]">{hospital.name}</p>
                        <p className="text-[10px] md:text-[11px] text-[#6B7280]">{hospital.email}</p>
                      </td>
                      <td className="px-4 md:px-5 py-2 md:py-3">
                        {hospital.is_active ? (
                          <span className="inline-flex items-center px-1.5 md:px-2 py-0.5 rounded-full text-[9px] md:text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-1.5 md:px-2 py-0.5 rounded-full text-[9px] md:text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-4 md:px-5 py-2 md:py-3 text-[11px] md:text-[12px] text-[#6B7280]">
                        {hospital.created_at ? formatDistanceToNow(new Date(hospital.created_at), { addSuffix: true }) : 'Unknown'}
                      </td>
                      <td className="px-4 md:px-5 py-2 md:py-3 text-right">
                        <Link 
                          href="/super-admin/hospitals"
                          className="p-1 md:p-1.5 text-[#9CA3AF] hover:text-[#111827] rounded transition-colors inline-flex"
                        >
                          <MoreVertical className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Management */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg shadow-sm">
          <div className="px-5 py-4 border-b border-[#E5E7EB]">
            <h2 className="text-[14px] font-semibold text-[#111827]">Quick Management</h2>
          </div>
          <div className="p-2">
            <div className="flex flex-col space-y-1">
              <AddHospitalModal 
                customTrigger={
                  <button className="w-full flex items-center justify-between px-3 py-2.5 rounded-md hover:bg-[#F9FAFB] text-left transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded bg-blue-50 flex items-center justify-center text-blue-600">
                        <Building2 className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="text-[13px] font-medium text-[#111827]">Create Hospital</p>
                        <p className="text-[11px] text-[#6B7280]">Onboard a new clinic</p>
                      </div>
                    </div>
                    <Plus className="w-4 h-4 text-[#9CA3AF] group-hover:text-blue-600 transition-colors" />
                  </button>
                } 
              />

              <AddUserModal 
                tenants={tenants || []}
                customTrigger={
                  <button className="w-full flex items-center justify-between px-3 py-2.5 rounded-md hover:bg-[#F9FAFB] text-left transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded bg-indigo-50 flex items-center justify-center text-indigo-600">
                        <Users className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="text-[13px] font-medium text-[#111827]">Invite Admin</p>
                        <p className="text-[11px] text-[#6B7280]">Add platform managers</p>
                      </div>
                    </div>
                    <Plus className="w-4 h-4 text-[#9CA3AF] group-hover:text-indigo-600 transition-colors" />
                  </button>
                }
              />

              <Link href="/super-admin/billing" className="flex items-center justify-between px-3 py-2.5 rounded-md hover:bg-[#F9FAFB] text-left transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-[#111827]">View Billing</p>
                    <p className="text-[11px] text-[#6B7280]">Manage subscriptions</p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-[#9CA3AF] group-hover:text-emerald-600 transition-colors" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
