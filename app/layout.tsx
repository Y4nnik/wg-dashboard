import "./globals.css";

export const metadata = {
  title: "WG Dashboard",
  description: "Busse und Müllabholung für unsere WG",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}