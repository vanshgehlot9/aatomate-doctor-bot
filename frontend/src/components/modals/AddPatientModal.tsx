"use client";

import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

interface AddPatientModalProps {
  trigger?: React.ReactNode;
}

export function AddPatientModal({ trigger }: AddPatientModalProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState<number | "">("");
  const [gender, setGender] = useState("");
  
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/patients/", {
        name,
        phone,
        age: age ? Number(age) : null,
        gender
      });

      queryClient.invalidateQueries({ queryKey: ["patients"] });
      toast.success("Patient registered successfully!");
      setOpen(false);
      setName("");
      setPhone("");
      setAge("");
      setGender("");
    } catch (error: any) {
      let errorMessage = "Failed to register patient";
      if (error.response?.data?.detail) {
        errorMessage = typeof error.response.data.detail === "string" 
          ? error.response.data.detail 
          : "Invalid data";
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        {trigger || (
          <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm gap-2">
            <Plus className="w-4 h-4" />
            Add Patient
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Register New Patient</DialogTitle>
          <DialogDescription>
            Enter the patient's details below to create a new medical record.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. John Doe" />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number *</Label>
            <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="+1 234 567 890" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input 
                id="age" 
                type="number"
                min="0"
                value={age} 
                onChange={(e) => setAge(e.target.value ? parseInt(e.target.value) : "")} 
                placeholder="Years"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select value={gender} onValueChange={(v) => setGender(v || "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !name || !phone}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Register Patient
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
