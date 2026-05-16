import { useMemo } from "react";
import { Link } from "react-router-dom";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import "leaflet/dist/leaflet.css";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { getImageUrl } from "../utils/imageUtils.js";

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

function formatPriceEur(price) {
  if (price == null || Number.isNaN(Number(price))) {
    return "— €";
  }
  const n = Number(price);
  const formatted = n.toLocaleString("bg-BG", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  return `${formatted} €`;
}

export default function AdsMap({ ads }) {
  const mappedAds = useMemo(() => {
    if (!Array.isArray(ads)) {
      return [];
    }
    return ads.filter((ad) => isValidCoordinate(ad.latitude) && isValidCoordinate(ad.longitude));
  }, [ads]);

  if (mappedAds.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500 shadow-sm">
        Няма обяви с налична локация за показване на картата.
      </p>
    );
  }

  const first = mappedAds[0];
  const center = [Number(first.latitude), Number(first.longitude)];
  const mapKey = mappedAds.map((ad) => ad.id).join("-");

  return (
    <div className="relative z-0 overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
      <MapContainer
        key={mapKey}
        center={center}
        zoom={8}
        scrollWheelZoom
        className="h-[420px] w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {mappedAds.map((ad) => {
          const position = [Number(ad.latitude), Number(ad.longitude)];
          const title = ad.title?.trim() || "Обява";
          const meta = [ad.category, ad.location].filter(Boolean).join(" · ") || "—";
          const sortedImages = [...(ad.images || [])].sort(
            (a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0),
          );
          const firstKey = sortedImages[0]?.imageKey;
          const imgUrl = firstKey ? getImageUrl(firstKey) : "";

          return (
            <Marker key={ad.id} position={position}>
              <Popup>
                <div className="text-sm">
                  {imgUrl ? (
                    <img
                      src={imgUrl}
                      alt=""
                      className="mb-2 h-24 w-full rounded-lg object-cover"
                    />
                  ) : null}
                  <p className="font-semibold text-slate-900">{title}</p>
                  <p className="mt-1 font-medium text-emerald-700">{formatPriceEur(ad.price)}</p>
                  <p className="mt-1 text-slate-600">{meta}</p>
                  <Link
                    to={`/ads/${ad.id}`}
                    className="mt-2 inline-block font-medium text-emerald-700 hover:underline"
                  >
                    Виж обявата
                  </Link>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
