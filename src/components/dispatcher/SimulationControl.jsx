import React from "react";
import { Badge } from "@/components/ui/badge";
import { Activity } from "lucide-react";
import { useSimulation } from "../contexts/SimulationContext";

export default function SimulationControl() {
  const simulation = useSimulation();

  return (
    <div className="flex items-center gap-2">
      {simulation.isActive && (
        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 animate-pulse">
          <Activity className="w-3 h-3 mr-1" />
          DEMO ACTIVE
        </Badge>
      )}
    </div>
  );
}