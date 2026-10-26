import "./organic.css";
import "./base.css";

export const metadata = { title: "Wayfarer — Trip Planner", description: "Itineraries with videos, transport and final price" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
