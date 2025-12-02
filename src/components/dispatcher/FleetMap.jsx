import React from "react";
import TomTomMap from "../maps/TomTomMap";

export default function FleetMap({ vehicles, rides, center, title }) {
  return (
    <TomTomMap
      vehicles={vehicles}
      rides={rides}
      center={center}
      zoom={13}
      height="500px"
      title={title || "Fleet Management & Live Traffic"}
    />
  );
}