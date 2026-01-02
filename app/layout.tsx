import "./globals.css";

export const metadata = {
  title: "ShowRate - 공연 평가 플랫폼",
  description: "무대 공연(뮤지컬, 연극)을 평가하고 공유하는 플랫폼",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

