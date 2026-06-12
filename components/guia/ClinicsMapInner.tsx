'use client'

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { divIcon } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { MapPin } from './ClinicsMap'

// Pin propio navy/gold (evita los assets rotos del icono default de Leaflet)
const pinIcon = divIcon({
  className: '',
  html: `<div style="width:26px;height:26px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#001450;border:2px solid #F0B414;box-shadow:0 2px 6px rgba(0,0,0,.3)"></div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 26],
  popupAnchor: [0, -24],
})

export default function ClinicsMapInner({ pins }: { pins: MapPin[] }) {
  const lats = pins.map((p) => p.latitude)
  const lngs = pins.map((p) => p.longitude)
  const center: [number, number] = [
    (Math.min(...lats) + Math.max(...lats)) / 2,
    (Math.min(...lngs) + Math.max(...lngs)) / 2,
  ]
  const zoom = pins.length === 1 ? 15 : 12

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom={false}
      className="w-full h-72 rounded-xl z-0"
      style={{ zIndex: 0 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {pins.map((pin, i) => (
        <Marker key={i} position={[pin.latitude, pin.longitude]} icon={pinIcon}>
          <Popup>
            <strong>{pin.label}</strong>
            {pin.sublabel && (
              <>
                <br />
                {pin.sublabel}
              </>
            )}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
