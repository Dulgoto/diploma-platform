import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import "leaflet/dist/leaflet.css";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function isValidCoordinate(value) {
  const n = Number(value);
  return Number.isFinite(n);
}

export default function AdLocationMap({ latitude, longitude, location, title }) {
  const lat = Number(latitude);
  const lng = Number(longitude);
  const hasValidCoordinates = isValidCoordinate(lat) && isValidCoordinate(lng);

  if (!hasValidCoordinates) {
    return (
      <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
        Няма зададени координати за тази обява.
      </p>
    );
  }

  const position = [lat, lng];
  const popupTitle = title?.trim() || "Обява";
  const popupLocation = location?.trim() || "—";

  return (
    <div className="h-[220px] overflow-hidden rounded-xl border border-slate-200">
      <MapContainer
        key={`${lat}-${lng}`}
        center={position}
        zoom={13}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position}>
          <Popup>
            <div className="text-sm">
              <p className="font-semibold text-slate-900">{popupTitle}</p>
              <p className="mt-1 text-slate-600">{popupLocation}</p>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
