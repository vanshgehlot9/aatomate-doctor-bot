"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUsers, getTenants, updateUser, deleteUser } from "@/lib/api";
import { AddUserModal } from "@/components/modals/AddUserModal";
import { Loader2, Search, Filter, MoreVertical, Users, ShieldAlert, ShieldCheck, Stethoscope, Briefcase, Edit, Trash2 } from "lucide-react";
import { Role } from "@/lib/rbac";
import { useState } from "react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

export default function UsersPage() {
  const queryClient = useQueryClient();
  const { data: users, isLoading: loadingUsers } = useQuery({
    queryKey: ["users"],
    queryFn: getUsers
  });

  const { data: tenants, isLoading: loadingTenants } = useQuery({
    queryKey: ["tenants"],
    queryFn: getTenants
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ uid, tenantId }: { uid: string, tenantId?: string }) => {
      return deleteUser(uid, tenantId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    }
  });

  const isLoading = loadingUsers || loadingTenants;
  const [searchQuery, setSearchQuery] = useState("");

  const getTenantName = (tenantId: string) => {
    if (!tenantId || tenantId === "global") return "Aatomate Platform";
    const tenant = tenants?.find(t => t.id === tenantId);
    return tenant ? (tenant.hospital_name || tenant.name) : "Unknown Hospital";
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case Role.SUPER_ADMIN:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] md:text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200">
            <ShieldAlert className="w-2.5 h-2.5 md:w-3 md:h-3" />
            Super Admin
          </span>
        );
      case Role.HOSPITAL_ADMIN:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] md:text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
            <ShieldCheck className="w-2.5 h-2.5 md:w-3 md:h-3" />
            Hospital Admin
          </span>
        );
      case Role.DOCTOR:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] md:text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Stethoscope className="w-2.5 h-2.5 md:w-3 md:h-3" />
            Doctor
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] md:text-[11px] font-medium bg-[#F3F4F6] text-[#4B5563] border border-[#E5E7EB] capitalize">
            <Briefcase className="w-2.5 h-2.5 md:w-3 md:h-3" />
            {role.replace("_", " ")}
          </span>
        );
    }
  };

  const filteredUsers = users?.filter(user => {
    const query = searchQuery.toLowerCase();
    return (
      (user.name || "").toLowerCase().includes(query) ||
      (user.email || "").toLowerCase().includes(query) ||
      (user.role || "").toLowerCase().includes(query) ||
      (user.roles?.join(" ") || "").toLowerCase().includes(query)
    );
  });

  const handleDelete = (uid: string, tenantId?: string) => {
    if (confirm("Are you sure you want to remove this user? This action cannot be undone.")) {
      deleteMutation.mutate({ uid, tenantId });
    }
  };

  const handleEditRole = (uid: string) => {
    alert("Role editing will be supported in the EditUserModal.");
    // This is where an EditUserModal state would be toggled
  };

  return (
    <div className="space-y-4 md:space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#111827]">Users</h1>
          <p className="text-[12px] md:text-[13px] text-[#6B7280] mt-1">Manage all registered users and administrators across the platform.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <AddUserModal tenants={tenants || []} triggerText="Invite User" />
        </div>
      </div>

      <div className="bg-white border border-[#E5E7EB] rounded-lg shadow-sm flex flex-col overflow-hidden">
        {/* Table Toolbar */}
        <div className="px-4 md:px-5 py-3 md:py-4 border-b border-[#E5E7EB] flex flex-col sm:flex-row gap-3 md:gap-4 justify-between sm:items-center bg-[#FAFAFA]">
          <div className="relative w-full sm:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-[#9CA3AF]" />
            </div>
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-9 pr-3 py-1.5 border border-[#E5E7EB] rounded-md text-[13px] text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            />
          </div>
          
          <div className="flex items-center justify-between w-full sm:w-auto gap-3">
            <span className="text-[11px] md:text-[12px] text-[#6B7280] font-medium order-2 sm:order-1">
              {filteredUsers?.length || 0} Results
            </span>
            <button className="flex items-center gap-2 px-3 py-1.5 border border-[#E5E7EB] rounded-md text-[12px] md:text-[13px] font-medium text-[#111827] bg-white hover:bg-[#F9FAFB] transition-colors shadow-sm order-1 sm:order-2">
              <Filter className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#6B7280]" />
              Filter
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left border-collapse whitespace-nowrap min-w-[600px]">
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-white">
                <th className="px-4 md:px-5 py-2.5 md:py-3 text-[10px] md:text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">User Details</th>
                <th className="px-4 md:px-5 py-2.5 md:py-3 text-[10px] md:text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">Role</th>
                <th className="px-4 md:px-5 py-2.5 md:py-3 text-[10px] md:text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">Organization</th>
                <th className="px-4 md:px-5 py-2.5 md:py-3 text-[10px] md:text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-5 py-12">
                    <div className="flex flex-col items-center justify-center text-[#6B7280]">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-600 mb-2" />
                      <p className="text-[13px]">Loading users...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers?.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 md:px-5 py-12 md:py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Users className="w-8 h-8 md:w-10 md:h-10 text-[#D1D5DB] mb-3" />
                      <p className="text-[13px] md:text-[14px] font-semibold text-[#111827]">No Users Found</p>
                      <p className="text-[12px] md:text-[13px] text-[#6B7280] mt-1 mb-4 max-w-sm whitespace-normal">
                        {searchQuery ? "We couldn't find any users matching your search criteria." : "Invite your first user to grant them access to the platform."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers?.map((user) => (
                  <tr key={user.uid} className="hover:bg-[#F9FAFB] transition-colors group">
                    <td className="px-4 md:px-5 py-2.5 md:py-3">
                      <div className="flex items-center gap-2 md:gap-3">
                        <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-[#F3F4F6] border border-[#E5E7EB] flex items-center justify-center flex-shrink-0 text-[#6B7280] font-medium text-[10px] md:text-[11px]">
                          {user.name?.substring(0, 2).toUpperCase() || "UN"}
                        </div>
                        <div>
                          <p className="text-[12px] md:text-[13px] font-medium text-[#111827]">{user.name}</p>
                          <p className="text-[10px] md:text-[11px] text-[#6B7280] mt-0.5">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 md:px-5 py-2.5 md:py-3">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-4 md:px-5 py-2.5 md:py-3">
                      <p className="text-[12px] md:text-[13px] font-medium text-[#111827]">{getTenantName(user.tenantId)}</p>
                      {user.tenantId && user.tenantId !== "global" && (
                        <p className="text-[10px] md:text-[11px] text-[#6B7280] font-mono mt-0.5" title={user.tenantId}>ID: {user.tenantId.substring(0, 8)}</p>
                      )}
                    </td>
                    <td className="px-4 md:px-5 py-2.5 md:py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="p-1 md:p-1.5 text-[#9CA3AF] hover:text-[#111827] hover:bg-[#F3F4F6] rounded-md transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100 outline-none">
                          <MoreVertical className="w-4 h-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 bg-white">
                          <DropdownMenuLabel className="text-[10px] text-[#6B7280]">Actions</DropdownMenuLabel>
                          <DropdownMenuItem 
                            className="text-[13px] text-[#111827] cursor-pointer"
                            onClick={() => handleEditRole(user.uid)}
                          >
                            <Edit className="w-3.5 h-3.5 mr-2" />
                            Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-[#E5E7EB]" />
                          <DropdownMenuItem 
                            className="text-[13px] text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                            onClick={() => handleDelete(user.uid, user.tenantId)}
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-2" />
                            Remove User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {filteredUsers && filteredUsers.length > 0 && (
          <div className="px-4 md:px-5 py-3 border-t border-[#E5E7EB] bg-[#FAFAFA] rounded-b-lg flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
            <p className="text-[11px] md:text-[12px] text-[#6B7280]">
              Showing <span className="font-medium text-[#111827]">1</span> to <span className="font-medium text-[#111827]">{filteredUsers.length}</span> of <span className="font-medium text-[#111827]">{filteredUsers.length}</span> results
            </p>
            <div className="flex items-center gap-1 w-full sm:w-auto justify-between sm:justify-end">
              <button disabled className="px-2.5 py-1 md:py-1.5 border border-[#E5E7EB] rounded bg-white text-[#9CA3AF] text-[11px] md:text-[12px] cursor-not-allowed">Previous</button>
              <button disabled className="px-2.5 py-1 md:py-1.5 border border-[#E5E7EB] rounded bg-white text-[#9CA3AF] text-[11px] md:text-[12px] cursor-not-allowed">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
