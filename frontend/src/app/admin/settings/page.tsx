"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Save, MapPin, Building, Map } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyTenant, updateMyTenant } from "@/lib/api";
import { toast } from "sonner";
import { Tenant } from "@/types/api";

export default function ClinicSettingsPage() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Partial<Tenant>>({});

  const { data: tenant, isLoading } = useQuery({
    queryKey: ["my-tenant"],
    queryFn: getMyTenant
  });

  useEffect(() => {
    if (tenant) {
      setFormData({
        hospital_name: tenant.hospital_name || "",
        clinic_address: tenant.clinic_address || "",
        room_floor: tenant.room_floor || "",
        latitude: tenant.latitude || 28.6139,
        longitude: tenant.longitude || 77.2090,
      });
    }
  }, [tenant]);

  const mutation = useMutation({
    mutationFn: (data: Partial<Tenant>) => updateMyTenant(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-tenant"] });
      toast.success("Clinic profile updated successfully!");
    },
    onError: () => {
      toast.error("Failed to update clinic profile.");
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === "latitude" || name === "longitude" ? parseFloat(value) : value 
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Clinic Settings</h1>
        <p className="text-slate-500 mt-2">Manage your public clinic profile for WhatsApp interactions.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="border shadow-sm bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building className="w-5 h-5 text-blue-500" />
              Location & Details
            </CardTitle>
            <CardDescription>
              These details are sent to patients via WhatsApp when their appointment is confirmed.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Clinic Name</label>
              <Input 
                name="hospital_name"
                value={formData.hospital_name || ""}
                onChange={handleChange}
                placeholder="e.g. Aatomate LLP Clinic"
                className="bg-white dark:bg-slate-950"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-slate-400" />
                Full Address
              </label>
              <Input 
                name="clinic_address"
                value={formData.clinic_address || ""}
                onChange={handleChange}
                placeholder="e.g. Connaught Place, New Delhi"
                className="bg-white dark:bg-slate-950"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Floor & Room Number</label>
              <Input 
                name="room_floor"
                value={formData.room_floor || ""}
                onChange={handleChange}
                placeholder="e.g. Floor 2, Room 204"
                className="bg-white dark:bg-slate-950"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="col-span-2 mb-1">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Map className="w-4 h-4 text-slate-400" />
                  Map Coordinates (For WhatsApp Location Pin)
                </label>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-slate-500 font-medium uppercase tracking-wider">Latitude</label>
                <Input 
                  name="latitude"
                  type="number"
                  step="0.000001"
                  value={formData.latitude || ""}
                  onChange={handleChange}
                  placeholder="28.6139"
                  className="bg-white dark:bg-slate-950"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-slate-500 font-medium uppercase tracking-wider">Longitude</label>
                <Input 
                  name="longitude"
                  type="number"
                  step="0.000001"
                  value={formData.longitude || ""}
                  onChange={handleChange}
                  placeholder="77.2090"
                  className="bg-white dark:bg-slate-950"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 flex justify-end">
          <Button 
            type="submit" 
            disabled={mutation.isPending}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-md rounded-full px-8 h-12"
          >
            {mutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <Save className="w-5 h-5 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
