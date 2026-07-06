"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTenants, updateTenant, deleteTenant } from "@/lib/api";
import { AddHospitalModal } from "@/components/modals/AddHospitalModal";
import { Loader2, Search, Filter, MoreVertical, Building2, MapPin, Edit, Power, Trash2 } from "lucide-react";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

export default function HospitalsPage() {
  const queryClient = useQueryClient();
  const { data: tenants, isLoading } = useQuery({
    queryKey: ["tenants"],
    queryFn: getTenants
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      return updateTenant(id, { is_active });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return deleteTenant(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
    }
  });

  const [searchQuery, setSearchQuery] = useState("");

  const filteredTenants = tenants?.filter(tenant => {
    const query = searchQuery.toLowerCase();
    return (
      (tenant.hospital_name || "").toLowerCase().includes(query) ||
      (tenant.name || "").toLowerCase().includes(query) ||
      (tenant.email || "").toLowerCase().includes(query)
    );
  });

  const handleToggleStatus = (id: string, currentStatus: boolean) => {
    toggleStatusMutation.mutate({ id, is_active: !currentStatus });
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this hospital? This action cannot be undone.")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#111827]">Hospitals</h1>
          <p className="text-[12px] md:text-[13px] text-[#6B7280] mt-1">Manage all registered hospital tenants on the platform.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <AddHospitalModal />
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
              placeholder="Search hospitals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-9 pr-3 py-1.5 md:py-1.5 border border-[#E5E7EB] rounded-md text-[13px] text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            />
          </div>
          
          <div className="flex items-center justify-between w-full sm:w-auto gap-3">
            <span className="text-[11px] md:text-[12px] text-[#6B7280] font-medium order-2 sm:order-1">
              {filteredTenants?.length || 0} Results
            </span>
            <button className="flex items-center justify-center gap-2 px-3 py-1.5 border border-[#E5E7EB] rounded-md text-[12px] md:text-[13px] font-medium text-[#111827] bg-white hover:bg-[#F9FAFB] transition-colors shadow-sm order-1 sm:order-2">
              <Filter className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#6B7280]" />
              Filter
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left border-collapse whitespace-nowrap min-w-[700px]">
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-white">
                <th className="px-4 md:px-5 py-2.5 md:py-3 text-[10px] md:text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">Hospital Details</th>
                <th className="px-4 md:px-5 py-2.5 md:py-3 text-[10px] md:text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">Contact</th>
                <th className="px-4 md:px-5 py-2.5 md:py-3 text-[10px] md:text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">Location</th>
                <th className="px-4 md:px-5 py-2.5 md:py-3 text-[10px] md:text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">Status</th>
                <th className="px-4 md:px-5 py-2.5 md:py-3 text-[10px] md:text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">Created</th>
                <th className="px-4 md:px-5 py-2.5 md:py-3 text-[10px] md:text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12">
                    <div className="flex flex-col items-center justify-center text-[#6B7280]">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-600 mb-2" />
                      <p className="text-[13px]">Loading hospitals...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredTenants?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 md:px-5 py-12 md:py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Building2 className="w-8 h-8 md:w-10 md:h-10 text-[#D1D5DB] mb-3" />
                      <p className="text-[13px] md:text-[14px] font-semibold text-[#111827]">No Hospitals Found</p>
                      <p className="text-[12px] md:text-[13px] text-[#6B7280] mt-1 mb-4 max-w-sm whitespace-normal">
                        {searchQuery ? "We couldn't find any hospitals matching your search criteria." : "Create your first hospital to onboard customers and start managing their operations."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTenants?.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-[#F9FAFB] transition-colors group">
                    <td className="px-4 md:px-5 py-2.5 md:py-3">
                      <div className="flex items-center gap-2 md:gap-3">
                        <div className="w-7 h-7 md:w-8 md:h-8 rounded bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0 text-blue-600">
                          <Building2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        </div>
                        <div>
                          <p className="text-[12px] md:text-[13px] font-medium text-[#111827]">{tenant.hospital_name || tenant.name}</p>
                          <p className="text-[10px] md:text-[11px] text-[#6B7280] font-mono mt-0.5" title={tenant.id}>ID: {tenant.id.substring(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 md:px-5 py-2.5 md:py-3">
                      <p className="text-[12px] md:text-[13px] text-[#111827]">{tenant.name}</p>
                      <p className="text-[10px] md:text-[11px] text-[#6B7280]">{tenant.email || "No email"}</p>
                      <p className="text-[10px] md:text-[11px] text-[#6B7280]">{tenant.phone_number || "No phone"}</p>
                    </td>
                    <td className="px-4 md:px-5 py-2.5 md:py-3">
                      <div className="flex items-center gap-1.5 text-[11px] md:text-[12px] text-[#6B7280]">
                        <MapPin className="w-3 h-3 md:w-3.5 md:h-3.5 text-[#9CA3AF]" />
                        {tenant.clinic_address ? (
                          <span className="truncate max-w-[120px] md:max-w-[150px]">{tenant.clinic_address}</span>
                        ) : (
                          <span>Unspecified</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 md:px-5 py-2.5 md:py-3">
                      {tenant.is_active ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] md:text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] md:text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-4 md:px-5 py-2.5 md:py-3 text-[11px] md:text-[12px] text-[#6B7280]">
                      {tenant.created_at ? formatDistanceToNow(new Date(tenant.created_at), { addSuffix: true }) : 'Unknown'}
                    </td>
                    <td className="px-4 md:px-5 py-2.5 md:py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="p-1.5 text-[#9CA3AF] hover:text-[#111827] hover:bg-[#F3F4F6] rounded-md transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100 outline-none">
                          <MoreVertical className="w-4 h-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 bg-white">
                          <DropdownMenuLabel className="text-[10px] text-[#6B7280]">Actions</DropdownMenuLabel>
                          <DropdownMenuItem className="text-[13px] text-[#111827] cursor-pointer">
                            <Edit className="w-3.5 h-3.5 mr-2" />
                            Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-[13px] text-[#111827] cursor-pointer"
                            onClick={() => handleToggleStatus(tenant.id, tenant.is_active)}
                          >
                            <Power className="w-3.5 h-3.5 mr-2" />
                            {tenant.is_active ? "Deactivate" : "Activate"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-[#E5E7EB]" />
                          <DropdownMenuItem 
                            className="text-[13px] text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                            onClick={() => handleDelete(tenant.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-2" />
                            Delete Hospital
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
        {filteredTenants && filteredTenants.length > 0 && (
          <div className="px-4 md:px-5 py-3 border-t border-[#E5E7EB] bg-[#FAFAFA] rounded-b-lg flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
            <p className="text-[11px] md:text-[12px] text-[#6B7280]">
              Showing <span className="font-medium text-[#111827]">1</span> to <span className="font-medium text-[#111827]">{filteredTenants.length}</span> of <span className="font-medium text-[#111827]">{filteredTenants.length}</span> results
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
