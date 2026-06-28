"use client";

import { useState, useEffect } from "react";
import { BusinessSidebar } from "./business-sidebar";
import { 
  Bell, 
  ChevronDown, 
  Search, 
  Zap,
  Globe,
  Plus,
  Monitor,
  Calendar,
  User,
  CreditCard
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { fetchMyHotel } from "@/lib/api";
import { cn } from "@/lib/utils";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function BusinessLayout({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false);
  const [isNewBookingOpen, setIsNewBookingOpen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  const { data: hotel } = useQuery({
    queryKey: ["my-hotel"],
    queryFn: fetchMyHotel,
  });

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <BusinessSidebar />
      
      <div className="pl-72 flex flex-col min-h-screen">
        {/* Top Navigation */}
        <header className={cn(
          "sticky top-0 z-40 w-full transition-all duration-200 border-b",
          scrolled 
            ? "bg-white/80 backdrop-blur-xl border-slate-200 py-3" 
            : "bg-transparent border-transparent py-5"
        )}>
          <div className="px-8 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-200 transition-colors cursor-pointer group">
                <div className="w-6 h-6 rounded-md bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Monitor className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Active Property</span>
                  <span className="text-sm font-bold text-slate-900 leading-none flex items-center gap-2">
                    {hotel?.name || "Loading..."}
                    <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                  </span>
                </div>
              </div>

              <div className="h-6 w-px bg-slate-200" />
            </div>

            <div className="flex items-center gap-4">
              <Popover>
                <PopoverTrigger asChild>
                  <div className="relative cursor-pointer group">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 group-hover:border-indigo-100 transition-all shadow-sm">
                      <Bell className="w-5 h-5" />
                    </div>
                    <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0 rounded-2xl border-slate-200 shadow-2xl mr-4">
                  <div className="p-4 border-b border-slate-50">
                    <h3 className="text-sm font-bold text-slate-900">Notifications</h3>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-50">
                    <div className="p-4 hover:bg-slate-50 transition-colors cursor-pointer">
                      <p className="text-xs font-bold text-slate-900">New Booking Confirmed</p>
                      <p className="text-[10px] text-slate-500 mt-1">Vansh Gehlot booked Deluxe King • Recently</p>
                    </div>
                    <div className="p-4 hover:bg-slate-50 transition-colors cursor-pointer text-center">
                      <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Mark all as read</button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              <Button 
                onClick={() => setIsNewBookingOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100 rounded-xl px-5"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Booking
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 px-8 pb-12">
          {children}
        </main>
      </div>

      {/* New Booking Modal */}
      <Dialog open={isNewBookingOpen} onOpenChange={setIsNewBookingOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-3xl border-none p-0 overflow-hidden shadow-2xl">
          <div className="p-8 space-y-6">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-slate-900">Create New Reservation</DialogTitle>
              <DialogDescription>Manually add a booking to your hotel system.</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Guest Full Name</Label>
                <Input placeholder="e.g. John Doe" className="bg-slate-50 border-slate-100 rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Check-in</Label>
                    <Input type="date" className="bg-slate-50 border-slate-100 rounded-xl" />
                 </div>
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Check-out</Label>
                    <Input type="date" className="bg-slate-50 border-slate-100 rounded-xl" />
                 </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Room Type</Label>
                <div className="grid grid-cols-2 gap-3 max-h-[200px] overflow-y-auto p-1">
                  {hotel?.rooms && hotel.rooms.length > 0 ? (
                    hotel.rooms.map((room: any) => (
                      <button 
                        key={room.id}
                        onClick={() => setSelectedRoomId(room.id)}
                        type="button"
                        className={cn(
                          "p-3 border-2 rounded-xl text-left transition-all",
                          selectedRoomId === room.id 
                            ? "border-indigo-600 bg-indigo-50" 
                            : "border-slate-100 bg-slate-50 hover:border-slate-200"
                        )}
                      >
                        <p className={cn("text-xs font-bold", selectedRoomId === room.id ? "text-indigo-600" : "text-slate-900")}>
                          {room.name}
                        </p>
                        <p className={cn("text-[10px] mt-1", selectedRoomId === room.id ? "text-indigo-400" : "text-slate-400")}>
                          ₹{Number(room.price).toLocaleString()}/night
                        </p>
                      </button>
                    ))
                  ) : (
                    <div className="col-span-2 p-4 text-center border-2 border-dashed border-slate-200 rounded-xl">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No room types found</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter className="pt-4 flex items-center justify-end gap-3">
              <Button variant="ghost" onClick={() => setIsNewBookingOpen(false)} className="rounded-xl px-6">Cancel</Button>
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-8 shadow-lg shadow-indigo-100">Confirm Booking</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
