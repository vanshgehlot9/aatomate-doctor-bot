"use client";

import React, { useState } from "react";
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
import { createTenant } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AddHospitalModalProps {
  customTrigger?: React.ReactNode;
}

export function AddHospitalModal({ customTrigger }: AddHospitalModalProps = {}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [hospitalName, setHospitalName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createTenant({ 
        name, 
        hospital_name: hospitalName, 
        email, 
        phone_number: phoneNumber 
      });
      toast.success("Hospital created successfully!");
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      setOpen(false);
      setName("");
      setHospitalName("");
      setEmail("");
      setPhoneNumber("");
    } catch (error: any) {
      toast.error(error.message || "Failed to create hospital");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {customTrigger ? (
        // Render custom trigger outside Dialog to avoid nested <button> issue with base-ui
        React.cloneElement(customTrigger as React.ReactElement<any>, {
          onClick: (e: React.MouseEvent) => {
            (customTrigger as React.ReactElement<any>).props.onClick?.(e);
            setOpen(true);
          }
        })
      ) : null}
      <Dialog open={open} onOpenChange={setOpen}>
        {!customTrigger && (
          <DialogTrigger className={cn(buttonVariants({ className: "gap-2" }))}>
            <Plus className="w-4 h-4" />
            Add Hospital
          </DialogTrigger>
        )}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Hospital</DialogTitle>
          <DialogDescription>
            Register a new hospital tenant in the platform.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="hospitalName">Hospital Name</Label>
            <Input 
              id="hospitalName" 
              value={hospitalName} 
              onChange={(e) => setHospitalName(e.target.value)} 
              placeholder="e.g. City General Hospital" 
              required 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Owner/Admin Name</Label>
            <Input 
              id="name" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="e.g. Dr. John Doe" 
              required 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Contact Email</Label>
            <Input 
              id="email" 
              type="email"
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="admin@hospital.com" 
              required 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Contact Phone</Label>
            <Input 
              id="phone" 
              value={phoneNumber} 
              onChange={(e) => setPhoneNumber(e.target.value)} 
              placeholder="+1234567890" 
              required 
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !hospitalName || !name || !email || !phoneNumber}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    </>
  );
}
