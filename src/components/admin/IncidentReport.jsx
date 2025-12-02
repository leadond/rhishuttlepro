import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, AlertTriangle, User, MapPin, Clock } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const INCIDENT_TYPES = [
  "accident",
  "medical_emergency",
  "vehicle_breakdown",
  "passenger_incident",
  "traffic_violation",
  "property_damage",
  "theft",
  "other"
];

const SEVERITY_LEVELS = ["low", "medium", "high", "critical"];

export default function IncidentReport({ onSubmit }) {
  const [formData, setFormData] = useState({
    incident_type: '',
    severity: 'medium',
    date: new Date(),
    time: format(new Date(), 'HH:mm'),
    location: '',
    description: '',
    involved_parties: '',
    actions_taken: '',
    follow_up_required: false,
    follow_up_notes: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.incident_type || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    const incidentData = {
      ...formData,
      timestamp: new Date(
        formData.date.getFullYear(),
        formData.date.getMonth(),
        formData.date.getDate(),
        ...formData.time.split(':').map(Number)
      ).toISOString(),
      status: 'open',
      reported_by: 'admin', // Would be replaced with actual user
      reported_at: new Date().toISOString()
    };

    onSubmit(incidentData);
    toast.success('Incident report submitted successfully');
    // Reset form
    setFormData({
      incident_type: '',
      severity: 'medium',
      date: new Date(),
      time: format(new Date(), 'HH:mm'),
      location: '',
      description: '',
      involved_parties: '',
      actions_taken: '',
      follow_up_required: false,
      follow_up_notes: ''
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <AlertTriangle className="w-8 h-8 text-red-600" />
        <h2 className="text-2xl font-bold">Incident Report</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="incident_type">Incident Type *</Label>
            <Select
              value={formData.incident_type}
              onValueChange={(value) => setFormData({...formData, incident_type: value})}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select incident type" />
              </SelectTrigger>
              <SelectContent>
                {INCIDENT_TYPES.map(type => (
                  <SelectItem key={type} value={type}>
                    {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="severity">Severity Level *</Label>
            <Select
              value={formData.severity}
              onValueChange={(value) => setFormData({...formData, severity: value})}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select severity" />
              </SelectTrigger>
              <SelectContent>
                {SEVERITY_LEVELS.map(level => (
                  <SelectItem key={level} value={level}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Date of Incident *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.date ? format(formData.date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.date}
                  onSelect={(date) => setFormData({...formData, date})}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label htmlFor="time">Time of Incident *</Label>
            <Input
              type="time"
              value={formData.time}
              onChange={(e) => setFormData({...formData, time: e.target.value})}
              required
            />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="location">Location</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
              <Input
                id="location"
                placeholder="Enter location details"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                className="pl-10"
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="description">Description of Incident *</Label>
            <Textarea
              id="description"
              placeholder="Provide a detailed description of what happened..."
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={4}
              required
            />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="involved_parties">Involved Parties</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
              <Input
                id="involved_parties"
                placeholder="Names and roles of involved parties"
                value={formData.involved_parties}
                onChange={(e) => setFormData({...formData, involved_parties: e.target.value})}
                className="pl-10"
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="actions_taken">Immediate Actions Taken</Label>
            <Textarea
              id="actions_taken"
              placeholder="Describe any immediate actions taken in response to the incident..."
              value={formData.actions_taken}
              onChange={(e) => setFormData({...formData, actions_taken: e.target.value})}
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="follow_up_required"
              checked={formData.follow_up_required}
              onChange={(e) => setFormData({...formData, follow_up_required: e.target.checked})}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <Label htmlFor="follow_up_required">Follow-up Required</Label>
          </div>

          {formData.follow_up_required && (
            <div className="md:col-span-2">
              <Label htmlFor="follow_up_notes">Follow-up Notes</Label>
              <Textarea
                id="follow_up_notes"
                placeholder="Describe what follow-up actions are required..."
                value={formData.follow_up_notes}
                onChange={(e) => setFormData({...formData, follow_up_notes: e.target.value})}
                rows={2}
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={() => {
            setFormData({
              incident_type: '',
              severity: 'medium',
              date: new Date(),
              time: format(new Date(), 'HH:mm'),
              location: '',
              description: '',
              involved_parties: '',
              actions_taken: '',
              follow_up_required: false,
              follow_up_notes: ''
            });
          }}>
            Clear Form
          </Button>
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
            Submit Report
          </Button>
        </div>
      </form>
    </div>
  );
}